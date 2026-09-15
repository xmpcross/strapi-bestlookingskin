#!/usr/bin/env node
// Normalise product featured images to a square, transparent, evenly padded PNG.
//
//   node scripts/normalize-product-images.mjs                 # preview, writes nothing
//   node scripts/normalize-product-images.mjs --out=/tmp/prev  # preview + save the results to look at
//   node scripts/normalize-product-images.mjs --apply          # upload and repoint the products
//   node scripts/normalize-product-images.mjs --apply --slug=<slug>
//   node scripts/normalize-product-images.mjs --apply --slug=<slug> --image=<url>
//
// What one image goes through:
//   1. Decode, honouring EXIF rotation, into straight RGBA.
//   2. Flood-fill the background from the edges inwards and make it
//      transparent. Filling from the edges, rather than keying every pixel of a
//      given colour, is what keeps the white of a washing machine or a pair of
//      trainers opaque: interior white is never reached by the fill.
//   3. Soften the resulting alpha edge by one pixel, so the cut-out does not
//      have the jagged rim that a hard threshold leaves.
//   4. Trim to what is left, scale the longest side to SIZE - 2*MARGIN, and
//      centre it on a transparent SIZE x SIZE canvas. Centring is what makes
//      the spacing equal: left gap matches right, top matches bottom.
//   5. Encode as PNG and upload as a NEW media file. The original is never
//      altered or deleted, so any change here is reversible in the CMS.
//
// Two refusals, because a bad cut-out is worse than none:
//   - If the fill would erase most of the picture, the "background" was the
//     subject (a full-bleed photograph); the image is reported and skipped.
//   - If the fill finds almost nothing to remove, the background is not a plain
//     colour. The image is still squared and padded, and is listed at the end as
//     needing a real cut-out by hand.
//
// commerce-products is a pool shared with every storefront on the CMS, so only
// products whose `site` relation is this storefront are touched — the same scope
// lib/strapi.ts applies (NEXT_PUBLIC_SITE_SLUG, default bestlooking-skin). That
// holds for --slug too: a slug from another site matches nothing. --site=<slug>
// points it at another storefront, and --all --force drops the scope entirely,
// changing images on sites this repo does not own.
//
// Amazon-hosted images are refused. Associates rules bar re-using Amazon product
// images without PA-API access, which this site does not have, and re-hosting one
// on the CMS is no better than hotlinking it (see CLAUDE.md, Monetisation).
//
// Adapted from nxt.deals/scripts/normalize-product-images.mjs; the image pipeline
// is unchanged, only the scope differs.
//
// Skips anything already SIZE x SIZE PNG, and anything this script made before
// (its filenames carry the -sq<SIZE> marker).

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
for (const line of (existsSync(join(ROOT, '.env.local')) ? readFileSync(join(ROOT, '.env.local'), 'utf8') : '').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && m[2].trim() !== '' && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
}

const args = process.argv.slice(2);
const flag = (n, d = null) => { const hit = args.find((a) => a.startsWith(`--${n}=`)); return hit ? hit.slice(n.length + 3) : d; };
const APPLY = args.includes('--apply');
const ALL = args.includes('--all');
const FORCE = args.includes('--force');
const SITE = ALL ? null : flag('site', process.env.NEXT_PUBLIC_SITE_SLUG || 'bestlooking-skin');
const SLUG = flag('slug');
/*
 * --image replaces the picture rather than tidying the one already there: the
 * retailer's own photograph, put through the same trim, cut-out and centring as
 * everything else, so a hand-picked image still matches the grid it lands in.
 */
const IMAGE = flag('image');
const LIMIT = Number(flag('limit', Infinity));
const SIZE = Number(flag('size', 500));
const MARGIN = Number(flag('margin', 40));
const TOLERANCE = Number(flag('tolerance', 20));   // per-channel distance that still counts as background
const OUT = flag('out');
const MARKER = `-sq${SIZE}`;

const STRAPI = (process.env.STRAPI_INTERNAL_URL || 'http://127.0.0.1:8888').replace(/\/$/, '');
const PUBLIC = (process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL || STRAPI).replace(/\/$/, '');
const TOKEN = process.env.STRAPI_WRITE_TOKEN;
if (APPLY && !TOKEN) { console.error('STRAPI_WRITE_TOKEN missing — needed to upload'); process.exit(1); }
if (MARGIN * 2 >= SIZE) { console.error(`--margin=${MARGIN} leaves no room inside --size=${SIZE}`); process.exit(1); }
if (IMAGE && !SLUG) { console.error('--image replaces one product\'s picture, so --slug is required with it'); process.exit(1); }
if (OUT) mkdirSync(OUT, { recursive: true });

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

async function strapi(path, init = {}) {
  const res = await fetch(`${STRAPI}/api/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}), ...(init.headers || {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Strapi ${res.status} ${path}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

const mediaUrl = (u) => (!u ? null : /^https?:\/\//i.test(u) ? u : `${PUBLIC}${u}`);

const isAmazonImage = (u) => {
  try { return /(^|\.)(media-amazon\.com|images-amazon\.com|ssl-images-amazon\.com)$/i.test(new URL(u).hostname); } catch { return false; }
};

/* ---------------------------------------------------------------- pixels -- */

/**
 * Make the background transparent by flooding inwards from every edge pixel.
 *
 * `seed` is the median of the four corners: on a catalogue photograph that is
 * the backdrop, and comparing against it rather than against pure white also
 * catches the off-white and light-grey backdrops retailers actually use. A
 * neighbouring pixel joins the background when it is within `TOLERANCE` of the
 * seed on every channel, so a soft vignette is followed while the product edge
 * stops the fill.
 */
function cutOutBackground(data, width, height) {
  const at = (x, y) => (y * width + x) * 4;
  const corner = (x, y) => { const i = at(x, y); return [data[i], data[i + 1], data[i + 2], data[i + 3]]; };
  const corners = [corner(0, 0), corner(width - 1, 0), corner(0, height - 1), corner(width - 1, height - 1)];

  // An image that already has a transparent border is already cut out.
  if (corners.every((c) => c[3] < 24)) return { removed: 0, preexisting: true };

  const med = (k) => corners.map((c) => c[k]).sort((a, b) => a - b)[1];
  const seed = [med(0), med(1), med(2)];

  // The corners must agree with each other, or there is no single backdrop.
  const spread = Math.max(...[0, 1, 2].map((k) => Math.max(...corners.map((c) => Math.abs(c[k] - seed[k])))));
  if (spread > TOLERANCE * 3) return { removed: 0, preexisting: false };

  const isBg = (i) =>
    Math.abs(data[i] - seed[0]) <= TOLERANCE &&
    Math.abs(data[i + 1] - seed[1]) <= TOLERANCE &&
    Math.abs(data[i + 2] - seed[2]) <= TOLERANCE;

  const mask = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x += 1) { stack.push(x, x + (height - 1) * width); }
  for (let y = 0; y < height; y += 1) { stack.push(y * width, y * width + width - 1); }

  while (stack.length) {
    const p = stack.pop();
    if (mask[p]) continue;
    if (!isBg(p * 4)) continue;
    mask[p] = 1;
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) stack.push(p - 1);
    if (x < width - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - width);
    if (y < height - 1) stack.push(p + width);
  }

  let removed = 0;
  for (let p = 0; p < mask.length; p += 1) if (mask[p]) { data[p * 4 + 3] = 0; removed += 1; }
  return { removed: removed / mask.length, preexisting: false };
}

/**
 * One pass of 3x3 averaging over alpha only, applied to pixels on the boundary
 * between kept and removed. Without it the cut-out rim is a hard staircase.
 */
function featherAlpha(data, width, height) {
  const alpha = new Uint8Array(width * height);
  for (let p = 0; p < alpha.length; p += 1) alpha[p] = data[p * 4 + 3];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const p = y * width + x;
      let min = 255; let max = 0; let sum = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const a = alpha[p + dy * width + dx];
          sum += a; if (a < min) min = a; if (a > max) max = a;
        }
      }
      if (max - min > 8) data[p * 4 + 3] = Math.round(sum / 9);
    }
  }
}

/** Bounding box of everything still visible, with a small alpha floor to ignore dust. */
function contentBox(data, width, height) {
  let top = height; let left = width; let right = -1; let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > 12) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  if (right < 0) return null;
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

async function normalize(buf) {
  const flat = await sharp(buf).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = flat.info;
  const data = flat.data;

  const cut = cutOutBackground(data, width, height);
  if (cut.removed > 0.97) return { skip: 'the fill would erase the whole picture' };
  if (cut.removed > 0) featherAlpha(data, width, height);

  const box = contentBox(data, width, height);
  if (!box || box.width < 8 || box.height < 8) return { skip: 'nothing left after the cut-out' };

  /*
   * "fit: contain" scales the longest side to the inner box and centres what is
   * left over, so the object sits in the middle; extending by MARGIN on all four
   * sides then makes the gap identical on every edge, whatever the object's
   * shape. Doing it in one chain also avoids a re-encode between the two steps.
   */
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
  const inner = SIZE - MARGIN * 2;
  const out = await sharp(data, { raw: { width, height, channels: 4 } })
    .extract(box)
    .resize(inner, inner, { fit: 'contain', background: transparent })
    .extend({ top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN, background: transparent })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return { buf: out, removed: cut.removed, preexisting: cut.preexisting, from: `${width}x${height}` };
}

/* ------------------------------------------------------------------ main -- */

async function listProducts() {
  const out = [];
  for (let page = 1; page <= 40; page += 1) {
    const qs = new URLSearchParams();
    qs.set('fields[0]', 'slug'); qs.set('fields[1]', 'name'); qs.set('fields[2]', 'imageUrl');
    qs.set('populate[primaryImage][fields][0]', 'url');
    qs.set('populate[primaryImage][fields][1]', 'width');
    qs.set('populate[primaryImage][fields][2]', 'height');
    qs.set('populate[primaryImage][fields][3]', 'mime');
    qs.set('populate[primaryImage][fields][4]', 'name');
    qs.set('pagination[pageSize]', '100');
    qs.set('pagination[page]', String(page));
    if (SLUG) qs.set('filters[slug][$eq]', SLUG);
    // Scoped in the query, by relation, exactly as lib/strapi.ts scopes the storefront.
    if (SITE) qs.set('filters[site][slug][$eq]', SITE);
    const res = await strapi(`commerce-products?${qs}`);
    out.push(...(res?.data ?? []));
    if (page >= (res?.meta?.pagination?.pageCount ?? 1)) break;
  }
  return out;
}

async function upload(buf, name) {
  const form = new FormData();
  form.append('files', new Blob([buf], { type: 'image/png' }), name);
  const res = await fetch(`${STRAPI}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` }, body: form });
  if (!res.ok) throw new Error(`upload ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return Array.isArray(j) ? j[0] : j;
}

async function main() {
  if (ALL && !FORCE) {
    console.error('--all rewrites images on products belonging to every other storefront that shares this catalogue.');
    console.error('Add --force if that is really what you want.');
    process.exit(2);
  }

  const products = await listProducts();
  console.log(`${products.length} product(s) in scope${SITE ? ` (site ${SITE})` : ' (whole shared pool)'}`);
  if (SLUG && !products.length && SITE) console.log(`no product "${SLUG}" belongs to ${SITE} — pass --site=<slug> if it lives on another storefront`);
  console.log(`target ${SIZE}x${SIZE} PNG, ${MARGIN}px margin, tolerance ${TOLERANCE}${APPLY ? '' : ' — preview only, nothing will be written'}\n`);

  let done = 0; let skipped = 0; let failed = 0;
  const noBackdrop = [];

  for (const p of products) {
    if (done >= LIMIT) break;
    const img = p.primaryImage;
    const src = IMAGE || mediaUrl(img?.url) || p.imageUrl;
    if (!src) { skipped += 1; console.log(`skip  ${p.slug} — no image`); continue; }
    if (isAmazonImage(src)) { skipped += 1; console.log(`skip  ${p.slug} — Amazon-hosted image, not allowed to be re-used`); continue; }
    if (!IMAGE) {
      if (img && img.width === SIZE && img.height === SIZE && img.mime === 'image/png') { skipped += 1; console.log(`skip  ${p.slug} — already ${SIZE}x${SIZE} PNG`); continue; }
      if (img?.name?.includes(MARKER)) { skipped += 1; console.log(`skip  ${p.slug} — already normalised`); continue; }
    }

    try {
      const res = await fetch(src, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const input = Buffer.from(await res.arrayBuffer());
      const out = await normalize(input);
      if (out.skip) { skipped += 1; console.log(`skip  ${p.slug} — ${out.skip}`); continue; }

      const pct = out.preexisting ? 'already transparent' : `${(out.removed * 100).toFixed(1)}% removed`;
      if (!out.preexisting && out.removed < 0.02) noBackdrop.push(p.slug);
      const name = `${p.slug}${MARKER}.png`;

      if (OUT) writeFileSync(join(OUT, name), out.buf);
      if (APPLY) {
        const media = await upload(out.buf, name);
        await strapi(`commerce-products/${p.documentId}`, { method: 'PUT', body: JSON.stringify({ data: { primaryImage: media.id } }) });
      }
      done += 1;
      console.log(`${APPLY ? 'wrote' : 'ready'} ${p.slug} — ${out.from} → ${SIZE}x${SIZE}, ${pct}, ${(out.buf.length / 1024).toFixed(0)} KB`);
    } catch (err) {
      failed += 1;
      console.log(`fail  ${p.slug} — ${err.message}`);
    }
  }

  console.log(`\n${APPLY ? 'updated' : 'would update'} ${done}, skipped ${skipped}, failed ${failed}`);
  if (OUT) console.log(`previews in ${OUT}`);
  if (noBackdrop.length) {
    console.log(`\nNo plain backdrop to remove on ${noBackdrop.length} image(s) — squared and padded, but still on their original background.`);
    console.log('These need a real cut-out by hand:');
    for (const s of noBackdrop) console.log(`  ${s}`);
  }
  if (!APPLY) console.log('\nNothing was written. Re-run with --apply to upload and repoint the products.');
}

main().catch((e) => { console.error(e); process.exit(1); });
