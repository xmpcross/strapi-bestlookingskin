import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/lib/site';
import { listProductBrands } from '@/lib/strapi';
import Breadcrumb from '@/components/magzin/Breadcrumb';
import BrandSearchFilter from '@/components/magzin/BrandSearchFilter';
import { getBrandMeta } from '@/lib/brand-data';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Skincare Brands Directory — Authentic Brands & Products',
  description: `Browse every dermatologist-backed, clinical, and luxury skincare brand covered by ${SITE.name}. Compare formulas, prices, and routines.`,
  alternates: { canonical: '/brands' },
};

export default async function BrandsPage() {
  const brands = await listProductBrands().catch(() => []);

  // Top 8 spotlight brands by product count or curated popularity
  const spotlightNames = [
    'Olay',
    "Paula's Choice",
    'Clinique',
    'CeraVe',
    'La Roche-Posay',
    'Drunk Elephant',
    'The Ordinary',
    "Kiehl's",
  ];

  const spotlightBrands = spotlightNames
    .map((name) => {
      const match = brands.find((b) => b.name.toLowerCase() === name.toLowerCase());
      const meta = getBrandMeta(name);
      return {
        name,
        slug: match?.slug || name,
        productCount: match?.productCount || 0,
        logo: meta.logo,
      };
    })
    .filter((b) => Boolean(b.logo));

  return (
    <div data-testid="brands-page" className="brands-directory">
      {/* Editorial Hero */}
      <section className="brand-hero sec-breadcumb">
        <div className="container">
          <Breadcrumb items={[{ label: 'Brands' }]} />
          <div className="row align-items-center justify-content-between g-4">
            <div className="col-lg-8 col-12">
              <div className="brand-hero__badge">
                <span className="brand-hero__badge-dot"></span>
                <span>{brands.length > 0 ? `${brands.length}+ Brands Curated` : 'Curated Directory'}</span>
              </div>
              <h1 className="brand-hero__title">Skincare Brands Directory</h1>
              <p className="brand-hero__subtitle">
                Explore our curated catalog of clinical actives, dermatologist-backed essentials,
                award-winning K-Beauty formulas, and luxury skincare houses. Find verified products and compare prices.
              </p>
            </div>
            <div className="col-lg-4 col-12 d-flex justify-content-lg-end">
              <div className="brand-hero__stat-card">
                <div className="brand-hero__stat-num">{brands.length}</div>
                <div className="brand-hero__stat-lbl">Active Skincare Brands</div>
              </div>
            </div>
          </div>

          {/* Top Brands Spotlight Strip */}
          {spotlightBrands.length > 0 && (
            <div className="brand-spotlight mt-4 pt-4 border-top">
              <div className="brand-spotlight__heading">
                <span className="brand-spotlight__label">Top Stocked Brands</span>
                <span className="brand-spotlight__sub">Most popular across our skincare catalogue</span>
              </div>
              <div className="brand-spotlight__grid mt-3">
                {spotlightBrands.map((b) => (
                  <Link
                    key={b.name}
                    href={`/brands/${encodeURIComponent(b.slug)}`}
                    className="brand-spotlight__card"
                    title={`View ${b.name} products`}
                  >
                    <div className="brand-spotlight__logo-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.logo}
                        alt={`${b.name} logo`}
                        className="brand-spotlight__logo"
                        loading="lazy"
                      />
                    </div>
                    <span className="brand-spotlight__name">{b.name}</span>
                    {b.productCount > 0 && (
                      <span className="brand-spotlight__count">{b.productCount} products</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Interactive Directory Section: Search, Filter & Alphabetized Grid */}
      <section className="pt-4 pb-70">
        <div className="container">
          <BrandSearchFilter initialBrands={brands} />
        </div>
      </section>
    </div>
  );
}
