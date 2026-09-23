#!/usr/bin/env node
// Remove years from post titles and SEO titles (GSC audit 24 Sep 2026, task 13). Slugs are not changed, so no
// redirects are needed. The new titles are listed below for review; none of these posts was updated for a new year,
// so the year is dropped rather than bumped to 2026.
//
//   node scripts/fix-dated-titles.mjs            # dry run: current -> proposed, per field
//   node scripts/fix-dated-titles.mjs --write    # apply (backs up the rows first)
//
// Writes go to the bls_posts rows directly (draft + published), like fix-legacy-links.mjs, because a Strapi REST
// update of a bls-post resets publishedAt.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const WRITE = process.argv.includes('--write');
const CONTAINER = process.env.STRAPI_DB_CONTAINER || 'strapi-cms-postgres';
const BACKUP_DIR = process.env.BACKUP_DIR || '/opt/backups/bestlooking-post-titles';

/* slug -> new title and/or SEO title. */
const NEW = {
  '7-best-sensitive-skin-care-products-2024': { title: '7 Best Sensitive Skin Care Products' },
  'best-skin-care-routine-guide': { title: 'Best Skin Care Routine: A Step-by-Step Guide', seo_title: 'Best Skin Care Routine: A Step-by-Step Guide' },
  '7-best-eye-creams-caffeine-2024': { title: '7 Best Eye Creams with Caffeine' },
  'top-7-mineral-sunscreen-picks-for-2024': { title: 'Top 7 Mineral Sunscreen Picks' },
  '6-best-organic-skincare-2024': { title: '6 Best Organic Skincare Products' },
  'top-7-anti-aging-skincare-2024': { title: 'Top 7 Anti-Aging Skincare Products' },
  '6-best-products-clear-radiant-skin-2024': { title: '6 Best Products for Clear, Radiant Skin' },
  'best-fragrance-free-skincare': { seo_title: 'Best Fragrance-Free Skincare for Sensitive Skin' },
};

function psql(sql) {
  return execFileSync('docker', ['exec', '-i', CONTAINER, 'sh', '-c', 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -q'], { input: sql }).toString();
}
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;

const slugs = Object.keys(NEW).map(lit).join(',');
const rows = JSON.parse(
  psql(`select coalesce(json_agg(json_build_object('id', id, 'slug', slug, 'published', published_at is not null, 'title', title, 'seo_title', seo_title)), '[]') from bls_posts where slug in (${slugs});`).trim(),
);

const updates = [];
for (const r of rows) {
  const set = {};
  for (const [field, value] of Object.entries(NEW[r.slug])) if (r[field] !== value) set[field] = value;
  if (Object.keys(set).length) updates.push({ ...r, set });
}
/* Every published post with a year left anywhere in its title or SEO title, after these changes. */
const left = rows.filter((r) => r.published && [NEW[r.slug].title ?? r.title, NEW[r.slug].seo_title ?? r.seo_title].some((t) => /20(23|24|25)/.test(t ?? '')));

for (const u of updates.filter((x) => x.published)) {
  for (const [f, v] of Object.entries(u.set)) console.log(`${u.slug}\n  ${f}: ${JSON.stringify(u[f])}\n     -> ${JSON.stringify(v)}`);
}
console.log(`\n${updates.length} rows to update (${updates.filter((u) => u.published).length} published); slugs unchanged; posts still dated: ${left.length}`);

if (!WRITE) {
  console.log('Dry run: nothing written. Re-run with --write to apply.');
} else {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const backup = `${BACKUP_DIR}/titles-before-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  writeFileSync(backup, JSON.stringify(updates.map(({ id, slug, title, seo_title }) => ({ id, slug, title, seo_title })), null, 1));
  const sql = ['BEGIN;', ...updates.map((u) => `UPDATE bls_posts SET ${Object.entries(u.set).map(([f, v]) => `${f} = ${lit(v)}`).join(', ')} WHERE id = ${Number(u.id)};`), 'COMMIT;'].join('\n');
  psql(sql);
  console.log(`Wrote ${updates.length} rows (dates untouched). Backup: ${backup}`);
}
