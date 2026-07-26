const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

async function makeIcon(size, file) {
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
      `<rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#111111"/>` +
      `<text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" ` +
      `font-family="Arial,sans-serif" font-weight="700" font-size="${Math.round(size * 0.42)}" fill="#D9EBE6">F</text>` +
      `</svg>`
  );
  await sharp(svg).png().toFile(file);
  console.log("wrote", file, fs.statSync(file).size);
}

async function main() {
  const dir = path.join(process.cwd(), "public", "icons");
  fs.mkdirSync(dir, { recursive: true });
  await makeIcon(192, path.join(dir, "icon-192.png"));
  await makeIcon(512, path.join(dir, "icon-512.png"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
