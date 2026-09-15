import Link from 'next/link';
import CategoryListWidget from '@/components/magzin/CategoryListWidget';

/**
 * Shop sidebar filters, in the Sandbox "shop2" arrangement: a stack of widgets
 * down a narrow left column beside the product grid.
 *
 * Every facet is counted from the products actually in this category, and every
 * option links to a URL that really filters. A filter rail that looks like the
 * template but does nothing is worse than no rail -- the counts would be
 * decoration, and decoration that looks like data is a lie about the catalogue.
 *
 * The template's Size widget is not here: skincare products carry no size in
 * this catalogue, so it would have been an empty control. Its Rating and Price
 * widgets are, because rating and offer prices are real fields.
 *
 * Filtering is done through query params and rendered on the server rather than
 * in client state, which matches /products, keeps a filtered view shareable and
 * indexable, and leaves the page working with JavaScript off.
 */
export type Facet = { value: string; label: string; count: number };

export type ShopFilterState = {
  brand?: string;
  rating?: string;
  price?: string;
};

function buildHref(base: string, current: ShopFilterState, key: keyof ShopFilterState, value: string) {
  const next = { ...current };
  /* Clicking the active option clears it, so every filter is its own toggle
     and there is no dead end with no way back to the full list. */
  if (next[key] === value) delete next[key];
  else next[key] = value;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="shop-widget">
      <h2 className="h6 mb-3">{title}</h2>
      <div>{children}</div>
    </div>
  );
}

function Option({
  href, label, count, active,
}: { href: string; label: string; count: number; active: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className={`shop-filter-link ${active ? 'is-active' : ''}`}
        aria-current={active ? 'true' : undefined}
      >
        <span className="label">{label}</span>
        <span className="count">({count})</span>
      </Link>
    </li>
  );
}

export default function ShopFilters({
  basePath,
  state,
  categories,
  brands,
  ratings,
  prices,
  activeCategorySlug,
  totalProducts = null,
}: {
  basePath: string;
  state: ShopFilterState;
  categories: { slug: string; name: string; count: number }[];
  brands: Facet[];
  ratings: Facet[];
  prices: Facet[];
  activeCategorySlug: string;
  /** Catalogue total for the "All products" row; null hides the count. */
  totalProducts?: number | null;
}) {
  const anyActive = Boolean(state.brand || state.rating || state.price);

  return (
    <aside className="shop-sticky" aria-label="Product filters" data-testid="shop-filters">
      {anyActive && (
        <p className="mb-4">
          <Link href={basePath} className="shop-link fs-7 fw-semi-bold">
            Clear all filters
          </Link>
        </p>
      )}

      {categories.length > 0 && (
        <div className="shop-widget">
          {/* Same "Browse by category" list as the product page sidebar. */}
          <CategoryListWidget
            title="Browse by category"
            allHref="/products"
            allLabel="All products"
            total={totalProducts}
            rows={categories}
            current={activeCategorySlug}
          />
        </div>
      )}

      {brands.length > 0 && (
        <Widget title="Brand">
          <ul className="list-unstyled ps-0 m-0">
            {brands.map((b) => (
              <Option
                key={b.value}
                href={buildHref(basePath, state, 'brand', b.value)}
                label={b.label}
                count={b.count}
                active={state.brand === b.value}
              />
            ))}
          </ul>
        </Widget>
      )}

      {ratings.length > 0 && (
        <Widget title="Rating">
          <ul className="list-unstyled ps-0 m-0">
            {ratings.map((r) => (
              <Option
                key={r.value}
                href={buildHref(basePath, state, 'rating', r.value)}
                label={r.label}
                count={r.count}
                active={state.rating === r.value}
              />
            ))}
          </ul>
        </Widget>
      )}

      {prices.length > 0 && (
        <Widget title="Price">
          <ul className="list-unstyled ps-0 m-0">
            {prices.map((p) => (
              <Option
                key={p.value}
                href={buildHref(basePath, state, 'price', p.value)}
                label={p.label}
                count={p.count}
                active={state.price === p.value}
              />
            ))}
          </ul>
        </Widget>
      )}
    </aside>
  );
}
