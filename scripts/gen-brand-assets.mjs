// Generates the raster brand assets (PNG/ICO) from the vector masters in
// public/brand. SVGs are the source of truth — re-run this whenever the
// wordmark or monogram changes:  node scripts/gen-brand-assets.mjs
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brand = join(root, 'public', 'brand');
const app = join(root, 'src', 'app');

const PINE = '#1f3d33';

const icon = join(brand, 'icon.svg');
const logomark = join(brand, 'logomark.svg');
const wordmark = join(brand, 'wordmark.svg');
const wordmarkReversed = join(brand, 'wordmark-reversed.svg');

// High render density keeps edges crisp when sharp rasterizes the SVG.
const svg = (p) => sharp(p, { density: 384 });

async function png(src, out, size) {
  await svg(src).resize(size, size).png().toFile(out);
  console.log('✓', out.replace(root + '/', ''));
}

async function composite({ out, width, height, background, overlaySrc, overlayWidth }) {
  const overlay = await svg(overlaySrc).resize({ width: overlayWidth }).png().toBuffer();
  const base = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });
  await base.composite([{ input: overlay, gravity: 'centre' }]).png().toFile(out);
  console.log('✓', out.replace(root + '/', ''));
}

// Build a minimal multi-size ICO that wraps PNG entries (accepted by all
// modern browsers). sharp has no native .ico encoder.
async function ico(src, out, sizes) {
  const pngs = await Promise.all(
    sizes.map((s) => svg(src).resize(s, s).png().toBuffer())
  );
  const count = sizes.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  sizes.forEach((s, i) => {
    const len = pngs[i].length;
    const e = i * 16;
    dir.writeUInt8(s >= 256 ? 0 : s, e + 0);
    dir.writeUInt8(s >= 256 ? 0 : s, e + 1);
    dir.writeUInt8(0, e + 2); // palette
    dir.writeUInt8(0, e + 3); // reserved
    dir.writeUInt16LE(1, e + 4); // planes
    dir.writeUInt16LE(32, e + 6); // bpp
    dir.writeUInt32LE(len, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += len;
  });

  await writeFile(out, Buffer.concat([header, dir, ...pngs]));
  console.log('✓', out.replace(root + '/', ''));
}

await Promise.all([
  // Favicon & app icons (staged under public/brand)
  png(logomark, join(brand, 'apple-touch-icon.png'), 180),
  png(icon, join(brand, 'icon-192.png'), 192),
  png(icon, join(brand, 'icon-512.png'), 512),
  png(logomark, join(brand, 'icon-maskable-512.png'), 512),

  // Social & email
  composite({
    out: join(brand, 'og-default.png'),
    width: 1200,
    height: 630,
    background: PINE,
    overlaySrc: wordmarkReversed,
    overlayWidth: 620,
  }),
  composite({
    out: join(brand, 'email-logo.png'),
    width: 480,
    height: 120,
    background: { r: 255, g: 255, b: 255, alpha: 0 },
    overlaySrc: wordmark,
    overlayWidth: 420,
  }),

  ico(icon, join(brand, 'favicon.ico'), [16, 32, 48]),
]);

// Promote the live app-metadata files Next.js reads from src/app.
await Promise.all([
  readFile(icon).then((b) => writeFile(join(app, 'icon.svg'), b)),
  svg(logomark).resize(180, 180).png().toFile(join(app, 'apple-icon.png')),
  ico(icon, join(app, 'favicon.ico'), [16, 32, 48]),
]);
console.log('✓ src/app icon.svg + apple-icon.png + favicon.ico');
