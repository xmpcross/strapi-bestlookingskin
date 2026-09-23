import Link from 'next/link';
import type { Metadata } from 'next';
import { listProducts, listProductCategories, listProductCategoryCounts, listProductBrands, type BlsProduct } from '@/lib/strapi';
import CategoryListWidget from '@/components/magzin/CategoryListWidget';
import ProductCard from '@/components/ProductCard';
import { SITE } from '@/lib/site';
import Breadcrumb from '@/components/magzin/Breadcrumb';
import CategoryIntro from '@/components/CategoryIntro';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Skincare Products',
  description: `Browse skincare products on ${SITE.name} — search by category, brand, skin type or price.`,
  alternates: { canonical: '/products' },
};

type SearchParams = {
  q?: string;
  category?: string;
  brand?: string;
  skinType?: string;
  sort?: string;
  page?: string;
  view?: string;
};

/*
 * The brand filter is hidden for now.
 *
 * commerce-brands is shared across every storefront on this CMS and a brand row
 * carries no site ownership, so the sidebar was listing all 76 brands in the
 * pool -- Acer, Anker, Apple, Garmin, Reolink, Samsung -- on a skincare site.
 * listProductBrands() now derives the list from this site's own tagged products
 * and returns only brands it actually stocks, so flipping this back to true is
 * safe once the skincare catalogue has been reviewed.
 */
const SHOW_BRAND_FILTER = false;

const PAGE_SIZE = 24;
const VALID_SORTS = ['newest', 'price-asc', 'price-desc', 'rating-desc'] as const;
type Sort = (typeof VALID_SORTS)[number];
const VALID_VIEWS = ['2', '3', '4'] as const;
type View = (typeof VALID_VIEWS)[number];
/* Column class per product for each view (Bootstrap grid): one column on phones, two from sm. */
const VIEW_GRID: Record<View, string> = {
  '2': 'col-sm-6 col-12',
  '3': 'col-lg-4 col-sm-6 col-12',
  '4': 'col-lg-3 col-sm-6 col-12',
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { q, category, brand, skinType, sort: sortRaw, page: pageRaw, view: viewRaw } = await searchParams;
  const query = (q ?? '').trim();
  const page = Math.max(1, Number(pageRaw) || 1);
  const sort: Sort = (VALID_SORTS as readonly string[]).includes(sortRaw ?? '')
    ? (sortRaw as Sort)
    : 'newest';
  const view: View = (VALID_VIEWS as readonly string[]).includes(viewRaw ?? '')
    ? (viewRaw as View)
    : '4';

  const [res, categories, brands] = await Promise.all([
    listProducts({
      q: query || undefined,
      category: category || undefined,
      brand: brand || undefined,
      skinType: skinType || undefined,
      sort,
      page,
      pageSize: PAGE_SIZE,
    }).catch(() => null),
    listProductCategories().catch(() => []),
    listProductBrands().catch(() => []),
  ]);
  /* Category list widget (same as the product page's "Browse by category"): live counts and the catalogue total. */
  const [categoryCounts, catalogueTotal] = await Promise.all([
    listProductCategoryCounts().catch(() => []),
    listProducts({ pageSize: 1 })
      .then((r) => r.meta.pagination.total)
      .catch(() => null),
  ]);

  const products: BlsProduct[] = res?.data ?? [];
  const total = res?.meta?.pagination?.total ?? 0;
  const pageCount = res?.meta?.pagination?.pageCount ?? 1;
  const activeCategory = category ? categories.find((c) => c.slug === category) : null;
  const pageTitle = activeCategory?.name ?? 'Skincare Products';
  const pageDescription = activeCategory
    ? activeCategory.description?.trim() ||
      `${activeCategory.name} in the ${SITE.name} catalogue, with the retailer prices currently listed for each product.`
    : "Searchable catalog of the products we've covered. Filter by category, brand or skin type.";

  // Build query-string preservers for filter links
  const baseQs = new URLSearchParams();
  if (query) baseQs.set('q', query);
  if (sort !== 'newest') baseQs.set('sort', sort);
  if (view !== '4') baseQs.set('view', view);

  return (
    <div data-testid="products-page">
      <section className="sec-breadcumb">
        <div className="container">
          <Breadcrumb
            items={
              activeCategory
                ? [{ label: 'Products', href: '/products' }, { label: activeCategory.name }]
                : [{ label: 'Products' }]
            }
          />
          <div className="row align-items-end">
            <div className="col-12">
              <div className="title">
                <p className="shop-eyebrow mb-2">Product Category</p>
                <h1 className="h4 mb-0 ds-4">{pageTitle}</h1>
                <CategoryIntro text={pageDescription} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-5 pb-70">
        <div className="container">
          <div className="row g-5">
            {/* Filters sidebar */}
            <aside className="col-lg-3 col-12" aria-label="Filters">
              {categoryCounts.length > 0 && (
                <div className="shop-widget">
                  {/* Filters this listing (keeps search, brand and sort), so rows link back to /products. */}
                  <CategoryListWidget
                    title="Browse by category"
                    allHref={productsHref(withoutKey(baseQs, 'category'))}
                    allLabel="All products"
                    allActive={!category}
                    total={catalogueTotal}
                    rows={categoryCounts}
                    current={category}
                    rowHref={(slug) => productsHref(withParam(baseQs, 'category', slug))}
                  />
                </div>
              )}

              {SHOW_BRAND_FILTER && brands.length > 0 && (
                <div className="shop-widget">
                  <h2 className="h6 mb-3">Brand</h2>
                  <ul className="list-unstyled ps-0 m-0">
                    <li>
                      <FilterLink active={!brand} href={withoutKey(baseQs, 'brand')}>
                        All brands
                      </FilterLink>
                    </li>
                    {brands.map((b) => (
                      <li key={b.id}>
                        <FilterLink
                          active={brand === b.slug}
                          href={withParam(baseQs, 'brand', b.slug)}
                        >
                          {b.name}
                        </FilterLink>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="shop-widget">
                <h2 className="h6 mb-3">Skin type</h2>
                <ul className="list-unstyled ps-0 m-0 d-flex flex-wrap gap-2">
                  {['dry', 'oily', 'sensitive', 'combination', 'normal', 'mature'].map((s) => (
                    <li key={s}>
                      <FilterLink
                        pill
                        active={skinType === s}
                        href={skinType === s ? withoutKey(baseQs, 'skinType') : withParam(baseQs, 'skinType', s)}
                      >
                        {s}
                      </FilterLink>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Results */}
            <div className="col-lg-9 col-12">
              <div className="shop-toolbar d-flex flex-wrap align-items-center justify-content-between gap-3 pb-3">
                <p className="fs-7 text-600 m-0 d-flex flex-wrap align-items-center gap-1">
                  {total === 0 ? 'No products' : `${total} product${total === 1 ? '' : 's'}`}
                  {(category || brand || skinType || query) && (
                    <>
                      {' '}for
                      {query && <span className="text-dark ms-1">“{query}”</span>}
                      {category && <span className="shop-pill ms-1">category: {category}</span>}
                      {brand && <span className="shop-pill ms-1">brand: {brand}</span>}
                      {skinType && <span className="shop-pill ms-1">skin: {skinType}</span>}
                    </>
                  )}
                </p>
                <div className="d-flex flex-wrap align-items-center gap-3">
                  <ViewSwitcher current={view} baseQs={baseQs} />
                  <SortDropdown current={sort} baseQs={baseQs} />
                </div>
              </div>

              {products.length > 0 ? (
                <div className="row g-3 g-md-4 mt-2">
                  {products.map((p) => (
                    <div className={VIEW_GRID[view]} key={p.id}>
                      <ProductCard product={p} variant="tile" showCategory={!activeCategory} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="shop-empty mt-5">
                  <p className="fs-6 mb-2">No products found.</p>
                  <p className="fs-7 mb-0">
                    Try adjusting your filters or{' '}
                    <Link href="/products" className="shop-link fw-medium">
                      clear all
                    </Link>
                    .
                  </p>
                </div>
              )}

              {pageCount > 1 && (
                <nav className="d-flex flex-wrap align-items-center justify-content-center gap-3 mt-5" aria-label="Pages">
                  {page > 1 && (
                    <Link
                      href={`/products?${withParam(baseQs, 'page', String(page - 1))}`}
                      className="btn shop-btn shop-btn-outline"
                      rel="prev"
                    >
                      ← Previous
                    </Link>
                  )}
                  <span className="fs-7 text-600">Page {page} of {pageCount}</span>
                  {page < pageCount && (
                    <Link
                      href={`/products?${withParam(baseQs, 'page', String(page + 1))}`}
                      className="btn shop-btn shop-btn-outline"
                      rel="next"
                    >
                      Next →
                    </Link>
                  )}
                </nav>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FilterLink({
  href,
  active,
  pill,
  children,
}: {
  href: string;
  active: boolean;
  pill?: boolean;
  children: React.ReactNode;
}) {
  if (pill) {
    return (
      <Link
        href={`/products?${href}`}
        className={`tag-item shop-chip text-capitalize ${active ? 'shop-active' : ''}`}
        aria-current={active ? 'true' : undefined}
      >
        {children}
      </Link>
    );
  }
  return (
    <Link
      href={`/products?${href}`}
      className={`shop-filter-link ${active ? 'is-active' : ''}`}
      aria-current={active ? 'true' : undefined}
    >
      <span className="label">{children}</span>
    </Link>
  );
}

function ViewSwitcher({ current, baseQs }: { current: View; baseQs: URLSearchParams }) {
  const opts: { v: View; label: string }[] = [
    { v: '2', label: '2 cols' },
    { v: '3', label: '3 cols' },
    { v: '4', label: '4 cols' },
  ];
  return (
    <div className="d-none d-lg-flex align-items-center gap-1" role="group" aria-label="Grid columns">
      <span className="fs-8 text-600 me-1">View:</span>
      {opts.map((o) => {
        const next = new URLSearchParams(baseQs.toString());
        if (o.v === '4') next.delete('view');
        else next.set('view', o.v);
        next.delete('page');
        const href = `/products${next.toString() ? `?${next}` : ''}`;
        const active = current === o.v;
        return (
          <Link
            key={o.v}
            href={href}
            aria-pressed={active}
            className={`tag-item shop-chip fs-8 ${active ? 'shop-active' : ''}`}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}

function SortDropdown({ current, baseQs }: { current: Sort; baseQs: URLSearchParams }) {
  const opts: { v: Sort; l: string }[] = [
    { v: 'newest',      l: 'Newest' },
    { v: 'price-asc',   l: 'Price: low to high' },
    { v: 'price-desc',  l: 'Price: high to low' },
    { v: 'rating-desc', l: 'Top rated' },
  ];
  return (
    <form action="/products" method="get" className="d-flex align-items-center gap-2">
      {/* Preserve other filters */}
      {Array.from(baseQs.entries()).map(([k, v]) =>
        k === 'sort' ? null : <input key={k} type="hidden" name={k} value={v} />,
      )}
      <label htmlFor="sort-select" className="fs-7 text-600">Sort:</label>
      <select
        id="sort-select"
        name="sort"
        defaultValue={current}
        className="shop-select"
      >
        {opts.map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
      <button type="submit" className="btn btn-dark shop-btn-sm">
        Apply
      </button>
    </form>
  );
}

function withParam(qs: URLSearchParams, key: string, value: string): string {
  const next = new URLSearchParams(qs.toString());
  next.set(key, value);
  next.delete('page');
  return next.toString();
}

function withoutKey(qs: URLSearchParams, key: string): string {
  const next = new URLSearchParams(qs.toString());
  next.delete(key);
  next.delete('page');
  return next.toString();
}

/* /products URL for a query string built by withParam / withoutKey. */
function productsHref(qs: string): string {
  return qs ? `/products?${qs}` : '/products';
}
