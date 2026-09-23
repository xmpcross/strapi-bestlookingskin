#!/usr/bin/env node
// Point internal links in post bodies straight at their final URLs (GSC audit 24 Sep 2026, task 8).
//
// Finds links to bestlooking.skin (absolute, with or without www, or relative) under the retired folders
// (/product-comparisons, /how-to-guides, /top-rated-products, /top-rated, /product-reviews, /blog,
// /informative-articles, /skincare-how-to-guides), follows each unique old URL's redirects on the live site to its
// final URL, and rewrites the link to the final relative path. Any other absolute link to bestlooking.skin becomes
// relative too.
//
//   node scripts/fix-legacy-links.mjs --dry-run      # per-post counts, old -> new list, non-200 targets
//   node scripts/fix-legacy-links.mjs --write        # apply (backs up every changed row first)
//
// Writes go straight to the bls_posts rows in Postgres (both the draft and the published row of each post), not
// through the Strapi REST API: a REST update of a bls-post resets publishedAt, which would re-date every legacy post
// to today (and with it the sitemap lastmod and the listing order). Needs `docker exec` access to the CMS database
// container (STRAPI_DB_CONTAINER, default strapi-cms-postgres); no credentials are printed.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const DRY = !WRITE;
const SITE = 'https://www.bestlooking.skin';
const CONTAINER = process.env.STRAPI_DB_CONTAINER || 'strapi-cms-postgres';
const BACKUP_DIR = process.env.BACKUP_DIR || '/opt/backups/bestlooking-post-links';
const LEGACY = ['product-comparisons', 'how-to-guides', 'top-rated-products', 'top-rated', 'product-reviews', 'blog', 'informative-articles', 'skincare-how-to-guides'];

function psql(sql, { json = false } = {}) {
  const out = execFileSync('docker', ['exec', '-i', CONTAINER, 'sh', '-c', 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -q'], {
    input: sql,
    maxBuffer: 1 << 28,
  }).toString();
  return json ? JSON.parse(out.trim() || 'null') : out;
}

/* href="…" values that point at this site: absolute (www or not) or root-relative. */
const HREF = /href=(["'])((?:https?:\/\/(?:www\.)?bestlooking\.skin)?(\/[^"'#\s]*)?)(#[^"']*)?\1/gi;
/* Old WordPress pages with no redirect of their own: mapped by hand to their replacement. */
const MANUAL = { '/contact-us': '/contact', '/contact-us/': '/contact' };
const isLegacy = (path) => LEGACY.some((f) => path === `/${f}` || path.startsWith(`/${f}/`));

async function finalPath(path) {
  try {
    const res = await fetch(`${SITE}${path}`, { redirect: 'follow', headers: { 'user-agent': 'bestlooking-link-fixer/1.0' } });
    const u = new URL(res.url);
    return { status: res.status, path: u.pathname.replace(/\/$/, '') || '/', search: u.search };
  } catch (e) {
    return { status: 0, path, error: e.message };
  }
}

async function main() {
  const rows = psql(
    `select json_agg(json_build_object('id', id, 'document_id', document_id, 'slug', slug, 'published', published_at is not null, 'content', content)) from bls_posts where content ~* 'bestlooking\\.skin|href=["'']/(${LEGACY.join('|')})';`,
    { json: true },
  ) ?? [];

  /* Collect every link to rewrite. */
  const found = new Map(); // original href -> { path, fragment }
  for (const r of rows) {
    for (const m of r.content.matchAll(HREF)) {
      const href = m[2];
      const path = (m[3] || '/').replace(/&amp;/g, '&');
      const absolute = /^https?:/i.test(href);
      if (!absolute && !isLegacy(path)) continue; // relative links outside retired folders are fine
      found.set(href, { path });
    }
  }

  /* Resolve each unique path once. */
  const resolved = new Map();
  for (const { path } of found.values()) {
    if (resolved.has(path)) continue;
    if (MANUAL[path]) {
      resolved.set(path, { status: 200, path: MANUAL[path], search: '' });
      continue;
    }
    const needsResolve = isLegacy(path) || /\/$/.test(path);
    resolved.set(path, needsResolve ? await finalPath(path) : { status: 200, path, search: '' });
  }

  const mapping = new Map([...found].map(([href, { path }]) => {
    const r = resolved.get(path);
    return [href, r.status === 200 ? r.path + (r.search || '') : null];
  }));

  /* Rewrite, per row. */
  const changes = [];
  for (const r of rows) {
    let n = 0;
    const next = r.content.replace(HREF, (whole, q, href, _p, frag) => {
      const to = mapping.get(href);
      if (!to || to === href) return whole;
      n += 1;
      return `href=${q}${to}${frag || ''}${q}`;
    });
    if (n) changes.push({ ...r, next, n });
  }

  const posts = new Map();
  for (const c of changes) if (c.published) posts.set(c.slug, c.n);
  console.log(`${rows.length} rows scanned; ${found.size} distinct links to rewrite; ${changes.length} rows (${posts.size} published posts) would change, ${[...posts.values()].reduce((a, b) => a + b, 0)} links in published posts`);
  console.log('\nPer post (published row):');
  for (const [slug, n] of [...posts].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${slug}`);
  console.log('\nOld -> new:');
  for (const [href, to] of [...mapping].sort()) console.log(`  ${href}  ->  ${to ?? 'UNRESOLVED (left as is)'}`);
  const bad = [...resolved].filter(([, r]) => r.status !== 200);
  console.log(`\nTargets not ending in 200: ${bad.length}`);
  for (const [p, r] of bad) console.log(`  ${p}: ${r.status} ${r.error ?? r.path}`);

  if (DRY) {
    console.log('\nDry run: nothing written. Re-run with --write to apply.');
    return;
  }

  mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = `${BACKUP_DIR}/posts-before-link-fix-${stamp}.json`;
  writeFileSync(backup, JSON.stringify(changes.map(({ id, document_id, slug, published, content }) => ({ id, document_id, slug, published, content })), null, 1));
  const tag = (s) => {
    let t = 'c';
    while (s.includes(`$${t}$`)) t += 'x';
    return `$${t}$`;
  };
  const sql = ['BEGIN;', ...changes.map((c) => `UPDATE bls_posts SET content = ${tag(c.next)}${c.next}${tag(c.next)} WHERE id = ${Number(c.id)};`), 'COMMIT;'].join('\n');
  psql(sql);
  console.log(`\nWrote ${changes.length} rows (published_at / updated_at untouched). Backup: ${backup}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
