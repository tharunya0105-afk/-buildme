// ─── PWA icon generator ──────────────────────────────────────────────────────
// Generates every icon the web app manifest + iOS need, from one SVG source.
// Run: node scripts/generate-icons.js

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const OUT = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(OUT, { recursive: true });

// BuildMe mark: slate rounded square, white building silhouette, blue base band.
const svg = (pad = 0) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${pad === 0 ? 96 : 0}" fill="#1e293b"/>
  <!-- building -->
  <g fill="#ffffff">
    <rect x="${96 + pad}" y="${176 + pad}" width="72" height="${216 - pad}" rx="6"/>
    <rect x="${186 + pad}" y="${112 + pad}" width="72" height="${280 - pad}" rx="6"/>
    <rect x="${276 + pad}" y="${208 + pad}" width="72" height="${184 - pad}" rx="6"/>
  </g>
  <!-- windows -->
  <g fill="#1e293b">
    <rect x="${112 + pad}" y="${200 + pad}" width="14" height="14" rx="3"/>
    <rect x="${138 + pad}" y="${200 + pad}" width="14" height="14" rx="3"/>
    <rect x="${112 + pad}" y="${236 + pad}" width="14" height="14" rx="3"/>
    <rect x="${138 + pad}" y="${236 + pad}" width="14" height="14" rx="3"/>
    <rect x="${202 + pad}" y="${136 + pad}" width="14" height="14" rx="3"/>
    <rect x="${228 + pad}" y="${136 + pad}" width="14" height="14" rx="3"/>
    <rect x="${202 + pad}" y="${172 + pad}" width="14" height="14" rx="3"/>
    <rect x="${228 + pad}" y="${172 + pad}" width="14" height="14" rx="3"/>
    <rect x="${202 + pad}" y="${208 + pad}" width="14" height="14" rx="3"/>
    <rect x="${228 + pad}" y="${208 + pad}" width="14" height="14" rx="3"/>
    <rect x="${292 + pad}" y="${232 + pad}" width="14" height="14" rx="3"/>
    <rect x="${318 + pad}" y="${232 + pad}" width="14" height="14" rx="3"/>
    <rect x="${292 + pad}" y="${268 + pad}" width="14" height="14" rx="3"/>
    <rect x="${318 + pad}" y="${268 + pad}" width="14" height="14" rx="3"/>
  </g>
  <!-- accent base band -->
  <rect x="${72 + pad}" y="${408 - pad * 0.5}" width="368" height="20" rx="10" fill="#2563eb"/>
</svg>`;

async function make(name, size, opts = {}) {
  const img = sharp(Buffer.from(svg(opts.fullBleed ? 0 : 0)), { density: 300 });
  await img
    .resize(size, size, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, name));
  console.log("✓", name, `${size}x${size}`);
}

(async () => {
  await make("icon-192.png", 192);
  await make("icon-512.png", 512);
  // Maskable: full-bleed art with safe zone (content inset handled in SVG proportions)
  await make("icon-maskable-512.png", 512);
  await make("apple-touch-icon.png", 180);
  await make("favicon-32.png", 32);

  // 512 PNG → ico not needed; Next serves favicon via icon route or file.
  // Copy apple icon to app dir expected location too.
  fs.copyFileSync(
    path.join(OUT, "apple-touch-icon.png"),
    path.join(__dirname, "..", "public", "apple-touch-icon.png"),
  );
  console.log("All icons written to public/icons/");
})();
