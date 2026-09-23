#!/usr/bin/env node
// Convert outbound URLs that Geniuslink does not cover into Takeads affiliate links and cache them in
// data/takeads-links.json, keyed by the plain URL (read by lib/links.ts when TAKEADS_ENABLED=true).
//
//   node scripts/fetch-takeads-links.mjs             # resolve everything not cached yet
//   node scripts/fetch-takeads-links.mjs --probe     # one URL, print the raw response
//   node scripts/fetch-takeads-links.mjs --limit 40  # cap a first run
//
// Env (.env.local): TAKEADS_PUBLIC_KEY -- this site's own platform key (Takeads dashboard -> Platforms ->
// bestlooking.skin -> Configure integration; not the Reporting key, and not another site's key, or clicks are
// credited to that site). TAKEADS_SUB_ID optional (default bestlooking-skin).
//
// API (as verified on nxt.bargains): PUT https://api.takeads.com/v1/product/monetize-api/v2/resolve,
// Authorization: Bearer <public key>, body { iris: [...] }. Unresolved URLs are cached as themselves so they are
// not retried every run; re-run weekly to pick up new offers and merchants.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectOutbound, host, loadEnv } from './lib/outbound-urls.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
loadEnv(join(ROOT, '.env.local'));
const ENDPOINT = 'https://api.takeads.com/v1/product/monetize-api/v2/resolve';
const OUT = join(ROOT, 'data', 'takeads-links.json');
const GENIUS = join(ROOT, 'data', 'geniuslink-links.json');
const BATCH = 20;
const args = process.argv.slice(2);
const probe = args.includes('--probe');
const li = args.indexOf('--limit');
const limit = li !== -1 ? Number(args[li + 1]) : Infinity;
const KEY = process.env.TAKEADS_PUBLIC_KEY;
const SUB_ID = process.env.TAKEADS_SUB_ID || 'bestlooking-skin';
/* Geniuslink partner hosts: those links go through Geniuslink, not Takeads. */
const GENIUS_HOSTS = ['walmart.com', 'target.com', 'bestbuy.com', 'newegg.com'];

async function resolve(urls) {
  const res = await fetch(ENDPOINT, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ iris: urls, subId: SUB_ID }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Takeads ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

function extract(body) {
  const rows = Array.isArray(body) ? body : body.data || body.items || [];
  const out = {};
  for (const row of rows) {
    const src = row.iri || row.url || row.originalUrl;
    const dst = row.trackingLink || row.trackingUrl || row.link || row.monetizedUrl;
    if (src && dst) out[src] = dst;
  }
  return out;
}

async function main() {
  if (!KEY) throw new Error('TAKEADS_PUBLIC_KEY missing from .env.local (Takeads dashboard -> Platforms -> bestlooking.skin -> Configure integration).');
  const cache = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { links: {}, checkedAt: null };
  const genius = existsSync(GENIUS) ? JSON.parse(readFileSync(GENIUS, 'utf8')).links : {};
  const all = (await collectOutbound(ROOT)).filter((r) => !genius[r.url] && !GENIUS_HOSTS.some((h) => host(r.url) === h || host(r.url).endsWith(`.${h}`)));
  const todo = all.filter((r) => !cache.links[r.url]).slice(0, limit).map((r) => r.url);
  console.log(`${all.length} candidate URLs, ${todo.length} to resolve`);
  if (probe) return console.log(JSON.stringify(await resolve(todo.slice(0, 1)), null, 2));
  let converted = 0;
  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH);
    try {
      const links = extract(await resolve(batch));
      for (const u of batch) cache.links[u] = links[u] || u;
      converted += Object.keys(links).length;
      console.log(`batch ${i / BATCH + 1}: ${Object.keys(links).length}/${batch.length} converted`);
    } catch (e) {
      console.error(`batch ${i / BATCH + 1} failed: ${e.message}`);
    }
  }
  cache.checkedAt = new Date().toISOString();
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(cache, null, 2));
  const live = Object.entries(cache.links).filter(([k, v]) => k !== v).length;
  console.log(`${converted} converted this run; ${live} monetised links in ${OUT}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
