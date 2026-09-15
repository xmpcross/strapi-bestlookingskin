import Link from 'next/link';
import type { CommerceProduct } from '@/lib/strapi';
import { mediaUrl } from '@/lib/strapi';

/**
 * Products from the article's own category, shown inside the body.
 *
 * Drawn from the catalogue rather than fetched per article: every skincare category already holds 33 to 43
 * products, so a DataForSEO call here would buy data the site already has and put a paid request in the
 * render path of every page view.
 *
 * Ordered by rating, and a product with no rating sorts last -- no star is invented for one never rated.
 *
 * The price shown is the lowest in-stock offer, labelled "from" because the product carries several. A
 * product with no priced, in-stock offer shows no price rather than a placeholder or a stale figure.
 */
export default function InlineProducts({ products, title = 'Related products' }: { products: CommerceProduct[]; title?: string }) {
  const items = products.slice(0, 3);
  if (items.length < 2) return null;
  return (
    <aside className="my-5" data-testid="inline-products">
      <p className="h6 mb-3">{title}</p>
      <div className="row g-3">
        {items.map((p) => {
          const img = mediaUrl(p.primaryImage ?? null);
          const priced = (p.offers ?? [])
            .filter((o) => typeof o.price === 'number' && o.availability !== 'out_of_stock')
            .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))[0];
          return (
            <div className="col-md-4 col-12" key={p.slug}>
              <Link href={`/products/${p.slug}`} className="inline-product d-block h-100 rounded-16 p-3">
                <span className="d-block rounded-8 overflow-hidden bg-white">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={p.name} className="w-100" style={{ aspectRatio: '1', objectFit: 'contain', padding: 12 }} loading="lazy" />
                  ) : (
                    <span className="d-block" style={{ aspectRatio: '1' }} />
                  )}
                </span>
                <span className="d-block fs-7 fw-semi-bold text-dark mt-3 text-truncate-2">{p.name}</span>
                {p.brand && <span className="d-block fs-8 text-600 mt-1">{p.brand}</span>}
                {priced && (
                  <span className="d-block fs-7 fw-semi-bold text-dark mt-2">
                    from{' '}
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: priced.currency || 'USD', maximumFractionDigits: 2 }).format(priced.price as number)}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
