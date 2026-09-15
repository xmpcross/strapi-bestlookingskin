import Link from 'next/link';
import type { Metadata } from 'next';
import { SITE } from '@/lib/site';
import { listProductBrands } from '@/lib/strapi';
import Breadcrumb from '@/components/magzin/Breadcrumb';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Skincare Brands',
  description: `Browse skincare brands covered by ${SITE.name}.`,
  alternates: { canonical: '/brands' },
};

export default async function BrandsPage() {
  const brands = await listProductBrands().catch(() => []);
  const groups = groupBrands(brands);

  return (
    <div data-testid="brands-page">
      <section className="sec-breadcumb">
        <div className="container">
          <Breadcrumb items={[{ label: 'Brands' }]} />
          <div className="row align-items-end">
            <div className="col-lg-8 col-12">
              <div className="title">
                <h1 className="h4 mb-0 ds-4">Skincare Brands</h1>
                <p className="fs-7 mb-0 mt-3">
                  Browse every brand in the product catalog and jump straight to matching products.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-5 pb-70">
        <div className="container">
          {brands.length === 0 ? (
            <div className="shop-empty">
              <p className="mb-0">No product brands are available yet.</p>
            </div>
          ) : (
            <div>
              {groups.map((group, i) => (
                <section key={group.letter} className={`row g-3 ${i > 0 ? 'shop-brand-letter pt-4 mt-4' : ''}`}>
                  <div className="col-md-1 col-12">
                    <h2 className="h5 mb-0">{group.letter}</h2>
                  </div>
                  <div className="col-md-11 col-12">
                    <ul className="row g-2 list-unstyled ps-0 mb-0">
                      {group.brands.map((brand) => (
                        <li key={brand.slug} className="col-lg-3 col-sm-6 col-12">
                          <Link href={`/brands/${encodeURIComponent(brand.slug)}`} className="tag-item shop-brand-link">
                            {brand.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function groupBrands(brands: Awaited<ReturnType<typeof listProductBrands>>) {
  const map = new Map<string, typeof brands>();

  for (const brand of brands) {
    const first = brand.name[0]?.toUpperCase() ?? '#';
    const letter = /^[A-Z]$/.test(first) ? first : '#';
    map.set(letter, [...(map.get(letter) ?? []), brand]);
  }

  return Array.from(map.entries()).map(([letter, groupedBrands]) => ({
    letter,
    brands: groupedBrands,
  }));
}
