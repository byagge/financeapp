/**
 * PM2 process — isolated from other /opt apps.
 * Name: finance | Port: 3010 (localhost only)
 */
module.exports = {
  apps: [
    {
      name: "finance",
      cwd: "/opt/finance",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3010",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3010",
        HOSTNAME: "127.0.0.1",
      },
      max_memory_restart: "512M",
      time: true,
      // Do not use watch in production
      watch: false,
    },
  ],
};
