// Outbound URLs the site can link to, keyed exactly as lib/links.ts looks them up:
//   - offers on this site's listable products (active, or draft in an info-only category), normalised like
//     plainRetailerUrl() in lib/affiliate.ts;
//   - every http(s) link in published post bodies;
//   - brand websites from lib/brand-data.ts.
// Used by fetch-geniuslink-links.mjs and fetch-takeads-links.mjs.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
  }
}

export const host = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
};

/* Mirrors plainRetailerUrl() in lib/affiliate.ts for the cases offers actually contain. */
export function plainUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (/(^|\.)goto\.walmart\.com$/i.test(u.hostname)) return u.searchParams.get('u') || null;
    if (/(^|\.)ebay\.[a-z.]+$/i.test(u.hostname)) {
      for (const p of ['campid', 'mkcid', 'mkevt', 'mkrid', 'toolid', 'customid', 'siteid']) u.searchParams.delete(p);
      return u.toString();
    }
    return url;
  } catch {
    return null;
  }
}

const TRACKED = ['geni.us', 'tatrck.com', 'goto.walmart.com', 'goto.target.com', 'linksynergy.com', 'prf.hn', 'imp.i', 'ebay.com/ulk', 'awin1.com', 'tradedoubler.com', 'admitad.com', 'go.redirectingat.com', 'go.skimresources.com'];
const NEVER = /(^|\.)(bestlooking\.skin|cms\.fxnstudio\.com|aad\.org|nhs\.uk|nih\.gov|clevelandclinic\.org|mayoclinic\.org|fda\.gov|who\.int|wikipedia\.org|doi\.org|sciencedirect\.com|springer\.com|wiley\.com|jamanetwork\.com|nature\.com|google\.[a-z.]+|youtube\.com|facebook\.com|instagram\.com|pinterest\.com|twitter\.com|x\.com|tiktok\.com|reddit\.com)$/i;

/** True for a URL that must not be sent to an affiliate network. */
export function skip(url) {
  if (!url || !/^https?:\/\//.test(url)) return true;
  const h = host(url);
  if (!h || NEVER.test(h)) return true;
  if (/(^|\.)amazon\.[a-z.]+$/.test(h) || /(^|\.)amzn\.[a-z]+$/.test(h)) return true; // no active Associates account
  return TRACKED.some((t) => url.includes(t));
}

async function strapiAll(strapi, path, pick) {
  const out = [];
  for (let page = 1; page <= 50; page += 1) {
    const res = await fetch(`${strapi}/api/${path}&pagination[page]=${page}&pagination[pageSize]=100`);
    if (!res.ok) throw new Error(`Strapi ${res.status} on ${path.slice(0, 80)}`);
    const body = await res.json();
    out.push(...body.data.flatMap(pick));
    if (page >= (body.meta?.pagination?.pageCount || 1)) break;
  }
  return out;
}

/** { url, merchant, source } for every outbound link, de-duplicated by url. */
export async function collectOutbound(root) {
  const strapi = (process.env.STRAPI_INTERNAL_URL || 'http://127.0.0.1:8888').replace(/\/$/, '');
  const site = process.env.NEXT_PUBLIC_SITE_SLUG || 'bestlooking-skin';
  const offers = await strapiAll(
    strapi,
    `commerce-products?filters[site][slug][$eq]=${site}&filters[$or][0][productStatus][$eq]=active&filters[$or][1][productStatus][$eq]=draft&fields[0]=slug&populate[offers][fields][0]=productUrl&populate[offers][populate][merchant][fields][0]=slug`,
    (p) => (p.offers ?? []).map((o) => ({ url: plainUrl(o.productUrl), merchant: o.merchant?.slug || '', source: 'offer' })),
  );
  const posts = await strapiAll(strapi, 'bls-posts?fields[0]=content', (p) =>
    [...String(p.content || '').matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)].map((m) => ({ url: m[1].replace(/&amp;/g, '&'), merchant: '', source: 'post' })),
  );
  const brandFile = join(root, 'lib', 'brand-data.ts');
  const brands = existsSync(brandFile)
    ? [...readFileSync(brandFile, 'utf8').matchAll(/website:\s*['"](https?:\/\/[^'"]+)['"]/g)].map((m) => ({ url: m[1], merchant: '', source: 'brand' }))
    : [];
  const seen = new Map();
  for (const r of [...offers, ...posts, ...brands]) if (r.url && !skip(r.url) && !seen.has(r.url)) seen.set(r.url, r);
  return [...seen.values()];
}
