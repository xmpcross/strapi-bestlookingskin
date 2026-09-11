import Link from 'next/link';

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
    <div className="border-b border-ink/10 pb-6">
      <h4 className="font-display text-[15px] font-bold text-ink">{title}</h4>
      <div className="mt-4">{children}</div>
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
        className={`flex items-center justify-between gap-3 py-1.5 text-[14px] transition ${
          active ? 'font-semibold text-primary' : 'text-ink/70 hover:text-primary'
        }`}
        aria-current={active ? 'true' : undefined}
      >
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 text-[12px] text-ink/40">({count})</span>
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
}: {
  basePath: string;
  state: ShopFilterState;
  categories: { slug: string; name: string; count: number }[];
  brands: Facet[];
  ratings: Facet[];
  prices: Facet[];
  activeCategorySlug: string;
}) {
  const anyActive = Boolean(state.brand || state.rating || state.price);

  return (
    <aside className="space-y-6 lg:sticky lg:top-24" aria-label="Product filters" data-testid="shop-filters">
      {anyActive && (
        <Link
          href={basePath}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline"
        >
          Clear all filters
        </Link>
      )}

      {categories.length > 0 && (
        <Widget title="Categories">
          <ul className="space-y-0.5">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/categories/${c.slug}`}
                  className={`flex items-center justify-between gap-3 py-1.5 text-[14px] transition ${
                    c.slug === activeCategorySlug
                      ? 'font-semibold text-primary'
                      : 'text-ink/70 hover:text-primary'
                  }`}
                  aria-current={c.slug === activeCategorySlug ? 'page' : undefined}
                >
                  <span className="min-w-0 truncate">{c.name}</span>
                  <span className="shrink-0 text-[12px] text-ink/40">({c.count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </Widget>
      )}

      {brands.length > 0 && (
        <Widget title="Brand">
          <ul className="space-y-0.5">
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
          <ul className="space-y-0.5">
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
          <ul className="space-y-0.5">
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
