#!/usr/bin/env node
/**
 * Generate a featured cover image for a BestLooking.Skin post using fal.ai, and set it to display.
 *
 * Usage:
 *   node scripts/generate-post-cover.mjs --slug=<post-slug>
 *   node scripts/generate-post-cover.mjs --slug=<post-slug> --dry-run
 *   node scripts/generate-post-cover.mjs --slug=<post-slug> --fast            # flux/schnell (~2s, cheaper)
 *   node scripts/generate-post-cover.mjs --slug=<post-slug> --prompt="Custom prompt..."
 *   node scripts/generate-post-cover.mjs --slug=<post-slug> --force           # replace a cover it already has
 *   node scripts/generate-post-cover.mjs --all --dry-run                      # list every post without a cover
 *   node scripts/generate-post-cover.mjs --all [--limit=N] [--yes]            # cover them
 *
 * What happens to a post:
 *   - It already has a cover (set in Strapi, in POST_COVER_OVERRIDES in lib/strapi.ts, or generated before and
 *     recorded in data/generated-covers.json): skipped. --force regenerates it anyway, --slug only.
 *   - Its image is already on disk (public/cms-uploads/<slug>_cover.jpg) but nothing shows it: that file is
 *     registered as its cover, with no fal.ai call.
 *   - Otherwise: generated with fal.ai, saved to public/cms-uploads/, and registered.
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
 * fal.ai is billed per image. --all generates at most 5 images unless you pass --yes (or a --limit); run it with
 * --dry-run first to see what it would do.
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
if (LIMIT !== null && !(LIMIT > 0)) {
  console.error('Error: --limit must be a positive number.');
  process.exit(1);
}

const BASE_STYLE =
  'Editorial luxury skincare beauty product photography. Clean, modern, serene composition on a smooth light travertine or marble vanity surface. Soft diffuse morning sunlight casting gentle natural shadows, subtle botanical accents, immaculate textures. Photorealistic, crisp commercial quality, 8k resolution, no artificial watermarks, no distorted text.';
/* Covers must not show a real brand's packaging: on a review site a generated bottle with a real logo reads as a
   product photo or an endorsement. Earlier covers came back with CeraVe and Sothys labels. */
const UNBRANDED =
  'All packaging is unbranded and generic: plain minimalist labels with no logos, no brand names and no readable product names.';

function buildPrompt(post) {
  if (CUSTOM_PROMPT) return `${CUSTOM_PROMPT}. ${UNBRANDED} ${BASE_STYLE}`;

  const title = post.title || '';
  const excerpt = post.excerpt || '';
  const text = `${title} ${excerpt}`.toLowerCase();

  let subject = '';

  if (text.includes('niacinamide')) {
    subject = 'A minimalist glass dropper bottle of pore-refining 10% Niacinamide serum with a single clear droplet suspended from the pipette tip, beside smooth grey river pebbles and fresh eucalyptus leaves.';
  } else if (text.includes('rose petal') || text.includes('rosehip') || (text.includes('facial oil') && text.includes('rose'))) {
    subject = 'An amber glass bottle of nourishing rose petal facial elixir with golden botanical oil, surrounded by delicate fresh pale pink rose petals and subtle warm candlelight.';
  } else if (text.includes('acne treatment gel') || text.includes('salicylic')) {
    subject = 'A sleek white dermatological treatment gel tube with a clear calming gel bead on a clean frosted glass surface, with soothing cica leaves in the soft background.';
  } else if (text.includes('retinol') && (text.includes('wrinkle') || text.includes('filler') || text.includes('cream'))) {
    subject = 'A luxury targeted anti-aging retinol treatment tube with a precision silver applicator tip resting on a polished slate tray beside night-blooming botanicals.';
  } else if (text.includes('sheet mask') || text.includes('facial mask') || text.includes('glam up')) {
    subject = 'A luxurious set of unopened colorful botanical facial sheet mask sachets neatly fanned out on a light bamboo spa tray beside a folded linen bath towel and calming chamomile sprigs.';
  } else if (text.includes('sunscreen') || text.includes('spf')) {
    subject = 'A clean white tube of high-protection mineral daily sunscreen lotion resting on a warm stone ledge in bright golden sunlight with soft palm frond shadows.';
  } else if (text.includes('cleanser') || text.includes('face wash')) {
    subject = 'A frosted pump bottle of gentle foaming facial cleanser with silky soft white lather bubbles and fresh crystal water droplets on a white porcelain vanity.';
  } else if (text.includes('moisturizer') || text.includes('night cream')) {
    subject = 'A frosted glass jar of rich restorative barrier cream moisturizer with a creamy swirl dollop on a small wooden cosmetic spatula.';
  } else if (text.includes('serum')) {
    subject = 'An elegant apothecary glass serum dropper bottle with pure hydrating liquid, resting on a stone pedestal with subtle water ripples.';
  } else {
    subject = `A premium skincare product arrangement for ${title.replace(/[^\w\s-]/g, '')}, featuring minimalist bottles and jars on a luxury vanity tray.`;
  }

  return `${subject} ${UNBRANDED} ${BASE_STYLE}`;
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

const POST_QUERY = 'fields[0]=title&fields[1]=excerpt&fields[2]=slug&populate[coverImage][fields][0]=url&populate[categories][fields][0]=slug';

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

/* ------------------------------------------------------------------ images */

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

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image from ${url}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  mkdirSync(dirname(destPath), { recursive: true });
  writeFileSync(destPath, buffer);
  return buffer;
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
  console.log(`\n─── BestLooking.Skin Cover Generator (fal.ai) ───`);
  console.log(`Model : ${MODEL}${DRY ? '   [dry run]' : ''}`);

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
    plan.push({ post, filename, action: onDisk && !FORCE ? 'register' : 'generate' });
  }

  /* Free re-registrations first, so the paid-generation cap below never stops them. */
  plan.sort((a, b) => (a.action === b.action ? 0 : a.action === 'register' ? -1 : 1));
  const toGenerate = plan.filter((p) => p.action === 'generate').length;
  const toRegister = plan.length - toGenerate;
  if (ALL) {
    console.log(`Posts : ${posts.length} published, ${skipped} already have a cover`);
    console.log(`Plan  : register ${toRegister} image(s) already on disk, generate ${toGenerate} new`);
  }

  const cap = LIMIT ?? (ALL && !YES ? ALL_SAFETY_CAP : Infinity);
  let generated = 0;
  let registered = 0;

  for (const { post, filename, action } of plan) {
    const outPath = join(UPLOADS_DIR, filename);
    const label = `${post.categories?.[0]?.slug ?? '?'}/${post.slug}`;

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

    const prompt = buildPrompt(post);
    console.log(`\nMake  : ${label}\nTitle : ${plainText(post.title)}\nPrompt: "${prompt}"`);
    if (DRY) {
      generated++;
      continue;
    }
    if (!FAL_KEY) throw new Error('FAL_KEY missing in environment or .env.local');

    const start = Date.now();
    const result = await generateFalImage(prompt);
    console.log(`        generated in ${((Date.now() - start) / 1000).toFixed(1)}s`);
    const buf = await downloadImage(result.url, outPath);
    manifest[post.slug] = manifestEntry(post, filename, buf, MODEL);
    registerCover(post.slug, manifest[post.slug]);
    console.log(`        saved /cms-uploads/${filename} (${(buf.length / 1024).toFixed(0)} KB, ` +
      `${manifest[post.slug].width}×${manifest[post.slug].height}) and registered it`);
    if (codeSlugs.has(post.slug)) {
      console.log(`        note: POST_COVER_OVERRIDES in lib/strapi.ts also has "${post.slug}" and takes priority; ` +
        `it shows this new image only if it points at /cms-uploads/${filename}.`);
    }
    generated++;
  }

  if (DRY) {
    console.log(`\nDry run: would register ${registered} and generate ${generated}. Nothing written, nothing billed.`);
  } else if (generated + registered > 0) {
    console.log(`\n✔ ${generated} generated, ${registered} registered. They show on the post page now and in listings within ` +
      `about a minute: no code change, rebuild or deploy needed.`);
  } else if (!SLUG) {
    console.log('\nNothing to do: every post already has a cover.');
  }
}

main().catch((err) => {
  console.error('\nExecution failed:', err.message);
  process.exit(1);
});
