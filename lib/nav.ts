import { SECTIONS } from '@/lib/site';
import { listCategories, listProductCategoryCounts, type BlsCategory } from '@/lib/strapi';

/*
 * Site navigation, read from the CMS so a hub or product category added in Strapi appears with no deploy.
 * (Moved out of the old Header so the Magzin header, side menu, search panel and footer share one source.)
 *
 * Two axes: topic hubs (bls-categories, grouped by their parent row: product type, skin concern,
 * cross-cutting) and the format sections in SECTIONS (comparison, review, how-to...). The group rows are
 * headings, not destinations; a hub with no group falls into "More" rather than vanishing.
 */
export type NavLink = { label: string; href: string };
export type NavGroup = { label: string; slug: string; items: NavLink[] };
export type NavItem = { label: string; href?: string; children?: NavLink[]; groups?: NavGroup[] };

export const GROUP_ORDER = ['product-type-hubs', 'skin-concern-hubs', 'cross-cutting-hubs'] as const;

/**
 * Reader-facing names for the group rows.
 *
 * The CMS calls them "Product-Type Hubs", "Skin-Concern Hubs" and
 * "Cross-Cutting Hubs". "Hub" is our word for how the content is organised, not
 * a word anyone browsing for a moisturiser would recognise -- and these strings
 * are headings in the Topics menu, so they are read by every visitor.
 *
 * Overriding here rather than renaming in Strapi because the slugs are load
 * bearing (GROUP_ORDER above, and the `parent` relation on every hub), so the
 * row names are safer to leave alone. If you DO rename them in the CMS, delete
 * the matching entry here or this map will keep winning.
 */
const GROUP_LABELS: Record<string, string> = {
  'product-type-hubs': 'By Product',
  'skin-concern-hubs': 'By Concern',
  'cross-cutting-hubs': 'Routines & Ingredients',
};

export async function getTopicGroups(categories?: BlsCategory[]): Promise<NavGroup[]> {
  const all = categories ?? (await listCategories().catch(() => [] as BlsCategory[]));
  const sectionSlugs = new Set<string>(SECTIONS.map((s) => s.slug));
  const isGroupRow = (slug: string) => (GROUP_ORDER as readonly string[]).includes(slug);
  const hubs = all.filter((c) => !sectionSlugs.has(c.slug) && !isGroupRow(c.slug));
  const groupLabel = new Map(all.filter((c) => isGroupRow(c.slug)).map((c) => [c.slug, c.name]));
  const groups: NavGroup[] = [];
  for (const slug of GROUP_ORDER) {
    const members = hubs.filter((h) => h.parent?.slug === slug);
    if (members.length) {
      groups.push({
        /* Our label first, the CMS name next, the raw slug only if both are missing. */
        label: GROUP_LABELS[slug] ?? groupLabel.get(slug) ?? slug,
        slug,
        items: members.map((m) => ({ label: m.name, href: `/${m.slug}` })),
      });
    }
  }
  const ungrouped = hubs.filter((h) => !h.parent || !isGroupRow(h.parent.slug));
  if (ungrouped.length) groups.push({ label: 'More', slug: 'more', items: ungrouped.map((m) => ({ label: m.name, href: `/${m.slug}` })) });
  return groups;
}

export async function getNav(): Promise<{ nav: NavItem[]; topics: NavGroup[] }> {
  const [topics, productCategories] = await Promise.all([getTopicGroups(), listProductCategoryCounts().catch(() => [])]);
  /*
   * `Brands` was removed from the top nav at Kritin's request -- it is a
   * catalogue axis, not something a reader arrives wanting. The page still
   * exists and is linked from the footer, so it is neither orphaned nor
   * dropped from the sitemap.
   *
   * `Topics` carries an href now. It used to render as `<a href="#">`: the
   * site's entire editorial axis hung off a nav item with no destination,
   * which passes no link signal, gives nothing to rank, and is a dead tap
   * without hover. /topics is a real index of the hubs.
   */
  const nav: NavItem[] = [
    { label: 'Home', href: '/' },
    /* About carries the named-author and company detail that affiliate content
       about skin health is judged on -- see the YMYL notes in CLAUDE.md. Placed
       straight after Home at Kritin's request; it is also in the footer bar. */
    { label: 'About Us', href: '/about' },
    ...(topics.length ? [{ label: 'Topics', href: '/topics', groups: topics }] : []),
    productCategories.length
      ? { label: 'Products', href: '/products', children: [{ label: 'All Products', href: '/products' }, ...productCategories.map((c) => ({ label: c.name, href: `/categories/${c.slug}` }))] }
      : { label: 'Products', href: '/products' },
    { label: 'FAQs', href: '/faqs' },
    { label: 'Contact', href: '/contact' },
  ];
  return { nav, topics };
}
