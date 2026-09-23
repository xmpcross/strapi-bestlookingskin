#!/usr/bin/env node
/**
 * Make a featured cover image for a BestLooking.Skin post, and set it to display.
 *
 * Real products where possible: if the post is about products in the site's catalogue (commerce-products scoped
 * to bestlooking-skin) — named in its title, or in its section headings for comparisons and roundups — the cover
 * is those products' own cut-out photos (up to 3) composed on a colored backdrop. Free: no fal.ai call. Otherwise
 * it falls back to a fal.ai image, now on a seamless colored backdrop too. Each post gets its own color from a
 * soft palette (stable per slug, so a rerun keeps it); --bg overrides it.
 *
 * Usage:
 *   node scripts/generate-post-cover.mjs --slug=<post-slug>
 *   node scripts/generate-post-cover.mjs --slug=<post-slug> --dry-run
 *   node scripts/generate-post-cover.mjs --slug=<post-slug> --fast            # flux/schnell (~2s, cheaper)
 *   node scripts/generate-post-cover.mjs --slug=<post-slug> --prompt="Custom prompt..."
 *   node scripts/generate-post-cover.mjs --slug=<post-slug> --force           # replace a cover it already has
 *   node scripts/generate-post-cover.mjs --all --dry-run                      # list every post without a cover
 *   node scripts/generate-post-cover.mjs --all [--limit=N] [--yes]            # cover them
 *   node scripts/generate-post-cover.mjs --slug=<post-slug> --ai              # fal.ai even if products match
 *   node scripts/generate-post-cover.mjs --slug=<post-slug> --bg=sage         # palette name, or --bg=#e8d5c4
 *   node scripts/generate-post-cover.mjs --slug=<post-slug> --out=/tmp/x      # preview: write there, register nothing
 *
 * What happens to a post:
 *   - It already has a cover (set in Strapi, in POST_COVER_OVERRIDES in lib/strapi.ts, or generated before and
 *     recorded in data/generated-covers.json): skipped. --force regenerates it anyway, --slug only.
 *   - Its image is already on disk (public/cms-uploads/<slug>_cover.jpg) but nothing shows it: that file is
 *     registered as its cover, with no fal.ai call.
 *   - Otherwise: made from catalogue products if it names any, else generated with fal.ai; saved to
 *     public/cms-uploads/ and registered.
 *
 * "Registered" means an entry in data/generated-covers.json, which lib/strapi.ts reads at runtime. The cover
 * shows on the post page on the next request and in listings within about a minute. No code edit, no rebuild,
 * no deploy. Both the image and the manifest are gitignored, so the tree stays clean for ./deploy.sh.
 *
 * That depends on nginx serving /cms-uploads/ straight from public/cms-uploads/ (location block in
 * /etc/nginx/sites-available/bestlooking.skin, added 23 Sep 2026). `next start` only serves files that were in
 * public/ when it started, so without that block a new cover 404s until the next deploy. Cloudflare and browsers
 * cache the images for up to 4 hours, so a --force replacement can take that long to show everywhere.
 *
 * fal.ai is billed per image; product covers are free. --all makes at most 5 fal.ai images unless you pass --yes
 * (or a --limit), and product covers do not count towards that. Run it with --dry-run first to see the plan.
 *
 * Env:
 *   FAL_KEY            fal.ai API key (from .env.local)
 *   FAL_IMAGE_MODEL    default: fal-ai/flux-pro/v1.1-ultra
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync, renameSync, openSync, closeSync, unlinkSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const envPath = join(ROOT, '.env.local');

// Load .env.local if present
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[2].trim() !== '' && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
    }
  }
}

const args = process.argv.slice(2);
const flag = (n, d = null) => {
  const hit = args.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : d;
};
const DRY = args.includes('--dry-run');
const FAST = args.includes('--fast');
const FORCE = args.includes('--force');
const ALL = args.includes('--all');
const YES = args.includes('--yes');
const SLUG = flag('slug');
const CUSTOM_PROMPT = flag('prompt');
const LIMIT = flag('limit') ? Number(flag('limit')) : null;
const AI_ONLY = args.includes('--ai');
const BG_FLAG = flag('bg');
const OUT_DIR = flag('out');

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || 'https://cms.fxnstudio.com').replace(/\/$/, '');
const FAL_KEY = process.env.FAL_KEY;
const MODEL = FAST ? 'fal-ai/flux/schnell' : (process.env.FAL_IMAGE_MODEL || 'fal-ai/flux-pro/v1.1-ultra');

const UPLOADS_DIR = join(ROOT, 'public', 'cms-uploads');
const MANIFEST = join(ROOT, 'data', 'generated-covers.json');
const STRAPI_TS = join(ROOT, 'lib', 'strapi.ts');
/* Without --yes or --limit, --all stops after this many paid generations. */
const ALL_SAFETY_CAP = 5;

if (!SLUG && !ALL) {
  console.error('Error: pass --slug=<post-slug>, or --all for every post without a cover.');
  process.exit(1);
}
if (SLUG && ALL) {
  console.error('Error: pass --slug or --all, not both.');
  process.exit(1);
}
if (ALL && FORCE) {
  console.error('Error: --force only works with --slug; it would regenerate every cover on the site.');
  process.exit(1);
}
if (ALL && CUSTOM_PROMPT) {
  console.error('Error: --prompt only works with --slug.');
  process.exit(1);
}
if (OUT_DIR && ALL) {
  console.error('Error: --out previews one post; use it with --slug.');
  process.exit(1);
}
if (LIMIT !== null && !(LIMIT > 0)) {
  console.error('Error: --limit must be a positive number.');
  process.exit(1);
}

/* Soft editorial backdrops. Each post gets one from its slug, so covers vary across the site but a rerun of the
   same post keeps its color. Light enough that dark and white packaging both read against it. */
const PALETTE = [
  { name: 'sage', hex: '#cfdcc8' },
  { name: 'blush', hex: '#f1d3cf' },
  { name: 'sky', hex: '#cde0ee' },
  { name: 'butter', hex: '#f3e5bb' },
  { name: 'lilac', hex: '#ddd3ec' },
  { name: 'peach', hex: '#f6d3bd' },
  { name: 'mint', hex: '#cbe8dc' },
  { name: 'sand', hex: '#e8dccb' },
  { name: 'powder blue', hex: '#d6dff3' },
  { name: 'rose', hex: '#ecc9d3' },
];

function pickBackground(slug) {
  if (BG_FLAG) {
    const named = PALETTE.find((c) => c.name === BG_FLAG.toLowerCase());
    if (named) return named;
    if (/^#[0-9a-f]{6}$/i.test(BG_FLAG)) return { name: 'custom', hex: BG_FLAG.toLowerCase() };
    throw new Error(`--bg must be one of ${PALETTE.map((c) => c.name).join(', ')} or a #rrggbb color`);
  }
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

const baseStyle = (bg) =>
  `Editorial skincare product photography on a seamless solid ${bg.name} colored studio backdrop (${bg.hex}) with a matching colored surface. Clean, modern, minimal composition, soft diffuse light casting a gentle natural shadow, a few subtle botanical accents at most. Photorealistic, crisp commercial quality, 8k resolution, no artificial watermarks, no distorted text.`;
/* Covers must not show a real brand's packaging: on a review site a generated bottle with a real logo reads as a
   product photo or an endorsement. Earlier covers came back with CeraVe and Sothys labels. */
const UNBRANDED =
  'All packaging is unbranded and generic: plain minimalist labels with no logos, no brand names and no readable product names.';

function buildPrompt(post, bg) {
  if (CUSTOM_PROMPT) return `${CUSTOM_PROMPT}. ${UNBRANDED} ${baseStyle(bg)}`;

  const title = post.title || '';
  const excerpt = post.excerpt || '';
  const text = `${title} ${excerpt}`.toLowerCase();

  let subject = '';

  if (text.includes('niacinamide')) {
    subject = 'A minimalist glass dropper bottle of pore-refining 10% Niacinamide serum with a single clear droplet suspended from the pipette tip, beside smooth river pebbles and fresh eucalyptus leaves.';
  } else if (text.includes('rose petal') || text.includes('rosehip') || (text.includes('facial oil') && text.includes('rose'))) {
    subject = 'An amber glass bottle of nourishing rose petal facial elixir with golden botanical oil, surrounded by delicate fresh pale pink rose petals and subtle warm candlelight.';
  } else if (text.includes('acne treatment gel') || text.includes('salicylic')) {
    subject = 'A sleek white dermatological treatment gel tube with a clear calming gel bead, with soothing cica leaves beside it.';
  } else if (text.includes('retinol') && (text.includes('wrinkle') || text.includes('filler') || text.includes('cream'))) {
    subject = 'A luxury targeted anti-aging retinol treatment tube with a precision silver applicator tip beside a few night-blooming botanicals.';
  } else if (text.includes('sheet mask') || text.includes('facial mask') || text.includes('glam up')) {
    subject = 'A luxurious set of unopened colorful botanical facial sheet mask sachets neatly fanned out beside a folded linen towel and calming chamomile sprigs.';
  } else if (text.includes('sunscreen') || text.includes('spf')) {
    subject = 'A clean white tube of high-protection mineral daily sunscreen lotion in bright warm sunlight with soft palm frond shadows.';
  } else if (text.includes('cleanser') || text.includes('face wash')) {
    subject = 'A frosted pump bottle of gentle foaming facial cleanser with silky soft white lather bubbles and fresh crystal water droplets.';
  } else if (text.includes('moisturizer') || text.includes('night cream')) {
    subject = 'A frosted glass jar of rich restorative barrier cream moisturizer with a creamy swirl dollop on a small wooden cosmetic spatula.';
  } else if (text.includes('serum')) {
    subject = 'An elegant apothecary glass serum dropper bottle with pure hydrating liquid, on a simple pedestal with a few water droplets.';
  } else {
    /* Never put the title in the prompt: titles are full of brand names ("Era Organics vs Eminence Stone Crop"),
       and the model prints them on the packaging despite UNBRANDED. Describe the product type instead. */
    const type = ['moisturizer', 'cream', 'gel', 'serum', 'toner', 'oil', 'lotion', 'balm', 'mist'].find((t) => text.includes(t));
    const products = type ? `${type} products` : 'skincare products';
    subject = /\bvs\.?\b|versus|showdown|battle|compar/.test(text)
      ? `Two contrasting unbranded ${products} standing side by side, one jar and one bottle, suggesting a head-to-head comparison.`
      : `A small arrangement of unbranded ${products} in minimalist bottles and jars.`;
  }

  return `${subject} ${UNBRANDED} ${baseStyle(bg)}`;
}

/* ------------------------------------------------------------------ what already has a cover */

/** Slugs with a hand-written entry in POST_COVER_OVERRIDES. Read from the source, since the script cannot import TS. */
function codeOverrideSlugs() {
  const src = readFileSync(STRAPI_TS, 'utf8');
  const start = src.indexOf('export const POST_COVER_OVERRIDES');
  if (start < 0) throw new Error('POST_COVER_OVERRIDES not found in lib/strapi.ts');
  const end = src.indexOf('\n};', start);
  const block = src.slice(start, end);
  return new Set([...block.matchAll(/^\s{2}'([^']+)':\s*\{/gm)].map((m) => m[1]));
}

function readManifest() {
  if (!existsSync(MANIFEST)) return {};
  try {
    return JSON.parse(readFileSync(MANIFEST, 'utf8')) || {};
  } catch (err) {
    /* Refuse rather than overwrite: a corrupt manifest would otherwise be replaced by one holding a single entry,
       unregistering every other generated cover. */
    throw new Error(`data/generated-covers.json is not valid JSON (${err.message}); fix or remove it first.`);
  }
}

/** Write via a temp file and rename, so the site never reads a half-written manifest. */
function writeManifest(manifest) {
  mkdirSync(dirname(MANIFEST), { recursive: true });
  const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
  const tmp = `${MANIFEST}.tmp-${process.pid}`;
  writeFileSync(tmp, `${JSON.stringify(sorted, null, 2)}\n`);
  renameSync(tmp, MANIFEST);
}

const LOCK = `${MANIFEST}.lock`;
const sleepMs = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/**
 * Add one cover to the manifest. Two runs can overlap (an --all batch and a --slug run did, and the batch's
 * writes erased three of the other run's covers), so never write back a copy read at startup: take a lock,
 * re-read the file from disk, set this one entry, write, release.
 */
function registerCover(slug, entry) {
  mkdirSync(dirname(MANIFEST), { recursive: true });
  const deadline = Date.now() + 15000;
  for (;;) {
    try {
      closeSync(openSync(LOCK, 'wx'));
      break;
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      /* A lock older than a minute is left over from a crashed run; no write takes that long. */
      try { if (Date.now() - statSync(LOCK).mtimeMs > 60000) unlinkSync(LOCK); } catch {}
      if (Date.now() > deadline) throw new Error(`could not lock ${LOCK}; is another run stuck?`);
      sleepMs(100);
    }
  }
  try {
    const current = readManifest();
    current[slug] = entry;
    writeManifest(current);
  } finally {
    unlinkSync(LOCK);
  }
}

/* ------------------------------------------------------------------ Strapi */

/* content and postType are only needed to find the products a post is about (its section headings). */
const POST_QUERY = 'fields[0]=title&fields[1]=excerpt&fields[2]=slug&fields[3]=content&fields[4]=postType&populate[coverImage][fields][0]=url&populate[categories][fields][0]=slug';

async function strapiGet(query) {
  const res = await fetch(`${STRAPI}/api/bls-posts?${query}`);
  if (!res.ok) throw new Error(`Strapi fetch error: ${res.status} ${await res.text()}`);
  return res.json();
}

async function fetchPost(slug) {
  const json = await strapiGet(`filters[slug][$eq]=${encodeURIComponent(slug)}&${POST_QUERY}&pagination[pageSize]=1`);
  return json.data?.[0] || null;
}

async function fetchAllPosts() {
  const posts = [];
  for (let page = 1; ; page++) {
    const json = await strapiGet(`sort[0]=publishedAt:desc&${POST_QUERY}&pagination[page]=${page}&pagination[pageSize]=100`);
    posts.push(...(json.data || []));
    if (page >= (json.meta?.pagination?.pageCount ?? 1)) return posts;
  }
}

/* ------------------------------------------------------------------ catalogue products */

/* This storefront's slice of the shared commerce-products pool, the same scope lib/strapi.ts uses. Draft products
   (single offer) are included: they are real products with real photos, just not listable as price comparisons. */
const SITE_SLUG = process.env.NEXT_PUBLIC_SITE_SLUG || 'bestlooking-skin';

async function fetchCatalogue() {
  const out = [];
  for (let page = 1; ; page++) {
    const q = `filters[site][slug][$eq]=${SITE_SLUG}&fields[0]=name&fields[1]=slug&fields[2]=brand` +
      `&populate[primaryImage][fields][0]=url&populate[primaryImage][fields][1]=mime&pagination[page]=${page}&pagination[pageSize]=100`;
    const res = await fetch(`${STRAPI}/api/commerce-products?${q}`);
    if (!res.ok) throw new Error(`Strapi catalogue fetch error: ${res.status}`);
    const json = await res.json();
    /* Only transparent cut-outs compose cleanly on a colored backdrop; the catalogue's primaryImage is a PNG. */
    out.push(...(json.data || []).filter((p) => p.brand && p.primaryImage?.url && p.primaryImage.mime === 'image/png'));
    if (page >= (json.meta?.pagination?.pageCount ?? 1)) return out;
  }
}

const tokens = (s) => plainText(s).toLowerCase().replace(/['’]/g, '').match(/[a-z0-9%+]+/g) ?? [];
/* Words that say nothing about which product it is. */
const GENERIC = new Set('the a an and or for with of to in on by your you is are how what best top review vs versus spf oz fl ml pack skin face facial'.split(' '));

/**
 * The catalogue products a post is about, best first, at most 3. Two signals, both conservative, because a wrong
 * product on a cover is worse than no product:
 *   - the title names the brand and at least 60% (and 2+) of the product's distinctive words
 *     ("CeraVe Hydrating Facial Cleanser 16 oz: Deep Hydration" -> CeraVe Hydrating Facial Cleanser);
 *   - a section heading contains the product's full name, which is how comparisons and roundups name the
 *     products they cover.
 * Calibrated against every post on 23 Sep 2026: 24 posts matched, no false matches.
 */
function matchProducts(post, catalogue) {
  const title = ` ${tokens(post.title).join(' ')} `;
  const titleSet = new Set(tokens(post.title));
  const content = post.content || '';
  const headings = [
    ...[...content.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi)].map((m) => m[1]),
    ...[...content.matchAll(/^#{2,4} (.+)$/gm)].map((m) => m[1]),
  ].join(' | ');
  const headingText = ` ${tokens(headings).join(' ')} `;

  const scored = [];
  for (const p of catalogue) {
    const brand = tokens(p.brand);
    const name = tokens(p.name);
    let score = 0;
    if (brand.length && title.includes(` ${brand.join(' ')} `)) {
      const distinctive = name.filter((t) => !GENERIC.has(t) && !brand.includes(t));
      const hit = distinctive.filter((t) => titleSet.has(t)).length;
      if (distinctive.length && hit >= 2 && hit / distinctive.length >= 0.6) score = 1 + hit / distinctive.length;
    }
    if (!score && name.length >= 3 && headingText.includes(` ${name.join(' ')} `)) score = 0.5;
    if (score) scored.push({ p, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((x) => x.p);
}

/* ------------------------------------------------------------------ images */

let sharpModule = null;
async function loadSharp() {
  /* sharp ships with Next (this repo's image pipeline), so it is in node_modules without being a direct dependency. */
  if (!sharpModule) sharpModule = (await import('sharp')).default;
  return sharpModule;
}

const mix = (hex, toward, t) => {
  const a = hex.match(/[0-9a-f]{2}/gi).map((x) => parseInt(x, 16));
  const b = toward === 'white' ? [255, 255, 255] : [0, 0, 0];
  return `#${a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
};

/**
 * A cover from the products' own cut-out photos: 1200x900 (the 4:3 the other covers use), a soft vertical
 * gradient of the post's color, each product standing on a shared baseline with a blurred floor shadow.
 * The catalogue cut-outs are ~420px tall once trimmed, so products are drawn at most ~1.4x to stay sharp.
 */
async function composeProductCover(products, bg) {
  const sharp = await loadSharp();
  const W = 1200, H = 900, BASELINE = 742;
  const n = products.length;
  const targetH = [0, 590, 540, 480][n];
  const slotW = Math.floor((W * 0.84) / n);

  const items = [];
  for (const p of products) {
    const res = await fetch(`${STRAPI}${p.primaryImage.url}`);
    if (!res.ok) throw new Error(`product image ${p.primaryImage.url}: ${res.status}`);
    const trimmed = await sharp(Buffer.from(await res.arrayBuffer())).trim({ threshold: 1 }).png().toBuffer();
    const resized = await sharp(trimmed)
      .resize({ height: targetH, width: Math.floor(slotW * 0.86), fit: 'inside', kernel: 'lanczos3' })
      .sharpen({ sigma: 0.6 })
      .png()
      .toBuffer({ resolveWithObject: true });
    /* Frosted bottles and tube ends are partly transparent in the cut-outs, so the backdrop color would show
       through the product and wash it out. A solid white silhouette (the alpha channel, thresholded) goes
       underneath, so those areas read as packaging rather than as background. */
    const { width: w, height: h } = resized.info;
    /* Shrink the silhouette a few pixels inside the product edge (blur, then keep only near-solid pixels) and
       soften it, so it backs the body without leaving a white fringe around the outline. */
    const mask = await sharp(resized.data).extractChannel(3).threshold(40).blur(4).threshold(235).blur(1.5).toBuffer();
    const backing = await sharp({ create: { width: w, height: h, channels: 3, background: '#ffffff' } })
      .joinChannel(mask)
      .png()
      .toBuffer();
    items.push({ buf: resized.data, backing, w, h });
  }

  const gap = n > 1 ? 70 : 0;
  const total = items.reduce((a, it) => a + it.w, 0) + gap * (n - 1);
  let x = Math.round((W - total) / 2);
  const placed = items.map((it) => { const at = { ...it, left: x, top: BASELINE - it.h }; x += it.w + gap; return at; });

  const top = mix(bg.hex, 'white', 0.5);
  const floor = mix(bg.hex, 'black', 0.05);
  const shadows = placed.map((it) =>
    `<ellipse cx="${it.left + it.w / 2}" cy="${BASELINE - 4}" rx="${Math.round(it.w * 0.58)}" ry="20" fill="#000" fill-opacity="0.22" filter="url(#soft)"/>`).join('');
  const backdrop = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${top}"/><stop offset="0.72" stop-color="${bg.hex}"/><stop offset="1" stop-color="${floor}"/>
      </linearGradient>
      <filter id="soft" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="14"/></filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>${shadows}
  </svg>`);

  return sharp(backdrop)
    .composite(placed.flatMap((it) => [
      { input: it.backing, left: it.left, top: it.top },
      { input: it.buf, left: it.left, top: it.top },
    ]))
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}

async function generateFalImage(prompt) {
  const isUltra = MODEL.includes('ultra');
  const body = {
    prompt,
    num_images: 1,
    enable_safety_checker: true,
    ...(isUltra ? { aspect_ratio: '4:3', output_format: 'jpeg' } : { image_size: 'landscape_4_3', output_format: 'jpeg' }),
  };

  const res = await fetch(`https://fal.run/${MODEL}`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`fal.ai error (${res.status}): ${errorText}`);
  }

  const json = await res.json();
  const imageUrl = json.images?.[0]?.url;
  if (!imageUrl) throw new Error('fal.ai returned no image URL');
  return { url: imageUrl };
}

/** Width and height from a JPEG's SOF header, so the manifest records the real size of the file on disk. */
function jpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('not a JPEG');
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  throw new Error('JPEG has no SOF header');
}

/** Post titles carry WordPress entities (&#038;, &#8211;); alt text should be plain. */
function plainText(s) {
  return String(s || '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function manifestEntry(post, filename, buf, how) {
  const { width, height } = jpegSize(buf);
  return {
    url: `/cms-uploads/${filename}`,
    alternativeText: plainText(post.title),
    width,
    height,
    /* KB, like Strapi's own `size`. Cards hide any cover under 5 KB as a placeholder, so never round below 5. */
    size: Math.max(5, Math.round(buf.length / 1024)),
    generatedAt: new Date().toISOString(),
    source: how,
  };
}

/* ------------------------------------------------------------------ main */

/** Why a post needs no new cover, or null if it needs one. */
function existingCover(post, codeSlugs, manifest) {
  if (post.coverImage?.url) return `set in Strapi (${post.coverImage.url})`;
  if (codeSlugs.has(post.slug)) return 'set in POST_COVER_OVERRIDES (lib/strapi.ts)';
  if (manifest[post.slug]) return `already generated (${manifest[post.slug].url})`;
  return null;
}

async function main() {
  console.log(`\n─── BestLooking.Skin Cover Generator ───`);
  console.log(`Model : catalogue products where the post names them, else ${MODEL}${AI_ONLY ? ' (forced by --ai)' : ''}` +
    `${DRY ? '   [dry run]' : ''}${OUT_DIR ? `   [preview to ${OUT_DIR}]` : ''}`);

  const codeSlugs = codeOverrideSlugs();
  const manifest = readManifest();

  let posts;
  if (SLUG) {
    const post = await fetchPost(SLUG);
    if (!post) {
      console.error(`Error: Post with slug "${SLUG}" not found in Strapi.`);
      process.exit(1);
    }
    posts = [post];
  } else {
    posts = await fetchAllPosts();
  }

  const plan = [];
  let skipped = 0;
  for (const post of posts) {
    const reason = existingCover(post, codeSlugs, manifest);
    if (reason && !FORCE) {
      skipped++;
      if (SLUG) console.log(`\nSkip  : ${post.slug} already has a cover, ${reason}. Use --force to replace it.`);
      continue;
    }
    if (reason && FORCE) console.log(`\nForce : ${post.slug} has a cover (${reason}); regenerating.`);
    const filename = `${post.slug.replace(/-/g, '_')}_cover.jpg`;
    const onDisk = existsSync(join(UPLOADS_DIR, filename));
    plan.push({ post, filename, action: onDisk && !FORCE && !OUT_DIR ? 'register' : 'generate' });
  }

  /* Which new covers can be made from real products, and which need fal.ai. */
  const needsNew = plan.some((p) => p.action === 'generate');
  const catalogue = needsNew && !AI_ONLY ? await fetchCatalogue() : [];
  for (const item of plan) {
    item.bg = pickBackground(item.post.slug);
    item.products = item.action === 'generate' && !CUSTOM_PROMPT ? matchProducts(item.post, catalogue) : [];
    if (item.action === 'generate') item.action = item.products.length ? 'compose' : 'ai';
  }

  /* Free work first (re-registrations, product covers), so the paid-generation cap below never stops it. */
  const order = { register: 0, compose: 1, ai: 2 };
  plan.sort((a, b) => order[a.action] - order[b.action]);
  const count = (a) => plan.filter((p) => p.action === a).length;
  const toGenerate = count('ai');
  if (ALL) {
    console.log(`Posts : ${posts.length} published, ${skipped} already have a cover`);
    console.log(`Plan  : register ${count('register')} image(s) already on disk, ` +
      `make ${count('compose')} from catalogue products (free), generate ${toGenerate} with fal.ai`);
  }

  const cap = LIMIT ?? (ALL && !YES ? ALL_SAFETY_CAP : Infinity);
  let generated = 0;
  let composed = 0;
  let registered = 0;

  /** Save a finished cover: to the preview folder with --out, otherwise to cms-uploads and the manifest. */
  const save = (post, filename, buf, how) => {
    if (OUT_DIR) {
      mkdirSync(OUT_DIR, { recursive: true });
      writeFileSync(join(OUT_DIR, filename), buf);
      console.log(`        preview written to ${join(OUT_DIR, filename)} (not registered)`);
      return;
    }
    writeFileSync(join(UPLOADS_DIR, filename), buf);
    manifest[post.slug] = manifestEntry(post, filename, buf, how);
    registerCover(post.slug, manifest[post.slug]);
    console.log(`        saved /cms-uploads/${filename} (${(buf.length / 1024).toFixed(0)} KB, ` +
      `${manifest[post.slug].width}×${manifest[post.slug].height}) and registered it`);
    if (codeSlugs.has(post.slug)) {
      console.log(`        note: POST_COVER_OVERRIDES in lib/strapi.ts also has "${post.slug}" and takes priority; ` +
        `it shows this new image only if it points at /cms-uploads/${filename}.`);
    }
  };

  for (const { post, filename, action, bg, products } of plan) {
    const outPath = join(UPLOADS_DIR, filename);
    const label = `${post.categories?.[0]?.slug ?? '?'}/${post.slug}`;

    if (action === 'compose') {
      console.log(`\nMake  : ${label}  [catalogue products on ${bg.name} ${bg.hex}]\n        ${products.map((p) => p.name).join(' + ')}`);
      composed++;
      if (DRY) continue;
      const buf = await composeProductCover(products, bg);
      save(post, filename, buf, `catalogue: ${products.map((p) => p.slug).join(', ')} · ${bg.name}`);
      continue;
    }

    if (action === 'register') {
      console.log(`\nReuse : ${label}\n        ${filename} is on disk but not shown; registering it (no fal.ai call).`);
      if (!DRY) {
        manifest[post.slug] = manifestEntry(post, filename, readFileSync(outPath), 'existing file');
        registerCover(post.slug, manifest[post.slug]);
      }
      registered++;
      continue;
    }

    if (generated >= cap) {
      console.log(`\nStop  : reached ${cap} generated image(s). ${toGenerate - generated} post(s) still without a cover; ` +
        `rerun with --limit=N or --yes to continue.`);
      break; // only generations remain: registrations were sorted first
    }

    const prompt = buildPrompt(post, bg);
    console.log(`\nMake  : ${label}  [fal.ai on ${bg.name} ${bg.hex}]\nTitle : ${plainText(post.title)}\nPrompt: "${prompt}"`);
    if (DRY) {
      generated++;
      continue;
    }
    if (!FAL_KEY) throw new Error('FAL_KEY missing in environment or .env.local');

    const start = Date.now();
    const result = await generateFalImage(prompt);
    console.log(`        generated in ${((Date.now() - start) / 1000).toFixed(1)}s`);
    const res = await fetch(result.url);
    if (!res.ok) throw new Error(`Failed to download image from ${result.url}: ${res.status}`);
    save(post, filename, Buffer.from(await res.arrayBuffer()), `${MODEL} · ${bg.name}`);
    generated++;
  }

  if (DRY) {
    console.log(`\nDry run: would register ${registered}, make ${composed} from products and generate ${generated} with ` +
      `fal.ai. Nothing written, nothing billed.`);
  } else if (OUT_DIR) {
    console.log('\nPreview only: the live cover was not changed.');
  } else if (generated + composed + registered > 0) {
    console.log(`\n✔ ${composed} from products, ${generated} generated, ${registered} registered. They show on the post page ` +
      `now and in listings within about a minute: no code change, rebuild or deploy needed.`);
  } else if (!SLUG) {
    console.log('\nNothing to do: every post already has a cover.');
  }
}

main().catch((err) => {
  console.error('\nExecution failed:', err.message);
  process.exit(1);
});
