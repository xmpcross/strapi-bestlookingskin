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

export async function getTopicGroups(categories?: BlsCategory[]): Promise<NavGroup[]> {
  const all = categories ?? (await listCategories().catch(() => [] as BlsCategory[]));
  const sectionSlugs = new Set<string>(SECTIONS.map((s) => s.slug));
  const isGroupRow = (slug: string) => (GROUP_ORDER as readonly string[]).includes(slug);
  const hubs = all.filter((c) => !sectionSlugs.has(c.slug) && !isGroupRow(c.slug));
  const groupLabel = new Map(all.filter((c) => isGroupRow(c.slug)).map((c) => [c.slug, c.name]));
  const groups: NavGroup[] = [];
  for (const slug of GROUP_ORDER) {
    const members = hubs.filter((h) => h.parent?.slug === slug);
    if (members.length) groups.push({ label: groupLabel.get(slug) ?? slug, slug, items: members.map((m) => ({ label: m.name, href: `/${m.slug}` })) });
  }
  const ungrouped = hubs.filter((h) => !h.parent || !isGroupRow(h.parent.slug));
  if (ungrouped.length) groups.push({ label: 'More', slug: 'more', items: ungrouped.map((m) => ({ label: m.name, href: `/${m.slug}` })) });
  return groups;
}

export async function getNav(): Promise<{ nav: NavItem[]; topics: NavGroup[] }> {
  const [topics, productCategories] = await Promise.all([getTopicGroups(), listProductCategoryCounts().catch(() => [])]);
  const nav: NavItem[] = [
    productCategories.length
      ? { label: 'Products', href: '/products', children: [{ label: 'All Products', href: '/products' }, ...productCategories.map((c) => ({ label: c.name, href: `/categories/${c.slug}` }))] }
      : { label: 'Products', href: '/products' },
    { label: 'Brands', href: '/brands' },
    ...(topics.length ? [{ label: 'Topics', groups: topics }] : []),
    { label: 'Articles', href: '/informative-articles' },
    { label: 'Contact', href: '/contact' },
  ];
  return { nav, topics };
}
