import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SITE } from '@/lib/site';
import { listProductBrands, listProducts, mediaUrl } from '@/lib/strapi';
import ProductCard from '@/components/ProductCard';
import Breadcrumb from '@/components/magzin/Breadcrumb';
import { getBrandMeta } from '@/lib/brand-data';

export const revalidate = 60;
export const dynamicParams = true;

type Params = { slug: string };

async function getBrand(slug: string) {
  const brands = await listProductBrands().catch(() => []);
  return brands.find((b) => b.slug === slug) ?? null;
}

export async function generateStaticParams() {
  const brands = await listProductBrands().catch(() => []);
  return brands.map((b) => ({ slug: b.slug }));
}

/* A brand's slug is its display name ("La Roche-Posay"), so links encode it (/brands/La%20Roche-Posay) and the
   route receives it still percent-encoded. Comparing that to the name 404'd every brand with a space or an
   apostrophe; single-word brands only worked because they had nothing to encode. */
const brandSlugFrom = async (params: Promise<Params>) => decodeURIComponent((await params).slug);
const brandPath = (slug: string) => `/brands/${encodeURIComponent(slug)}`;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const slug = await brandSlugFrom(params);
  const brand = await getBrand(slug);
  if (!brand) return { title: 'Brand not found' };
  const meta = getBrandMeta(brand.name);
  const description =
    brand.description ||
    meta.description ||
    meta.tagline ||
    `Shop ${brand.name} skincare products and compare prices at ${SITE.name}.`;
  return {
    title: `${brand.name} — Skincare Products & Prices`,
    description,
    alternates: { canonical: brandPath(brand.slug) },
    openGraph: { title: brand.name, description, url: `${SITE.url}${brandPath(brand.slug)}` },
  };
}

export default async function BrandPage({ params }: { params: Promise<Params> }) {
  const slug = await brandSlugFrom(params);
  const brand = await getBrand(slug);
  if (!brand) notFound();

  const products = (await listProducts({ brand: slug, pageSize: 48 }).catch(() => null))?.data ?? [];
  const meta = getBrandMeta(brand.name);
  const logo = mediaUrl(brand.logo ?? null) || meta.logo;
  const website = brand.websiteUrl || meta.website;
  const description = brand.description || meta.description || meta.tagline;

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
                      rel="noopener noreferrer"
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
                <span className="brand-stock-badge__num">{products.length}</span>
                <span className="brand-stock-badge__lbl">
                  {products.length === 1 ? 'Product Stocked' : 'Products Stocked'}
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
          <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
            <h2 className="h5 mb-0 fw-bold">
              {products.length > 0
                ? `${brand.name} Collection (${products.length})`
                : `${brand.name} Products`}
            </h2>
            <Link href="/brands" className="bls-link fs-7 fw-medium">
              &larr; Back to all brands
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="row g-3 g-md-4">
              {products.map((p) => (
                <div className="col-lg-3 col-sm-6 col-12" key={p.id}>
                  <ProductCard product={p} variant="tile" />
                </div>
              ))}
            </div>
          ) : (
            <div className="brand-empty-state mt-4">
              <p className="text-600 mb-3">No products catalogued yet for {brand.name}.</p>
              <Link href="/brands" className="shop-btn-primary">
                Browse All Skincare Brands
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
