import Link from 'next/link';
import SidebarTitle from './SidebarTitle';

/* Emoji per product category and post topic (decorative; hidden from screen readers). Unknown slugs get a sparkle. */
const CATEGORY_ICONS: Record<string, string> = {
  'anti-aging': '⏳',
  'exfoliators-and-scrubs': '🧽',
  'facial-cleansers': '🫧',
  'facial-serums': '💧',
  'hyaluronic-acid': '💦',
  moisturisers: '🧴',
  'toners-and-astringents': '🌿',
  /* Topic groups on /topics. */
  'product-type-hubs': '🧴',
  'skin-concern-hubs': '🔍',
  'cross-cutting-hubs': '🗓️',
  /* Post topic hubs and article formats. */
  acne: '🩹',
  cleansers: '🫧',
  dupes: '🔁',
  exfoliants: '🧽',
  'eye-cream': '👁️',
  'face-masks': '🧖',
  hyperpigmentation: '🌗',
  ingredients: '🧪',
  'korean-skincare': '🌸',
  moisturizers: '🧴',
  routines: '🗓️',
  'sensitive-skin': '🌿',
  serums: '💧',
  sunscreen: '☀️',
  'product-comparisons': '⚖️',
  'product-reviews': '⭐',
  'top-rated-products': '🏆',
  'how-to-guides': '📘',
};

/**
 * Sidebar "browse by category" list: a heading over a divider, an "All products" row with the catalogue total,
 * then one row per category with its icon, name and live product count. The current category is highlighted.
 */
export default function CategoryListWidget({
  title,
  allHref,
  allLabel,
  total,
  rows,
  current,
  allActive = false,
  rowHref = (slug: string) => `/categories/${slug}`,
}: {
  title: string;
  allHref: string;
  allLabel: string;
  total: number | null;
  rows: { slug: string; name: string; count: number }[];
  current?: string;
  /** Highlight the "All products" row (e.g. the /products listing with no category selected). */
  allActive?: boolean;
  /** Where a category row links; defaults to its category page. */
  rowHref?: (slug: string) => string;
}) {
  if (!rows.length) return null;
  return (
    <nav className="category-widget" aria-label={title}>
      <SidebarTitle className="category-widget-title">{title}</SidebarTitle>
      <ul className="list-unstyled m-0 p-0">
        <li>
          <Link href={allHref} className={`category-widget-row${allActive ? ' is-active' : ''}`} aria-current={allActive ? 'page' : undefined}>
            <span className="category-widget-name">{allLabel}</span>
            {total !== null && <span className="category-widget-count">{total}</span>}
          </Link>
        </li>
        {rows.map((row) => {
          const active = row.slug === current;
          return (
            <li key={row.slug}>
              <Link
                href={rowHref(row.slug)}
                className={`category-widget-row${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="category-widget-icon" aria-hidden>
                  {CATEGORY_ICONS[row.slug] ?? '✨'}
                </span>
                <span className="category-widget-name">{row.name}</span>
                <span className="category-widget-count">{row.count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
