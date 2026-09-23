#!/usr/bin/env node
/**
 * Generate a featured cover image for a BestLooking.Skin post using fal.ai.
 *
 * Usage:
 *   node scripts/generate-post-cover.mjs --slug=<post-slug>
 *   node scripts/generate-post-cover.mjs --slug=<post-slug> --dry-run
 *   node scripts/generate-post-cover.mjs --slug=<post-slug> --fast # uses flux/schnell (~2s)
 *   node scripts/generate-post-cover.mjs --slug=<post-slug> --prompt="Custom prompt..."
 *
 * Env:
 *   FAL_KEY            fal.ai API key (from .env.local)
 *   FAL_IMAGE_MODEL    default: fal-ai/flux-pro/v1.1-ultra
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
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
const SLUG = flag('slug');
const CUSTOM_PROMPT = flag('prompt');

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || 'https://cms.fxnstudio.com').replace(/\/$/, '');
const FAL_KEY = process.env.FAL_KEY;
const MODEL = FAST ? 'fal-ai/flux/schnell' : (process.env.FAL_IMAGE_MODEL || 'fal-ai/flux-pro/v1.1-ultra');

if (!SLUG) {
  console.error('Error: --slug=<post-slug> is required.');
  process.exit(1);
}

if (!DRY && !FAL_KEY) {
  console.error('Error: FAL_KEY missing in environment or .env.local');
  process.exit(1);
}

const BASE_STYLE =
  'Editorial luxury skincare beauty product photography. Clean, modern, serene composition on a smooth light travertine or marble vanity surface. Soft diffuse morning sunlight casting gentle natural shadows, subtle botanical accents, immaculate textures. Photorealistic, crisp commercial quality, 8k resolution, no artificial watermarks, no distorted text.';

function buildPrompt(post) {
  if (CUSTOM_PROMPT) return `${CUSTOM_PROMPT}. ${BASE_STYLE}`;

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

  return `${subject} ${BASE_STYLE}`;
}

async function fetchPost(slug) {
  const url = `${STRAPI}/api/bls-posts?filters[slug][$eq]=${encodeURIComponent(slug)}&fields[0]=title&fields[1]=excerpt&fields[2]=postType&populate[categories][fields][0]=name&pagination[pageSize]=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Strapi fetch error: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.data?.[0] || null;
}

async function generateFalImage(prompt) {
  const isUltra = MODEL.includes('ultra');
  const body = {
    prompt,
    num_images: 1,
    enable_safety_checker: true,
    ...(isUltra ? { aspect_ratio: '4:3', output_format: 'jpeg' } : { image_size: 'landscape_4_3' }),
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
  return {
    url: imageUrl,
    width: json.images[0].width,
    height: json.images[0].height,
  };
}

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image from ${url}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  mkdirSync(dirname(destPath), { recursive: true });
  writeFileSync(destPath, buffer);
  return buffer.length;
}

async function main() {
  console.log(`\n─── BestLooking.Skin Cover Generator (fal.ai) ───`);
  console.log(`Slug  : ${SLUG}`);
  console.log(`Model : ${MODEL}`);

  const post = await fetchPost(SLUG);
  if (!post) {
    console.error(`Error: Post with slug "${SLUG}" not found in Strapi.`);
    process.exit(1);
  }

  console.log(`Title : ${post.title}`);
  const filename = `${SLUG.replace(/-/g, '_')}_cover.jpg`;
  const outPath = join(ROOT, 'public', 'cms-uploads', filename);

  if (existsSync(outPath) && !FORCE) {
    console.log(`\nNotice: Image already exists at ${outPath}. Use --force to overwrite.`);
    console.log(`URL path: /cms-uploads/${filename}`);
    return;
  }

  const prompt = buildPrompt(post);
  console.log(`\nPrompt:\n"${prompt}"\n`);

  if (DRY) {
    console.log('Dry run enabled — exiting without generating.');
    return;
  }

  console.log('Calling fal.ai API...');
  const start = Date.now();
  const result = await generateFalImage(prompt);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Generated in ${elapsed}s: ${result.url}`);

  console.log(`Downloading to public/cms-uploads/${filename}...`);
  const bytes = await downloadImage(result.url, outPath);
  console.log(`Saved ${(bytes / 1024).toFixed(1)} KB image to:`);
  console.log(`  File : ${outPath}`);
  console.log(`  Path : /cms-uploads/${filename}`);

  console.log(`\n✔ Cover generation complete!`);
}

main().catch((err) => {
  console.error('\nExecution failed:', err.message);
  process.exit(1);
});
