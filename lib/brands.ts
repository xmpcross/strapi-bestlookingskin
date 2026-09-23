import brandIntros from '@/data/brand-intros.json';

/*
 * Brand names and URLs.
 *
 * Product rows in the shared Strapi pool carry a free-text `brand`. Some of those strings are truncated or duplicated
 * ("Dr.", "Doctor's", "Peter", "Elf" next to "e.l.f."), and brand pages used the raw string as their URL
 * (/brands/Paula's%20Choice). The shared records are not renamed (other sites read them); instead this site maps
 * each raw name to its real brand here and gives every brand a lowercase-hyphen slug (GSC audit 24 Sep 2026).
 * Old /brands/<Raw Name> URLs 308 to the new slug in app/brands/[slug]/page.tsx.
 */

/** Raw product `brand` value -> the brand's real name. Worked out from the products behind each raw name. */
export const BRAND_ALIASES: Record<string, string> = {
  Elf: 'e.l.f.',
  "Doctor's": "Doctor's Best", // Doctor's Best Hyaluronic Acid with Chondroitin Sulfate
  'Dr.': 'Dr. Barbara Sturm', // Dr. Barbara Sturm Hyaluronic Serum
  Peter: 'Peter Thomas Roth', // Peter Thomas Roth Water Drench cream and serum
};

/** The real brand name for a raw product brand value. */
export const canonicalBrandName = (raw: string) => BRAND_ALIASES[raw.trim()] ?? raw.trim();

/** Lowercase-hyphen slug: apostrophes and dots removed ("Paula's Choice" -> paulas-choice, "e.l.f." -> elf). */
export function slugifyBrand(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’.]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Slug for a raw product brand value (aliases resolved first). */
export const brandSlug = (raw: string) => slugifyBrand(canonicalBrandName(raw));

/** Path of a brand page from a raw product brand value. */
export const brandHref = (raw: string) => `/brands/${brandSlug(raw)}`;

/* Short brand intros (data/brand-intros.json), keyed by slug. `reviewed: false` entries are drafts awaiting an
   editor: they show on the page and count as an intro, and are listed for review. */
export const BRAND_INTROS = brandIntros as Record<string, { intro: string; reviewed: boolean }>;

/* A brand page with fewer products than this and no intro is too thin to index (noindex, left out of the sitemap). */
const MIN_INDEXABLE_PRODUCTS = 3;
export const isIndexableBrand = (b: { slug: string; productCount?: number }) =>
  (b.productCount ?? 0) >= MIN_INDEXABLE_PRODUCTS || Boolean(BRAND_INTROS[b.slug]);
