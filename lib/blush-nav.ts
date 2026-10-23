import { getNav } from '@/lib/nav';

export type BlushNavLink = { label: string; href: string };
export type BlushNavItem = { label: string; href: string; children?: BlushNavLink[] };

const FALLBACK: BlushNavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Topics', href: '/topics' },
  { label: 'Products', href: '/products' },
  { label: 'FAQs', href: '/faqs' },
  { label: 'Contact', href: '/contact' },
];

/**
 * The header menu, from the same source as the Magzin header (lib/nav.ts, read from the CMS): Home, About Us,
 * Topics and Products as dropdowns, FAQs, Contact. The Topics groups are flattened into one list for the
 * Blush dropdown.
 */
export async function getBlushNav(): Promise<BlushNavItem[]> {
  try {
    const { nav } = await getNav();
    const items = nav.map((item) => ({
      label: item.label,
      href: item.href ?? '#',
      children: item.groups ? item.groups.flatMap((group) => group.items) : item.children,
    }));
    return items.length ? items : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
