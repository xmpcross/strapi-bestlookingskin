#!/usr/bin/env node
// Create geni.us short links for outbound links to Geniuslink's partner merchants and cache them in
// data/geniuslink-links.json, keyed by the plain retailer URL (read by lib/links.ts).
//
//   node scripts/fetch-geniuslink-links.mjs              # create everything not cached yet
//   node scripts/fetch-geniuslink-links.mjs --limit 2    # a first test
//   node scripts/fetch-geniuslink-links.mjs --dry-run    # list what would be created
//
// Partner merchants are the ones whose affiliate programmes are connected in the Geniuslink account:
// GENIUSLINK_MERCHANT_SLUGS (default amazon,target,newegg,walmart,best-buy) plus their hosts. Amazon is never
// linked from this site (no active Associates account). Creating links is free; Geniuslink bills by clicks.
//
// Env: GENIUSLINK_API_KEY, GENIUSLINK_API_SECRET, GENIUSLINK_GROUP_ID, GENIUSLINK_DOMAIN -- from .env.local, or
// from the nxt-sourcing .env.local (GENIUSLINK_ENV_FILE) where the account is already configured.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectOutbound, host, loadEnv } from './lib/outbound-urls.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
loadEnv(join(ROOT, '.env.local'));
loadEnv(process.env.GENIUSLINK_ENV_FILE || '/opt/strapi-cms-git/backend/nxt-sourcing/.env.local');

const OUT = join(ROOT, 'data', 'geniuslink-links.json');
const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const li = args.indexOf('--limit');
const limit = li !== -1 ? Number(args[li + 1]) : Infinity;
const { GENIUSLINK_API_KEY: KEY, GENIUSLINK_API_SECRET: SECRET, GENIUSLINK_GROUP_ID: GROUP } = process.env;
const DOMAIN = (process.env.GENIUSLINK_DOMAIN || 'geni.us').replace(/^https?:\/\//, '').replace(/\/$/, '');

const SLUGS = (process.env.GENIUSLINK_MERCHANT_SLUGS || 'amazon,target,newegg,walmart,best-buy').split(',').map((s) => s.trim()).filter((s) => s && s !== 'amazon');
const HOSTS = { walmart: 'walmart.com', target: 'target.com', newegg: 'newegg.com', 'best-buy': 'bestbuy.com' };
const partnerHosts = SLUGS.map((s) => HOSTS[s]).filter(Boolean);
const isPartner = (r) => SLUGS.includes(r.merchant) || partnerHosts.some((h) => host(r.url) === h || host(r.url).endsWith(`.${h}`));

async function create(url, note) {
  const params = new URLSearchParams({ url, note, groupId: String(GROUP), fetchMetadata: 'false' });
  if (DOMAIN && DOMAIN !== 'geni.us') params.set('domain', DOMAIN);
  const res = await fetch(`https://api.geni.us/v3/shorturls?${params}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Api-Key': KEY, 'X-Api-Secret': SECRET },
    body: '{}',
  });
  const body = await res.json().catch(() => ({}));
  const s = body.shortUrl;
  if (!res.ok || !s?.code) throw new Error(`HTTP ${res.status} ${JSON.stringify(body).slice(0, 200)}`);
  return `https://${s.domain || s.baseDomain || DOMAIN}/${s.code}`;
}

async function main() {
  if (!dry && (!KEY || !SECRET || !GROUP)) throw new Error('GENIUSLINK_API_KEY, GENIUSLINK_API_SECRET and GENIUSLINK_GROUP_ID are required.');
  const cache = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { links: {}, checkedAt: null };
  const all = (await collectOutbound(ROOT)).filter(isPartner);
  const todo = all.filter((r) => !cache.links[r.url]).slice(0, limit);
  console.log(`${all.length} partner-merchant URLs, ${todo.length} to create`);
  if (dry) return todo.forEach((r) => console.log(`  ${r.source.padEnd(5)} ${r.url}`));
  let made = 0;
  for (const r of todo) {
    try {
      cache.links[r.url] = await create(r.url, `bestlooking.skin ${r.source}: ${host(r.url)}`);
      made += 1;
      if (made % 20 === 0) console.log(`  ${made} created`);
    } catch (e) {
      console.error(`  failed ${r.url}: ${e.message}`);
    }
    await new Promise((res) => setTimeout(res, 250));
  }
  cache.checkedAt = new Date().toISOString();
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(cache, null, 2));
  console.log(`${made} created this run; ${Object.keys(cache.links).length} links in ${OUT}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
