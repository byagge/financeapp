#!/usr/bin/env bash
# Safe deploy for finance.arix.vu into /opt/finance
# Does NOT modify other /opt projects, other nginx sites, or other PM2 apps.
set -euo pipefail

APP_DIR="/opt/finance"
APP_NAME="finance"
APP_PORT="3010"
DOMAIN="finance.arix.vu"
REPO_URL="${REPO_URL:-https://github.com/byagge/financeapp.git}"
BRANCH="${BRANCH:-main}"

echo "==> Preflight: ensure port ${APP_PORT} is free"
if ss -tlnp 2>/dev/null | grep -q ":${APP_PORT} "; then
  echo "ERROR: port ${APP_PORT} is already in use. Pick another port and update:"
  echo "  - ecosystem.config.cjs"
  echo "  - deploy/nginx-finance.arix.vu.conf"
  echo "  - .env.local (PORT)"
  ss -tlnp | grep ":${APP_PORT} " || true
  exit 1
fi

echo "==> Preflight: list other /opt projects (read-only)"
ls -la /opt || true

echo "==> Install OS packages (idempotent)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y build-essential python3 git curl nginx

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

echo "==> Clone/update ONLY ${APP_DIR}"
if [ -d "${APP_DIR}/.git" ]; then
  git -C "${APP_DIR}" fetch --all --prune
  git -C "${APP_DIR}" checkout "${BRANCH}"
  git -C "${APP_DIR}" pull --ff-only origin "${BRANCH}"
else
  if [ -e "${APP_DIR}" ] && [ ! -d "${APP_DIR}/.git" ]; then
    echo "ERROR: ${APP_DIR} exists but is not a git repo. Aborting to avoid overwrite."
    exit 1
  fi
  git clone -b "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
fi

cd "${APP_DIR}"

if [ ! -f .env.local ]; then
  echo "==> Creating .env.local (edit secrets after setup)"
  SECRET="$(openssl rand -base64 32)"
  cat > .env.local <<EOF
AUTH_SECRET=${SECRET}
AUTH_URL=https://${DOMAIN}
NEXTAUTH_URL=https://${DOMAIN}
ADMIN_EMAIL=admin@${DOMAIN}
ADMIN_PASSWORD=$(openssl rand -base64 12)
ADMIN_NAME=Admin
PORT=${APP_PORT}
HOST=127.0.0.1
NODE_ENV=production
EOF
  echo "Wrote ${APP_DIR}/.env.local — save ADMIN_PASSWORD from this file."
else
  echo "==> Keeping existing .env.local"
fi

echo "==> Install & build"
npm ci
npm run build

mkdir -p "${APP_DIR}/data"
chmod 700 "${APP_DIR}/data"

echo "==> Start/reload ONLY pm2 app '${APP_NAME}'"
if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --only "${APP_NAME}" --update-env
else
  pm2 start ecosystem.config.cjs --only "${APP_NAME}"
fi
pm2 save
# Do not run pm2 startup if already configured for other apps; safe to re-run:
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

echo "==> Nginx site for ${DOMAIN} only"
SITE_SRC="${APP_DIR}/deploy/nginx-finance.arix.vu.conf"
SITE_AVAIL="/etc/nginx/sites-available/${DOMAIN}"
SITE_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"

cp "${SITE_SRC}" "${SITE_AVAIL}"
ln -sfn "${SITE_AVAIL}" "${SITE_ENABLED}"

echo "==> Test nginx config (will not reload if invalid)"
nginx -t
systemctl reload nginx

if command -v certbot >/dev/null 2>&1; then
  echo "==> Request TLS cert (certbot) for ${DOMAIN} only"
  certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email --redirect || \
    echo "WARN: certbot failed — check DNS A record for ${DOMAIN}, then rerun certbot."
else
  echo "==> Install certbot when ready:"
  echo "    apt-get install -y certbot python3-certbot-nginx"
  echo "    certbot --nginx -d ${DOMAIN}"
fi

echo ""
echo "Done. App: http://127.0.0.1:${APP_PORT}  Domain: https://${DOMAIN}"
echo "Other /opt projects were not modified."
pm2 list | grep -E "name|${APP_NAME}" || pm2 list
