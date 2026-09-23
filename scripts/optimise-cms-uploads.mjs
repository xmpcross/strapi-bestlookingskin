#!/usr/bin/env node
// Shrink oversized images in public/cms-uploads (PageSpeed, 24 Sep 2026: generated covers of ~1 MB at 2368px were
// loaded raw by sidebar thumbnails and cards). Each file wider than MAX_W or larger than MAX_BYTES is resized to at
// most MAX_W wide (aspect kept) and recompressed in its own format; the file name stays, so every reference still
// works. The original is copied to a backup folder first, and data/generated-covers.json width/height are updated.
//
//   node scripts/optimise-cms-uploads.mjs --dry-run
//   node scripts/optimise-cms-uploads.mjs
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIR = join(ROOT, 'public', 'cms-uploads');
const MANIFEST = join(ROOT, 'data', 'generated-covers.json');
const MAX_W = 1600;
const MAX_BYTES = 250 * 1024;
const DRY = process.argv.includes('--dry-run');
const BACKUP = `/opt/backups/cms-uploads-originals-${new Date().toISOString().slice(0, 10)}`;

let before = 0, after = 0, changed = 0;
const dims = {};
for (const f of readdirSync(DIR)) {
  const p = join(DIR, f);
  const ext = extname(f).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;
  const size = statSync(p).size;
  const meta = await sharp(p).metadata();
  if ((meta.width ?? 0) <= MAX_W && size <= MAX_BYTES) continue;
  let img = sharp(p).rotate().resize({ width: MAX_W, withoutEnlargement: true });
  img = ext === '.png' ? img.png({ compressionLevel: 9, palette: true, quality: 85 }) : ext === '.webp' ? img.webp({ quality: 80 }) : img.jpeg({ quality: 80, mozjpeg: true, progressive: true });
  const buf = await img.toBuffer();
  if (buf.length >= size) continue;
  const out = await sharp(buf).metadata();
  before += size;
  after += buf.length;
  changed += 1;
  dims[f] = { width: out.width, height: out.height, size: Math.round(buf.length / 1024) };
  if (!DRY) {
    mkdirSync(BACKUP, { recursive: true });
    if (!existsSync(join(BACKUP, f))) copyFileSync(p, join(BACKUP, f));
    writeFileSync(p, buf);
  }
}
console.log(`${changed} files ${DRY ? 'would be' : ''} optimised: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB${DRY ? '' : `; originals in ${BACKUP}`}`);

/* Keep the generated-cover manifest's dimensions in step with the files. */
if (!DRY && existsSync(MANIFEST)) {
  const m = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  let n = 0;
  for (const entry of Object.values(m)) {
    const file = String(entry?.url ?? '').replace(/^\/cms-uploads\//, '');
    if (dims[file]) Object.assign(entry, dims[file]) && (n += 1);
  }
  writeFileSync(MANIFEST, `${JSON.stringify(m, null, 2)}\n`);
  console.log(`manifest: ${n} entries updated`);
}
