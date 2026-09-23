#!/usr/bin/env node
/**
 * Fetch iHerb category products through ZenRows — manually, on demand.
 *
 *   node scripts/fetch-iherb-products.mjs "https://au.iherb.com/c/hair-skin-nails"
 *
 * There is no schedule and no cron. Run it when you want new products; it does
 * nothing until you do.
 *
 * WHAT IT WRITES
 *
 * A JSON file, and nothing else. It never writes to Strapi. Import is a
 * separate, deliberate step once you have read what came back.
 *
 * WHAT IT SKIPS
 *
 * Anything already in the shared commerce-products pool. Matching is by the
 * iHerb product id in the URL (/pr/{slug}/{id}), then by SKU, then by a
 * normalised name — because the iHerb rows already in Strapi arrived via
 * DataForSEO and carry no merchantSku, so the id in their offer URL is the only
 * reliable key they have.
 *
 * FACTS vs PROSE  — read this before importing anything
 *
 * Each record is split in two:
 *
 *   facts       Name, brand, SKU, UPC, size, price, rating, ingredients,
 *               supplement facts. Nobody owns these. Safe to publish.
 *
 *   sourceProse The manufacturer's own description and marketing copy. This is
 *               iHerb's or the brand's, NOT yours. It is here so you can read
 *               it while writing your own, and it must never be imported into
 *               Strapi or published. The site already carries an audit finding
 *               (C2) for 243 pages that reproduce manufacturer copy verbatim —
 *               do not add to it.
 *
 * REQUIRED ENV (put these in .env.local, which is gitignored)
 *
 *   ZENROWS_API_KEY          your ZenRows key
 *   NEXT_PUBLIC_STRAPI_URL   defaults to https://cms.fxnstudio.com
 *   STRAPI_API_TOKEN         optional; reads are public
 *
 * FLAGS
 *
 *   --pages N        listing pages to walk (default 1, 48 products per page)
 *   --limit N        stop after N new products (useful for a first run)
 *   --no-details     skip per-product pages: 1 request instead of ~49, but no
 *                    ingredients, supplement facts, UPC or size
 *   --out PATH       output file (default data/iherb-<category>-<date>.json)
 *   --delay MS       pause between requests (default 1500)
 *   --dry-run        discover and dedupe, fetch no product pages, write nothing
 *   --include-existing  also fetch products already in Strapi (marked
 *                    alreadyInStrapi: true), to refresh their facts
 *
 * COST
 *
 * One ZenRows request per listing page, plus one per new product unless
 * --no-details. A 48-product category is ~49 requests. Use --limit while you
 * are still checking the output looks right.
 *
 * iHerb needs js_render AND premium_proxy (ZenRows refuses the domain without
 * them), and both are charged at a premium, so budget well above one credit per
 * request.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/* ── env ─────────────────────────────────────────────────────────────────── */

/**
 * Read .env.local into process.env.
 *
 * `.env.local` is a Next.js convention: the framework loads it during a build
 * or `next dev`, but a plain `node scripts/...` run does not, so ZENROWS_API_KEY
 * would sit in the file and still read as unset. Rather than require
 * `node --env-file=.env.local` be remembered every time, load it here.
 *
 * A real environment variable always wins, so `ZENROWS_API_KEY=... node ...`
 * still overrides the file. Run from the project root; that is where the file is.
 */
function loadEnvFile(file) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const [, key, rawValue] = m;
    if (process.env[key] !== undefined) continue;
    let value = rawValue.trim();
    if (/^"(.*)"$/s.test(value) || /^'(.*)'$/s.test(value)) {
      value = value.slice(1, -1);
    } else {
      /* Unquoted values may carry a trailing comment; quoted ones never do. */
      value = value.replace(/\s+#.*$/, '').trim();
    }
    process.env[key] = value;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

/* ── config ──────────────────────────────────────────────────────────────── */

const ZENROWS_KEY = process.env.ZENROWS_API_KEY || '';
const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || 'https://cms.fxnstudio.com').replace(/\/$/, '');
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || '';

const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const has = (name) => args.includes(name);

/**
 * The bare category URL.
 *
 * Category links copied out of a browser arrive carrying ad tracking --
 * `?_gl=...&gclid=...&gclsrc=...`. Passing that through means every ZenRows
 * request hauls someone's ad-click id along, and the pagination builder appends
 * `&p=2` to the end of it. Nothing on a category page is controlled by the query
 * string except the page number, which this script adds itself, so the whole
 * search part goes.
 */
function normaliseCategoryUrl(raw) {
  try {
    const u = new URL(raw);
    return `${u.origin}${u.pathname}`.replace(/\/$/, '');
  } catch {
    return raw;
  }
}

const RAW_URL = args.find((a) => /^https?:\/\//.test(a));
const CATEGORY_URL = RAW_URL ? normaliseCategoryUrl(RAW_URL) : undefined;
const PAGES = Number(flag('--pages', 1)) || 1;
const LIMIT = flag('--limit') ? Number(flag('--limit')) : Infinity;
const WITH_DETAILS = !has('--no-details');
const DELAY_MS = Number(flag('--delay', 1500)) || 1500;
const INCLUDE_EXISTING = args.includes('--include-existing');
const DRY_RUN = has('--dry-run');

if (!CATEGORY_URL) {
  console.error('Usage: node scripts/fetch-iherb-products.mjs "<iherb category url>" [--pages N] [--limit N] [--no-details] [--dry-run]');
  process.exit(2);
}
if (!ZENROWS_KEY && !DRY_RUN) {
  console.error('ZENROWS_API_KEY is not set.');
  console.error('Put it in .env.local in the project root, and run this from the project root.');
  console.error('Or pass --dry-run to test discovery without a key.');
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── ZenRows ─────────────────────────────────────────────────────────────── */

/**
 * One ZenRows call.
 *
 * `proxy_country=au` is not optional for this site: au.iherb.com prices in AUD
 * only when the request looks Australian. Scrape it from elsewhere and you get
 * USD figures under an AU URL, which is how a catalogue ends up quoting prices
 * that are wrong by half.
 *
 * `premium_proxy` and `js_render` are both required. The grid and the JSON-LD
 * are in fact present in the server-rendered HTML, so a browser render looks
 * unnecessary -- but ZenRows gates the domain itself and answers a request
 * without js_render with REQS002 ("requires javascript rendering enabled")
 * rather than the page. What the markup contains is not the deciding factor.
 *
 * Both flags cost extra credits, so the per-product budget is higher than a
 * plain fetch. Use --limit while testing.
 */
async function zenrows(targetUrl, { attempt = 1, wait = 0 } = {}) {
  const params = new URLSearchParams({
    apikey: ZENROWS_KEY,
    url: targetUrl,
    js_render: 'true',
    premium_proxy: 'true',
    proxy_country: 'au',
    ...(wait ? { wait: String(wait) } : {}),
  });
  const res = await fetch(`https://api.zenrows.com/v1/?${params}`);

  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 4) throw new Error(`ZenRows ${res.status} after ${attempt} attempts: ${targetUrl}`);
    const backoff = DELAY_MS * 2 ** attempt;
    console.warn(`  ZenRows ${res.status}, retrying in ${backoff}ms (attempt ${attempt + 1}/4)`);
    await sleep(backoff);
    return zenrows(targetUrl, { attempt: attempt + 1, wait });
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    let hint = body.slice(0, 400);
    try {
      const parsed = JSON.parse(body);
      if (parsed.detail) hint = `${parsed.title ?? ''} ${parsed.detail}`.trim();
    } catch {
      /* not JSON; the raw body is the best we have */
    }
    throw new Error(`ZenRows ${res.status}: ${hint}`);
  }
  return res.text();
}

/* ── existing catalogue ──────────────────────────────────────────────────── */

const normaliseName = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[®™©]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** The numeric id in an iHerb product URL: /pr/{slug}/{id} */
const iherbIdFromUrl = (url) => String(url || '').match(/\/pr\/[^/]+\/(\d+)/)?.[1] ?? null;

/**
 * Everything already in the pool, indexed three ways.
 *
 * The pool is SHARED with nxt.bargains and nxt-sourcing, so this deliberately
 * does not filter by site: a product that exists for another storefront is
 * still a duplicate, and adding it twice is how one product becomes two rows
 * with diverging prices.
 */
async function loadExisting() {
  const byIherbId = new Set();
  const bySku = new Set();
  const byGtin = new Set();
  const byName = new Set();
  let page = 1;
  let total = 0;

  for (;;) {
    /* These are the real attribute names on commerce-products. `skuOrModel` and
       `sourceUrl` are NOT among them -- the frontend derives those in
       normalizeCommerceProduct from the offers, and asking Strapi for them
       returns a 400. */
    const qs = new URLSearchParams({
      'fields[0]': 'name',
      'fields[1]': 'sku',
      'fields[2]': 'gtin',
      'fields[3]': 'mpn',
      'populate[offers][fields][0]': 'productUrl',
      'populate[offers][fields][1]': 'merchantSku',
      'pagination[page]': String(page),
      'pagination[pageSize]': '100',
    });
    const res = await fetch(`${STRAPI}/api/commerce-products?${qs}`, {
      headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
    });
    if (!res.ok) {
      /* Include Strapi's own message: "Invalid key foo" names the bad field
         immediately, where a bare status code sends you guessing. */
      const body = await res.text().catch(() => '');
      throw new Error(`Strapi ${res.status} reading commerce-products: ${body.slice(0, 300)}`);
    }
    const json = await res.json();

    for (const p of json.data ?? []) {
      total += 1;
      if (p.name) byName.add(normaliseName(p.name));
      for (const code of [p.sku, p.mpn, ...(p.offers ?? []).map((o) => o.merchantSku)]) {
        if (code) bySku.add(String(code).toUpperCase());
      }
      if (p.gtin) byGtin.add(String(p.gtin).replace(/\D/g, ''));
      for (const url of (p.offers ?? []).map((o) => o.productUrl)) {
        const id = iherbIdFromUrl(url);
        if (id) byIherbId.add(id);
      }
    }

    const pageCount = json.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) break;
    page += 1;
  }

  console.log(
    `Indexed ${total} existing products — ${byIherbId.size} with an iHerb id, ${bySku.size} with a SKU/MPN, ${byGtin.size} with a GTIN.`,
  );
  return { byIherbId, bySku, byGtin, byName };
}

/* ── listing ─────────────────────────────────────────────────────────────── */

/**
 * Product URLs from a category page.
 *
 * Deliberately only reads links. The card markup (prices, star ratings) is
 * class-name soup that changes without notice; the product page carries the
 * same values in JSON-LD, which does not. With --no-details we fall back to
 * scraping the cards, and that is the fragile path.
 */
function parseListing(html) {
  const seen = new Map();
  const re = /href="(https:\/\/[a-z]{2}\.iherb\.com\/pr\/[^"?#]+\/(\d+))[^"]*"/g;
  let m;
  while ((m = re.exec(html))) {
    if (!seen.has(m[2])) seen.set(m[2], m[1]);
  }
  return [...seen.entries()].map(([id, url]) => ({ iherbId: id, url }));
}

/** Card-level fallback for --no-details. Best effort; nulls where unsure. */
function parseCards(html) {
  const out = [];
  const blocks = html.split('product-cell-container').slice(1);
  for (const b of blocks) {
    const url = b.match(/href="(https:\/\/[a-z]{2}\.iherb\.com\/pr\/[^"?#]+\/(\d+))/);
    if (!url) continue;
    const priceText = b.match(/class="[^"]*product-price[^"]*"[^>]*>\s*([^<]+)/)?.[1]?.trim() ?? null;
    const ratingTitle = b.match(/title="([\d.]+)\/5 - ([\d,]+) Reviews"/);
    out.push({
      iherbId: url[2],
      url: url[1],
      name: b.match(/<img[^>]+alt="([^"]+)"/)?.[1]?.trim() ?? null,
      image: b.match(/<img[^>]+src="(https:\/\/[^"]+)"/)?.[1] ?? null,
      priceText,
      price: priceText ? Number(priceText.replace(/[^\d.]/g, '')) || null : null,
      currency: priceText && /AU\$/.test(priceText) ? 'AUD' : null,
      rating: ratingTitle ? Number(ratingTitle[1]) : null,
      ratingCount: ratingTitle ? Number(ratingTitle[2].replace(/,/g, '')) : null,
      outOfStock: /data-is-out-of-stock="true"/.test(b.slice(0, 400)),
    });
  }
  return out;
}

/* ── product detail ──────────────────────────────────────────────────────── */

const stripTags = (s) =>
  String(s || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();

/** Every JSON-LD block on the page, parsed, bad ones skipped. */
function jsonLdBlocks(html) {
  const out = [];
  const re = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      out.push(JSON.parse(m[1].trim()));
    } catch {
      /* iHerb ships one malformed block on some pages; ignore it. */
    }
  }
  return out;
}

/** The "Product code: X" style specs list. */
function parseSpecs(html) {
  const block = html.match(/id="product-specs-list"[\s\S]{0,4000}?<\/ul>/i)?.[0] ?? '';
  const specs = {};
  for (const li of block.match(/<li[\s\S]*?<\/li>/gi) ?? []) {
    const text = stripTags(li);
    const idx = text.indexOf(':');
    if (idx > 0 && idx < 40) specs[text.slice(0, idx).trim()] = text.slice(idx + 1).trim();
  }
  return specs;
}

/**
 * A titled section's text, e.g. "Other ingredients", "Supplement facts".
 *
 * Returns null rather than a guess when the heading is not found — a wrong
 * ingredient list is worse than no ingredient list.
 */
function sectionText(html, heading) {
  const re = new RegExp(`>\\s*${heading}\\s*<\\/h[23]>([\\s\\S]{0,6000}?)<h[23]`, 'i');
  const body = html.match(re)?.[1];
  if (!body) return null;
  const text = stripTags(body);
  return text.length > 2 ? text : null;
}

/**
 * The "Supplement facts" table, one line per row ("Protein: 4 g (<1%*)").
 *
 * Its heading sits inside the table itself and the table runs well past the
 * 6,000 characters sectionText reads, so it gets its own parser.
 */
function supplementFactsTable(html) {
  const start = html.search(/<h3>\s*Supplement facts\s*<\/h3>/i);
  if (start === -1) return null;
  const end = html.indexOf('</table>', start);
  if (end === -1) return null;
  const lines = [];
  for (const tr of html.slice(start, end).match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
    const cells = (tr.match(/<td[\s\S]*?<\/td>/gi) ?? []).map(stripTags).filter(Boolean);
    if (!cells.length || /^(supplement facts|amount per serving)$/i.test(cells[0])) continue;
    lines.push(cells.length === 1 ? cells[0] : `${cells[0]}: ${cells.slice(1).join(' (')}${cells.length > 2 ? ')' : ''}`);
  }
  return lines.length ? lines.join('\n') : null;
}

/* The product-information block (overview, suggested use, ingredients,
   warnings, supplement facts) renders after the rest of the page. A response
   captured before it arrives parses as "none of these exist" -- which is how
   the first hyaluronic-acid run came back with every one of them null. */
const hasProductInfo = (html) => /<h2[^>]*>\s*Product information\s*<\/h2>/i.test(html);

function parseProduct(html, { iherbId, url }) {
  const ld = jsonLdBlocks(html).find((x) => x && x['@type'] === 'Product');
  const specs = parseSpecs(html);
  const offer = ld?.offers ?? {};

  return {
    /* ── FACTS: safe to publish ─────────────────────────────────────────── */
    facts: {
      iherbId,
      url,
      name: ld?.name ?? null,
      brand: ld?.brand?.name ?? null,
      brandCode: ld?.brand?.identifier ?? null,
      sku: ld?.sku ?? specs['Product code'] ?? null,
      upc: specs['UPC'] ?? null,
      packageQuantity: specs['Package quantity'] ?? null,
      dimensions: specs['Dimensions'] ?? null,
      /* iHerb puts its explanatory tooltip inside the same element. */
      shippingWeight: specs['Shipping weight']?.split(/\s+Shipping weight\b/i)[0].trim() || null,
      firstAvailable: specs['First available'] ?? null,
      price: offer.price != null ? Number(offer.price) : null,
      currency: offer.priceCurrency ?? null,
      availability: typeof offer.availability === 'string' ? offer.availability.split('/').pop() : null,
      rating: ld?.aggregateRating?.ratingValue ?? null,
      ratingCount: ld?.aggregateRating?.reviewCount ?? null,
      image: typeof ld?.image === 'string' ? ld.image : (ld?.image?.[0] ?? null),
      /* Factual composition data. Publishable, and the most useful thing here
         for writing something accurate. */
      ingredients: sectionText(html, 'Other ingredients'),
      supplementFacts: supplementFactsTable(html),
      suggestedUse: sectionText(html, 'Suggested use'),
      /* iHerb appends its own site-wide disclaimer to this section. */
      warnings: sectionText(html, 'Warnings')?.split(/\s*Disclaimer\s+While iHerb/i)[0].trim() || null,
      specs,
    },

    /* ── SOURCE PROSE: reference only. DO NOT IMPORT OR PUBLISH. ─────────── */
    sourceProse: {
      _warning: 'Manufacturer copy. Not yours. Read it, write your own, do not publish this.',
      description: ld?.description ?? null,
      overview: sectionText(html, 'Overview'),
    },

    incomplete: !hasProductInfo(html),
    fetchedAt: new Date().toISOString(),
  };
}

/* ── size variants ───────────────────────────────────────────────────────── */

/**
 * The product name with its size stripped off.
 *
 * iHerb sells one formula as several SKUs -- CollagenUP is a 7.26 oz tub, a
 * 1.02 lb tub and a 2.2 lb tub, three products with three URLs. That is right
 * for a shop and wrong for an editorial site: three near-identical pages split
 * the search signal between them and read as thin duplicates, which is the
 * shape of problem the Sep 2026 audit already raised.
 *
 * Grouping by this key surfaces them together so a formula can be published as
 * ONE page that mentions the sizes, rather than one page per tub.
 *
 * Strength is deliberately NOT stripped: "Hyaluronic Acid, 100 mg" and
 * "Hyaluronic Acid, 200 mg" are different products to a reader, not two sizes
 * of the same one.
 */
function baseName(name) {
  let s = String(name || '').replace(/[\u00ae\u2122\u00a9]/g, '').trim();
  let prev;
  do {
    prev = s;
    s = s.replace(/\s*\([^)]*\)\s*$/, '');
    s = s.replace(/,?\s*\d[\d.,]*\s*(?:fl\s*oz|oz|lbs?|kg|g|ml|l|ct|count|packets?|servings?|sticks?)\b\.?\s*$/i, '');
    s = s.replace(/,?\s*\d[\d.,]*\s*(?:veg(?:gie|etable|etarian)?\s*)?(?:capsules?|caps|tablets?|softgels?|gummies|lozenges|chewables?)\b\.?\s*$/i, '');
    s = s.replace(/[,\s\-]+$/, '');
  } while (s !== prev && s.length > 3);
  return s;
}

const groupKey = (name) => baseName(name).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Formulas that arrived as more than one size. */
function variantGroups(records) {
  const groups = new Map();
  for (const r of records) {
    const name = r.facts?.name;
    if (!name) continue;
    const key = groupKey(name);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, { formula: baseName(name), variants: [] });
    groups.get(key).variants.push({
      iherbId: r.facts.iherbId,
      size: r.facts.packageQuantity ?? String(name).slice(baseName(name).length).replace(/^[,\s]+/, '') ?? null,
      name,
      price: r.facts.price,
      currency: r.facts.currency,
      ratingCount: r.facts.ratingCount,
      url: r.facts.url,
    });
  }
  return [...groups.values()]
    .filter((g) => g.variants.length > 1)
    .map((g) => ({
      ...g,
      /* Most-reviewed first: the one to build the page around is usually the
         one most people actually buy. */
      variants: g.variants.sort((a, b) => (b.ratingCount ?? 0) - (a.ratingCount ?? 0)),
    }))
    .sort((a, b) => b.variants.length - a.variants.length);
}

/* ── main ────────────────────────────────────────────────────────────────── */

async function main() {
  const categorySlug = CATEGORY_URL.match(/\/c\/([a-z0-9-]+)/i)?.[1] ?? 'iherb';
  const outPath = flag('--out') ?? join('data', `iherb-${categorySlug}-${new Date().toISOString().slice(0, 10)}.json`);

  console.log(`Category : ${CATEGORY_URL}`);
  if (RAW_URL !== CATEGORY_URL) console.log(`           (tracking parameters stripped from the URL you passed)`);
  console.log(`Pages    : ${PAGES}   Details: ${WITH_DETAILS ? 'yes' : 'no'}   ${DRY_RUN ? '(dry run)' : ''}`);

  const existing = await loadExisting();

  /* 1. discover */
  let discovered = [];
  let cards = [];
  for (let page = 1; page <= PAGES; page += 1) {
    const pageUrl = page === 1 ? CATEGORY_URL : `${CATEGORY_URL}?p=${page}`;
    console.log(`\nListing page ${page}: ${pageUrl}`);
    if (DRY_RUN) {
      console.log('  (dry run — no request made)');
      continue;
    }
    const html = await zenrows(pageUrl);
    const found = parseListing(html);
    if (!WITH_DETAILS) cards = cards.concat(parseCards(html));
    console.log(`  ${found.length} product links`);
    discovered = discovered.concat(found);
    if (page < PAGES) await sleep(DELAY_MS);
  }

  /* 2. dedupe */
  const byId = new Map(discovered.map((d) => [d.iherbId, d]));
  const fresh = [];
  const skipped = [];
  for (const item of byId.values()) {
    if (existing.byIherbId.has(item.iherbId)) {
      if (INCLUDE_EXISTING) { fresh.push({ ...item, alreadyInStrapi: true }); continue; }
      skipped.push({ ...item, reason: 'iherb id already in Strapi' });
      continue;
    }
    fresh.push(item);
  }
  console.log(`\n${byId.size} unique products — ${fresh.length} new, ${skipped.length} already in Strapi.`);

  if (DRY_RUN) {
    console.log('Dry run: stopping before any product pages are fetched.');
    return;
  }

  /* 3. detail */
  const records = [];
  const failures = [];
  const queue = fresh.slice(0, LIMIT === Infinity ? fresh.length : LIMIT);

  if (!WITH_DETAILS) {
    const keep = new Set(queue.map((q) => q.iherbId));
    for (const c of cards) {
      if (!keep.has(c.iherbId)) continue;
      if (existing.bySku.has(String(c.name).toUpperCase()) || existing.byName.has(normaliseName(c.name))) {
        skipped.push({ ...c, reason: 'name already in Strapi' });
        continue;
      }
      records.push({ facts: c, sourceProse: null, fetchedAt: new Date().toISOString() });
    }
  } else {
    for (const [i, item] of queue.entries()) {
      console.log(`[${i + 1}/${queue.length}] ${item.url}`);
      try {
        let html = await zenrows(item.url);
        for (let retry = 1; retry <= 2 && !hasProductInfo(html); retry += 1) {
          console.log(`    product information not rendered yet — refetching with a ${retry * 4}s wait`);
          await sleep(DELAY_MS);
          html = await zenrows(item.url, { wait: retry * 4000 });
        }
        const rec = parseProduct(html, item);
        if (item.alreadyInStrapi) rec.facts.alreadyInStrapi = true;
        if (rec.incomplete) console.log('    WARNING: product information block missing; ingredients/directions/warnings are empty');

        /* Second dedupe pass: SKU and name are only known after the fetch, and
           the same product reaches Strapi under different URLs from different
           sources. */
        const sku = rec.facts.sku ? String(rec.facts.sku).toUpperCase() : null;
        const gtin = rec.facts.upc ? String(rec.facts.upc).replace(/\D/g, '') : null;
        if (item.alreadyInStrapi) {
          records.push(rec);
          console.log(`    (already in Strapi) ${rec.facts.name?.slice(0, 60) ?? '(no name found)'}`);
        } else if (sku && existing.bySku.has(sku)) {
          skipped.push({ ...item, reason: `SKU ${sku} already in Strapi` });
          console.log('    skipped — SKU already in Strapi');
        } else if (gtin && existing.byGtin.has(gtin)) {
          /* The strongest key available: a UPC identifies the exact package,
             so it catches the same product imported under a different name. */
          skipped.push({ ...item, reason: `GTIN ${gtin} already in Strapi` });
          console.log('    skipped — UPC already in Strapi');
        } else if (rec.facts.name && existing.byName.has(normaliseName(rec.facts.name))) {
          skipped.push({ ...item, reason: 'name already in Strapi' });
          console.log('    skipped — name already in Strapi');
        } else {
          records.push(rec);
          if (sku) existing.bySku.add(sku);
          if (gtin) existing.byGtin.add(gtin);
          if (rec.facts.name) existing.byName.add(normaliseName(rec.facts.name));
          console.log(`    ${rec.facts.name?.slice(0, 60) ?? '(no name found)'}`);
        }
      } catch (err) {
        console.warn(`    FAILED: ${err.message}`);
        failures.push({ ...item, error: err.message });
      }
      if (i < queue.length - 1) await sleep(DELAY_MS);
    }
  }

  /* 4. write */
  const groups = variantGroups(records);

  const payload = {
    source: CATEGORY_URL,
    category: categorySlug,
    fetchedAt: new Date().toISOString(),
    counts: {
      discovered: byId.size,
      new: records.length,
      skipped: skipped.length,
      failed: failures.length,
      formulasWithMultipleSizes: groups.length,
    },
    /* Same formula, different tub. Publish one page per entry here, not one per
       variant -- see baseName() for why. Variants are ordered most-reviewed
       first, which is usually the size to build the page around. */
    variantGroups: groups,
    note:
      'facts.* is publishable. sourceProse.* is the manufacturer\'s copy — reference only, ' +
      'never import it into Strapi. Rewrite from the facts.',
    products: records,
    skipped,
    failures,
  };

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`\nWrote ${records.length} new products to ${outPath}`);
  if (groups.length) {
    console.log(`${groups.length} formula${groups.length === 1 ? '' : 's'} came back in more than one size — see "variantGroups".`);
    for (const g of groups.slice(0, 5)) {
      console.log(`  ${g.formula.slice(0, 64)} — ${g.variants.length} sizes`);
    }
    if (groups.length > 5) console.log(`  ...and ${groups.length - 5} more`);
  }
  if (failures.length) console.log(`${failures.length} failed — see "failures" in the file.`);
  console.log('Nothing was written to Strapi. Review the file, write your own copy, then import.');
}

main().catch((err) => {
  console.error(`\n${err.message}`);
  /* Not process.exit(): forcing exit while a fetch is still unwinding trips a
     libuv assertion on Windows. Setting the code lets Node close cleanly. */
  process.exitCode = 1;
});
