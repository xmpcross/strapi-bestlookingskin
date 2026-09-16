import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SITE } from '@/lib/site';
import { listProductCategories, listProductCategoryCounts, listProducts, mediaUrl } from '@/lib/strapi';
import ProductCard from '@/components/ProductCard';
import ShopFilters, { type Facet, type ShopFilterState } from '@/components/ShopFilters';
import Breadcrumb from '@/components/magzin/Breadcrumb';

export const revalidate = 60;
export const dynamicParams = true;

type Params = { slug: string };
type Search = { brand?: string; rating?: string; price?: string };

/* Price bands, fixed rather than derived from the data: a band that moves when
   the catalogue changes makes a bookmarked filter mean something different next
   week. Open-ended at the top so nothing falls outside every band. */
const PRICE_BANDS: { value: string; label: string; min: number; max: number }[] = [
  { value: 'under-25', label: 'Under $25', min: 0, max: 25 },
  { value: '25-50', label: '$25 - $50', min: 25, max: 50 },
  { value: '50-100', label: '$50 - $100', min: 50, max: 100 },
  { value: 'over-100', label: 'Over $100', min: 100, max: Infinity },
];

const RATING_BANDS: { value: string; label: string; min: number }[] = [
  { value: '4', label: '4.0 and up', min: 4 },
  { value: '3', label: '3.0 and up', min: 3 },
];

async function getCategory(slug: string) {
  const categories = await listProductCategories().catch(() => []);
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function generateStaticParams() {
  const categories = await listProductCategories().catch(() => []);
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: 'Category not found' };
  const description =
    category.description ||
    `${category.name} products covered by ${SITE.name}, with the latest price we recorded and where to buy.`;
  return {
    title: `${category.name} — Products & Prices`,
    description,
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: { title: category.name, description, url: `${SITE.url}/categories/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategory(slug);
  if (!category) notFound();

  /* 100, not 48: the >=2-offer rule is applied after the fetch (offer count is a
     relation count the API cannot filter on), so the page must see the whole
     category or it drops qualifying products purely by position. Hyaluronic Acid
     holds 72, of which 5 qualify. */
  const all = (await listProducts({ category: slug, pageSize: 100 }).catch(() => null))?.data ?? [];
  const image = mediaUrl(category.image ?? null);
  const [categoryCounts, productTotal] = await Promise.all([
    listProductCategoryCounts().catch(() => []),
    listProducts({ pageSize: 1 })
      .then((r) => r.meta.pagination.total)
      .catch(() => null),
  ]);

  const state: ShopFilterState = { brand: sp.brand, rating: sp.rating, price: sp.price };
  const basePath = `/categories/${category.slug}`;

  const priceOf = (p: (typeof all)[number]) => p.currentPrice ?? null;
  const brandOf = (p: (typeof all)[number]) => p.brandRef?.name || p.brand || null;

  const matchesBrand = (p: (typeof all)[number]) =>
    !state.brand || (brandOf(p) ?? '').toLowerCase() === state.brand.toLowerCase();
  const matchesRating = (p: (typeof all)[number]) => {
    if (!state.rating) return true;
    const band = RATING_BANDS.find((b) => b.value === state.rating);
    return band ? (p.rating ?? 0) >= band.min : true;
  };
  const matchesPrice = (p: (typeof all)[number]) => {
    if (!state.price) return true;
    const band = PRICE_BANDS.find((b) => b.value === state.price);
    const v = priceOf(p);
    return band && v !== null ? v >= band.min && v < band.max : !band;
  };

  const products = all.filter((p) => matchesBrand(p) && matchesRating(p) && matchesPrice(p));

  /*
   * Facet counts are taken against the OTHER active filters, not against the
   * filtered result. Counting the result would show every unselected brand at
   * zero the moment a brand is picked, which reads as an empty catalogue rather
   * than as "switch to this one".
   */
  const brandCounts = new Map<string, number>();
  for (const p of all.filter((p) => matchesRating(p) && matchesPrice(p))) {
    const b = brandOf(p);
    if (b) brandCounts.set(b, (brandCounts.get(b) ?? 0) + 1);
  }
  const brands: Facet[] = [...brandCounts.entries()]
    .map(([label, count]) => ({ value: label.toLowerCase(), label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 12);

  const ratingPool = all.filter((p) => matchesBrand(p) && matchesPrice(p));
  const ratings: Facet[] = RATING_BANDS
    .map((b) => ({ value: b.value, label: b.label, count: ratingPool.filter((p) => (p.rating ?? 0) >= b.min).length }))
    .filter((f) => f.count > 0);

  const pricePool = all.filter((p) => matchesBrand(p) && matchesRating(p));
  const prices: Facet[] = PRICE_BANDS
    .map((b) => ({
      value: b.value,
      label: b.label,
      count: pricePool.filter((p) => {
        const v = priceOf(p);
        return v !== null && v >= b.min && v < b.max;
      }).length,
    }))
    .filter((f) => f.count > 0);

  return (
    <div data-testid={`category-page-${category.slug}`}>
      <section className="sec-breadcumb">
        <div className="container">
          <Breadcrumb items={[{ label: 'Products', href: '/products' }, { label: category.name }]} />
          <div className="row align-items-end">
            <div className="col-lg-8 col-12">
              <div className="title d-flex flex-column flex-sm-row align-items-sm-center gap-3">
                {image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt={category.name} className="shop-logo" />
                )}
                <h1 className="h4 mb-0 ds-4">{category.name}</h1>
              </div>
              {category.description && <p className="fs-7 mb-0 mt-3">{category.description}</p>}
              {category.children && category.children.length > 0 && (
                <ul className="list-unstyled ps-0 d-flex flex-wrap gap-2 mt-3 mb-0">
                  {category.children.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/categories/${c.slug}`} className="tag-item shop-chip">
                        <span>{c.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="pt-5 pb-70">
        <div className="container">
          {/* shop2 arrangement: a narrow filter rail left, the grid right. Three
              across at xl and two from sm, matching the template's 4/12 tiles --
              four across left the cards too narrow for a full product name once
              the rail took its quarter. */}
          <div className="row g-5">
            <div className="col-lg-3 col-12">
              <ShopFilters
                basePath={basePath}
                state={state}
                categories={categoryCounts}
                brands={brands}
                ratings={ratings}
                prices={prices}
                activeCategorySlug={category.slug}
                totalProducts={productTotal}
              />
            </div>

            <div className="col-lg-9 col-12">
              <div className="shop-toolbar d-flex flex-wrap align-items-baseline justify-content-between gap-3 pb-3">
                <h2 className="h5 mb-0">
                  {products.length > 0
                    ? `${products.length} ${products.length === 1 ? 'product' : 'products'}`
                    : 'Products'}
                </h2>
                {products.length !== all.length && (
                  <p className="fs-7 text-600 m-0">
                    filtered from {all.length}
                  </p>
                )}
              </div>

              {products.length > 0 ? (
                <div className="row g-3 g-md-4 mt-2">
                  {products.map((p) => (
                    <div className="col-xl-4 col-sm-6 col-12" key={p.id}>
                      <ProductCard product={p} variant="tile" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-600 mt-4">
                  {all.length > 0
                    ? 'No products match these filters.'
                    : 'No products yet in this category.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
