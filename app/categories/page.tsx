import Link from 'next/link';
import type { Metadata } from 'next';
import { SITE } from '@/lib/site';
import { listProductCategories, mediaUrl } from '@/lib/strapi';
import Breadcrumb from '@/components/magzin/Breadcrumb';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Product Categories',
  description: `Browse skincare product categories at ${SITE.name}.`,
  alternates: { canonical: '/categories' },
};

export default async function CategoriesPage() {
  const categories = (await listProductCategories().catch(() => []))
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));

  return (
    <div data-testid="categories-page">
      <section className="sec-breadcumb">
        <div className="container">
          <Breadcrumb items={[{ label: 'Product categories' }]} />
          <div className="row align-items-end">
            <div className="col-lg-8 col-12">
              <div className="title">
                <h1 className="h4 mb-0 ds-4">Product Categories</h1>
                {/* Not a price-comparison claim. This site is editorial: it writes about
                    products and lists where to buy them at the price last checked. Promising
                    a comparison commits every product page to more than one offer, which the
                    catalogue does not always have. */}
                <p className="fs-7 mb-0 mt-3">
                  Browse skincare by category. Every product shows its latest price and where to buy it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-5 pb-70">
        <div className="container">
          {categories.length === 0 ? (
            <div className="shop-empty">
              <p className="mb-0">No product categories are available yet.</p>
            </div>
          ) : (
            <ul className="row g-3 list-unstyled ps-0 mb-0">
              {categories.map((c) => {
                const image = mediaUrl(c.image ?? null);
                return (
                  <li key={c.slug} className="col-lg-4 col-md-6 col-12">
                    <Link
                      href={`/categories/${c.slug}`}
                      className="shop-cat-card d-flex align-items-center gap-3 rounded-16 p-3 h-100"
                    >
                      <span className="shop-cat-icon">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={image} alt={c.name} />
                        ) : (
                          <span aria-hidden>{c.icon ?? '🧴'}</span>
                        )}
                      </span>
                      <span className="d-block" style={{ minWidth: 0 }}>
                        <span className="d-block fs-6 fw-semi-bold text-dark">{c.name}</span>
                        {c.description && (
                          <span className="d-block fs-8 text-600 mt-1 text-truncate-1">{c.description}</span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
