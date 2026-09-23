#!/usr/bin/env node
// SEO smoke check over a sitemap (or a list of paths). For every URL:
//   status 200, a self-referencing canonical, exactly one <h1>, JSON-LD that parses, no Review without
//   itemReviewed, no Product aggregateRating built from retailer data (flagged when no on-site reviews show),
//   og:image present, title length, robots noindex.
//
//   node scripts/seo-check.mjs                                   # https://www.bestlooking.skin/sitemap.xml
//   node scripts/seo-check.mjs --base http://127.0.0.1:3002      # local server (canonicals still expect www)
//   node scripts/seo-check.mjs --paths /serums,/products/x       # just these paths
//   node scripts/seo-check.mjs --limit 50 --json out.json
//
// Exit code 1 when any URL fails a hard check (status, canonical, h1, JSON-LD, Review).
const args = process.argv.slice(2);
const arg = (k, d) => {
  const i = args.indexOf(k);
  return i !== -1 ? args[i + 1] : d;
};
const CANON_ORIGIN = 'https://www.bestlooking.skin';
const base = (arg('--base', CANON_ORIGIN) || CANON_ORIGIN).replace(/\/$/, '');
const limit = Number(arg('--limit', 0)) || Infinity;
const jsonOut = arg('--json', null);
const UA = 'Mozilla/5.0 (compatible; bestlooking-seo-check/1.0)';

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

async function paths() {
  const list = arg('--paths', null);
  if (list) return list.split(',').map((p) => p.trim()).filter(Boolean);
  const xml = await (await fetch(`${base}/sitemap.xml`, { headers: { 'user-agent': UA } })).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]).replace(/^https?:\/\/[^/]+/, '') || '/');
}

function checkLd(blocks) {
  const errors = [];
  const types = [];
  let retailerRating = false;
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(walk);
    const t = node['@type'];
    if (t) types.push(Array.isArray(t) ? t.join('+') : t);
    if (t === 'Review' && !node.itemReviewed) errors.push('Review without itemReviewed');
    if (t === 'Product' && node.aggregateRating && !node.review) retailerRating = true;
    for (const v of Object.values(node)) if (v && typeof v === 'object') walk(v);
    if (node['@graph']) walk(node['@graph']);
  };
  for (const b of blocks) {
    try {
      walk(JSON.parse(b));
    } catch (e) {
      errors.push(`JSON-LD parse error: ${e.message.slice(0, 60)}`);
    }
  }
  return { errors, types: [...new Set(types)], retailerRating };
}

async function check(path) {
  const url = `${base}${path}`;
  const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'manual' });
  const r = { path, status: res.status, errors: [], warnings: [] };
  if (res.status !== 200) {
    r.errors.push(`status ${res.status}${res.headers.get('location') ? ` -> ${res.headers.get('location')}` : ''}`);
    return r;
  }
  const html = await res.text();
  const canonical = decode(html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1] ?? '');
  const expected = `${CANON_ORIGIN}${path === '/' ? '' : path}`;
  const norm = (u) => decodeURIComponent(u).replace(/\/$/, '');
  if (!canonical) r.errors.push('no canonical');
  else if (norm(canonical) !== norm(expected) && norm(canonical) !== norm(`${CANON_ORIGIN}${path}`)) r.errors.push(`canonical ${canonical}`);
  const h1 = (html.match(/<h1[\s>]/gi) ?? []).length;
  if (h1 !== 1) r.errors.push(`${h1} h1`);
  const blocks = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const ld = checkLd(blocks);
  r.errors.push(...ld.errors);
  r.types = ld.types;
  if (ld.retailerRating) r.warnings.push('Product aggregateRating without on-site reviews');
  if (!/<meta[^>]+property="og:image"/i.test(html)) r.warnings.push('no og:image');
  const title = decode(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '');
  r.titleLength = title.length;
  if (title.length > 65) r.warnings.push(`title ${title.length} chars`);
  if (/<meta[^>]+name="robots"[^>]+noindex/i.test(html)) r.warnings.push('noindex');
  return r;
}

async function main() {
  const list = (await paths()).slice(0, limit);
  const results = [];
  const queue = [...list];
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      for (let p = queue.shift(); p !== undefined; p = queue.shift()) {
        try {
          results.push(await check(p));
        } catch (e) {
          results.push({ path: p, errors: [`fetch failed: ${e.message}`], warnings: [] });
        }
      }
    }),
  );
  const failed = results.filter((r) => r.errors.length);
  const warn = {};
  for (const r of results) for (const w of r.warnings) warn[w.replace(/\d+ chars/, '>65 chars')] = (warn[w.replace(/\d+ chars/, '>65 chars')] ?? 0) + 1;
  console.log(`${results.length} URLs checked against ${base}: ${failed.length} failing`);
  for (const r of failed.slice(0, 40)) console.log(`  FAIL ${r.path}: ${r.errors.join('; ')}`);
  if (failed.length > 40) console.log(`  … ${failed.length - 40} more`);
  console.log('warnings:', JSON.stringify(warn));
  if (jsonOut) (await import('node:fs')).writeFileSync(jsonOut, JSON.stringify(results, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main();
