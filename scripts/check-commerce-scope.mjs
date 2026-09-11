#!/usr/bin/env node
/**
 * Fail the build if any commerce collection is read without going through the
 * scoped access point in lib/strapi.ts.
 *
 * Why this exists: commerce-products, commerce-categories and commerce-brands
 * are a pool shared with every other storefront on this CMS, and they carry
 * uneven ownership -- a product has a site tag, a category has none, a brand has
 * neither. Three leaks reached production from the same mistake: a query
 * written without the scope its collection needed, sitting in a file where
 * every neighbouring query had one. Review did not catch it because the
 * surrounding code looked right.
 *
 * A convention cannot fix that; a failing build can.
 *
 * Permitted:
 *   - commerceFetch(...) anywhere
 *   - strapiFetch('commerce-...') ONLY on a line preceded by a
 *     `commerce-scope-exempt:` comment explaining why no server-side scope
 *     exists for that collection.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SEARCH = ['lib', 'app', 'components'];
const EXEMPT = 'commerce-scope-exempt:';

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(e.name)) out.push(full);
  }
  return out;
}

const violations = [];
for (const base of SEARCH) {
  const dir = path.join(ROOT, base);
  if (!fs.existsSync(dir)) continue;
  for (const file of walk(dir)) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (!/strapiFetch\s*<[^(]*>?\s*\(\s*['"`]commerce-/.test(line)) return;
      // look back a few lines for the exemption note
      const context = lines.slice(Math.max(0, i - 6), i).join('\n');
      if (context.includes(EXEMPT)) return;
      violations.push(`${path.relative(ROOT, file)}:${i + 1}\n    ${line.trim()}`);
    });
  }
}

if (violations.length) {
  console.error('\nUnscoped commerce query found -- this is how products from other sites leak in.\n');
  for (const v of violations) console.error('  ' + v + '\n');
  console.error('Use commerceFetch() from lib/strapi.ts, which applies the scope for the');
  console.error(`collection being read. If the collection genuinely has no server-side`);
  console.error(`scope, annotate the line with a "${EXEMPT}" comment saying how it is`);
  console.error('scoped instead.\n');
  process.exit(1);
}
console.log(`commerce scope check: OK (${SEARCH.join(', ')})`);
