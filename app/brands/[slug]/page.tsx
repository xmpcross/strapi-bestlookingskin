import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { SITE, isInfoOnlyProduct } from '@/lib/site';
import { listProductBrands, listProductCategoryCounts, listProducts, mediaUrl } from '@/lib/strapi';
import SidebarTitle from '@/components/magzin/SidebarTitle';
import CategoryListWidget from '@/components/magzin/CategoryListWidget';
import ProductCard from '@/components/ProductCard';
import Breadcrumb from '@/components/magzin/Breadcrumb';
import { getBrandMeta } from '@/lib/brand-data';
import { resolveOutbound } from '@/lib/links';
import { BRAND_INTROS as INTROS, brandSlug, isIndexableBrand } from '@/lib/brands';

export const revalidate = 60;
export const dynamicParams = true;

type Params = { slug: string };
type Search = { category?: string; rating?: string; price?: string };

/* Filter bands for the brand's product list (same values as the product category pages). */
const RATING_BANDS = [
  { value: '4', label: '4.0 and up', min: 4 },
  { value: '3', label: '3.0 and up', min: 3 },
];
const PRICE_BANDS = [
  { value: 'under-15', label: 'Under $15', min: 0, max: 15 },
  { value: '15-30', label: '$15 to $30', min: 15, max: 30 },
  { value: '30-60', label: '$30 to $60', min: 30, max: 60 },
  { value: '60-plus', label: '$60 and over', min: 60, max: Infinity },
];

async function getBrand(slug: string) {
  const brands = await listProductBrands().catch(() => []);
  return brands.find((b) => b.slug === slug) ?? null;
}

export async function generateStaticParams() {
  const brands = await listProductBrands().catch(() => []);
  return brands.map((b) => ({ slug: b.slug }));
}

/* Brand URLs are lowercase-hyphen slugs (lib/brands.ts). The old URLs used the raw brand name
   (/brands/Paula's%20Choice, /brands/Elf); those arrive here percent-encoded and are sent on to the new slug. */
const brandSlugFrom = async (params: Promise<Params>) => decodeURIComponent((await params).slug);
const brandPath = (slug: string) => `/brands/${slug}`;

/** The brand for a new slug, or null; for an old raw-name URL, redirects to the new slug. */
async function resolveBrand(requested: string) {
  const brand = await getBrand(requested);
  if (brand) return brand;
  const bySlug = brandSlug(requested);
  if (bySlug && bySlug !== requested && (await getBrand(bySlug))) permanentRedirect(brandPath(bySlug));
  return null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const slug = await brandSlugFrom(params);
  const brand = await resolveBrand(slug);
  if (!brand) return { title: 'Brand not found' };
  const meta = getBrandMeta(brand.name);
  const description =
    INTROS[brand.slug]?.intro ||
    brand.description ||
    meta.description ||
    meta.tagline ||
    `Shop ${brand.name} skincare products and compare prices at ${SITE.name}.`;
  return {
    title: `${brand.name} — Skincare Products & Prices`,
    description,
    alternates: { canonical: brandPath(brand.slug) },
    openGraph: { title: brand.name, description, url: `${SITE.url}${brandPath(brand.slug)}` },
    ...(isIndexableBrand(brand) ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function BrandPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Search> }) {
  const slug = await brandSlugFrom(params);
  const brand = await resolveBrand(slug);
  if (!brand) notFound();

  const sp = await searchParams;
  /* A merged brand (e.g. e.l.f. and Elf) has several raw names: fetch each and de-duplicate. */
  const aliases = brand.aliases?.length ? brand.aliases : [brand.name];
  const [lists, categoryCounts, productTotal, allBrands] = await Promise.all([
    Promise.all(aliases.map((a) => listProducts({ brand: a, pageSize: 100 }).then((r) => r.data).catch(() => []))),
    listProductCategoryCounts().catch(() => []),
    listProducts({ pageSize: 1 })
      .then((r) => r.meta.pagination.total)
      .catch(() => null),
    listProductBrands().catch(() => []),
  ]);
  const all = [...new Map(lists.flat().map((p) => [p.id, p])).values()];

  /* Filters (left sidebar): category within this brand, rating and price, as plain links. Each facet counts
     against the other active filters, so picking one never zeroes the rest. */
  const inCategory = (p: (typeof all)[number]) => !sp.category || (p.categories ?? []).some((c) => c.slug === sp.category);
  const inRating = (p: (typeof all)[number]) => {
    const band = RATING_BANDS.find((b) => b.value === sp.rating);
    return !band || (p.rating ?? 0) >= band.min;
  };
  const inPrice = (p: (typeof all)[number]) => {
    const band = PRICE_BANDS.find((b) => b.value === sp.price);
    return !band || (p.currentPrice !== undefined && p.currentPrice >= band.min && p.currentPrice < band.max);
  };
  const products = all.filter((p) => inCategory(p) && inRating(p) && inPrice(p));

  const catCounts = new Map<string, { name: string; count: number }>();
  for (const p of all.filter((p) => inRating(p) && inPrice(p))) {
    for (const c of p.categories ?? []) {
      const e = catCounts.get(c.slug) ?? { name: c.name, count: 0 };
      e.count += 1;
      catCounts.set(c.slug, e);
    }
  }
  const categoryFacets = [...catCounts.entries()].map(([value, e]) => ({ value, ...e })).sort((a, b) => b.count - a.count);
  const ratingFacets = RATING_BANDS.map((b) => ({ ...b, count: all.filter((p) => inCategory(p) && inPrice(p) && (p.rating ?? 0) >= b.min).length })).filter((f) => f.count > 0);
  /* No price filter when every product is info-only (lib/site.ts). */
  const showPrice = all.some((p) => !isInfoOnlyProduct(p));
  const priceFacets = showPrice
    ? PRICE_BANDS.map((b) => ({
        ...b,
        count: all.filter((p) => inCategory(p) && inRating(p) && p.currentPrice !== undefined && p.currentPrice >= b.min && p.currentPrice < b.max).length,
      })).filter((f) => f.count > 0)
    : [];
  const filtered = Boolean(sp.category || sp.rating || sp.price);
  const href = (next: Search) => {
    const q = new URLSearchParams();
    const merged = { ...sp, ...next };
    for (const k of ['category', 'rating', 'price'] as const) if (merged[k]) q.set(k, merged[k] as string);
    const qs = q.toString();
    return qs ? `${brandPath(brand.slug)}?${qs}` : brandPath(brand.slug);
  };
  /* "Other brands" widget: the brands with the most products, excluding this one. */
  const otherBrands = allBrands
    .filter((b) => b.slug !== brand.slug && (b.productCount ?? 0) > 0)
    .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0))
    .slice(0, 8);
  const meta = getBrandMeta(brand.name);
  const logo = mediaUrl(brand.logo ?? null) || meta.logo;
  const websitePlain = brand.websiteUrl || meta.website;
  /* The brand's own store goes out through the affiliate resolver like any retailer link (lib/links.ts). */
  const websiteLink = websitePlain ? resolveOutbound(websitePlain) : null;
  const website = websiteLink?.url;
  const description = INTROS[brand.slug]?.intro || brand.description || meta.description || meta.tagline;

  return (
    <div data-testid={`brand-${brand.slug}`} className="brand-detail-page">
      <section className="sec-breadcumb brand-header-section">
        <div className="container">
          <Breadcrumb items={[{ label: 'Brands', href: '/brands' }, { label: brand.name }]} />

          <div className="row align-items-center justify-content-between g-4 mb-4">
            <div className="col-lg-8 col-12">
              <div className="brand-hero-identity d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-3">
                {logo && (
                  <div className="brand-header-logo-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo} alt={`${brand.name} logo`} className="brand-header-logo" />
                  </div>
                )}
                <div>
                  <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                    <h1 className="h3 mb-0 fw-bold">{brand.name}</h1>
                    {meta.category && (
                      <span className="brand-badge brand-badge--category">{meta.category}</span>
                    )}
                    {meta.origin && (
                      <span className="brand-badge brand-badge--origin">{meta.origin}</span>
                    )}
                  </div>
                  {meta.tagline && <p className="text-600 fs-7 mb-2">{meta.tagline}</p>}
                  {website && (
                    <a
                      href={website}
                      target="_blank"
                      rel={websiteLink?.network === 'direct' ? 'noopener noreferrer' : 'sponsored nofollow noopener'}
                      className="brand-website-link d-inline-flex align-items-center gap-1 fs-7 fw-medium"
                    >
                      Visit official website
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-12 d-flex justify-content-lg-end">
              <div className="brand-stock-badge">
                <span className="brand-stock-badge__num">{all.length}</span>
                <span className="brand-stock-badge__lbl">
                  {all.length === 1 ? 'Product Stocked' : 'Products Stocked'}
                </span>
              </div>
            </div>
          </div>

          {/* Full-Width Brand Description / Introduction */}
          {description && (
            <div className="row mt-4">
              <div className="col-12">
                <div className="brand-description-fullwidth">
                  <div className="brand-description-kicker">
                    <span>About {brand.name}</span>
                  </div>
                  <p className="brand-description-text">{description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="pt-5 pb-70">
        <div className="container">
          <div className="row g-5">
            {/* Filters and widgets, below the About section */}
            <aside className="col-lg-3 col-12" aria-label="Filter products">
                {categoryFacets.length > 0 && (
                  <div className="shop-widget" data-testid="brand-filter-category">
                    <SidebarTitle>Category</SidebarTitle>
                    <ul className="list-unstyled ps-0 m-0 archive-filter-list">
                      <li>
                        <Link href={href({ category: undefined })} className={`archive-filter${!sp.category ? ' is-active' : ''}`}>
                          <span>All categories</span>
                        </Link>
                      </li>
                      {categoryFacets.map((f) => (
                        <li key={f.value}>
                          <Link href={href({ category: f.value })} className={`archive-filter${sp.category === f.value ? ' is-active' : ''}`} aria-current={sp.category === f.value ? 'true' : undefined}>
                            <span>{f.name}</span>
                            <span className="number">{f.count}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {ratingFacets.length > 0 && (
                  <div className="shop-widget" data-testid="brand-filter-rating">
                    <SidebarTitle>Rating</SidebarTitle>
                    <ul className="list-unstyled ps-0 m-0 archive-filter-list">
                      <li>
                        <Link href={href({ rating: undefined })} className={`archive-filter${!sp.rating ? ' is-active' : ''}`}>
                          <span>Any rating</span>
                        </Link>
                      </li>
                      {ratingFacets.map((f) => (
                        <li key={f.value}>
                          <Link href={href({ rating: f.value })} className={`archive-filter${sp.rating === f.value ? ' is-active' : ''}`} aria-current={sp.rating === f.value ? 'true' : undefined}>
                            <span>{f.label}</span>
                            <span className="number">{f.count}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {priceFacets.length > 0 && (
                  <div className="shop-widget" data-testid="brand-filter-price">
                    <SidebarTitle>Price</SidebarTitle>
                    <ul className="list-unstyled ps-0 m-0 archive-filter-list">
                      <li>
                        <Link href={href({ price: undefined })} className={`archive-filter${!sp.price ? ' is-active' : ''}`}>
                          <span>Any price</span>
                        </Link>
                      </li>
                      {priceFacets.map((f) => (
                        <li key={f.value}>
                          <Link href={href({ price: f.value })} className={`archive-filter${sp.price === f.value ? ' is-active' : ''}`} aria-current={sp.price === f.value ? 'true' : undefined}>
                            <span>{f.label}</span>
                            <span className="number">{f.count}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {categoryCounts.length > 0 && (
                <div className="shop-widget">
                  <CategoryListWidget title="Browse by category" allHref="/products" allLabel="All products" total={productTotal} rows={categoryCounts} />
                </div>
              )}

              {otherBrands.length > 0 && (
                <div className="shop-widget" data-testid="brand-other-brands">
                  <SidebarTitle>Other brands</SidebarTitle>
                  <ul className="list-unstyled ps-0 m-0 archive-filter-list">
                    {otherBrands.map((b) => (
                      <li key={b.slug}>
                        <Link href={brandPath(b.slug)} className="archive-filter">
                          <span>{b.name}</span>
                          <span className="number">{b.productCount}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link href="/brands" className="bls-link fs-7 fw-medium d-inline-block mt-3">
                    All brands
                  </Link>
                </div>
              )}
            </aside>

            {/* Products */}
            <div className="col-lg-9 col-12">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4 pb-2 border-bottom">
                <h2 className="h5 mb-0 fw-bold">
                  {all.length > 0 ? `${brand.name} Collection (${products.length})` : `${brand.name} Products`}
                </h2>
                {filtered ? (
                  <Link href={brandPath(brand.slug)} className="bls-link fs-7 fw-medium">
                    Clear filters
                  </Link>
                ) : (
                  <Link href="/brands" className="bls-link fs-7 fw-medium">
                    &larr; Back to all brands
                  </Link>
                )}
              </div>

              {products.length > 0 ? (
                <div className="row g-3 g-md-4">
                  {products.map((p) => (
                    <div className="col-xl-4 col-sm-6 col-12" key={p.id}>
                      <ProductCard product={p} variant="tile" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="brand-empty-state mt-4">
                  <p className="text-600 mb-3">
                    {all.length > 0 ? 'No products match these filters.' : `No products catalogued yet for ${brand.name}.`}
                  </p>
                  <Link href={all.length > 0 ? brandPath(brand.slug) : '/brands'} className="shop-btn-primary">
                    {all.length > 0 ? 'Clear filters' : 'Browse All Skincare Brands'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
