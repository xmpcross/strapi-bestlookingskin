import Link from 'next/link';
import SidebarTitle from './SidebarTitle';

/* Emoji per product category (decorative; hidden from screen readers). Unknown categories get a sparkle. */
const CATEGORY_ICONS: Record<string, string> = {
  'anti-aging': '⏳',
  'exfoliators-and-scrubs': '🧽',
  'facial-cleansers': '🫧',
  'facial-serums': '💧',
  'hyaluronic-acid': '💦',
  moisturisers: '🧴',
  'toners-and-astringents': '🌿',
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
}: {
  title: string;
  allHref: string;
  allLabel: string;
  total: number | null;
  rows: { slug: string; name: string; count: number }[];
  current?: string;
}) {
  if (!rows.length) return null;
  return (
    <nav className="category-widget" aria-label={title}>
      <SidebarTitle className="category-widget-title">{title}</SidebarTitle>
      <ul className="list-unstyled m-0 p-0">
        <li>
          <Link href={allHref} className="category-widget-row">
            <span className="category-widget-name">{allLabel}</span>
            {total !== null && <span className="category-widget-count">{total}</span>}
          </Link>
        </li>
        {rows.map((row) => {
          const active = row.slug === current;
          return (
            <li key={row.slug}>
              <Link
                href={`/categories/${row.slug}`}
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
