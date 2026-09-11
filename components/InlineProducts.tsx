import Link from 'next/link';
import type { CommerceProduct } from '@/lib/strapi';
import { mediaUrl } from '@/lib/strapi';

/**
 * Products from the article's own category, shown inside the body.
 *
 * Drawn from the catalogue rather than fetched per article: every skincare
 * category already holds 33 to 43 products, so a DataForSEO call here would buy
 * data the site already has and put a paid request in the render path of every
 * page view.
 *
 * Ordered by rating, and a product with no rating simply sorts last -- no star
 * is invented for one that has never been rated.
 *
 * The price shown is the lowest in-stock offer, labelled "from" because the
 * product carries several and this is the cheapest of them -- printing one
 * retailer's figure as "the price" would be wrong the moment a reader opened a
 * different one. A product with no priced, in-stock offer shows no price at all
 * rather than a placeholder or a stale last-known figure.
 */
export default function InlineProducts({
  products,
  title = 'Related products',
}: {
  products: CommerceProduct[];
  title?: string;
}) {
  const items = products.slice(0, 3);
  if (items.length < 2) return null;

  return (
    <aside className="my-10" data-testid="inline-products">
      <p className="font-display !text-[17px] font-bold text-ink">{title}</p>
      <ul className="mt-5 grid gap-4 sm:grid-cols-3">
        {items.map((p) => {
          const img = mediaUrl(p.primaryImage ?? null);
          const priced = (p.offers ?? [])
            .filter((o) => typeof o.price === 'number' && o.availability !== 'out_of_stock')
            .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))[0];
          return (
            <li key={p.slug}>
              <Link
                href={`/products/${p.slug}`}
                className="group block rounded-lg border border-[#dddddd] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:shadow-[0_2px_10px_rgba(0,0,0,0.09)]"
              >
                <span className="block overflow-hidden rounded-lg bg-white">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={p.name}
                      className="aspect-square w-full object-contain p-3 transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <span className="block aspect-square bg-ink/5" />
                  )}
                </span>
                <span className="mt-3 block font-display !text-[14px] font-bold leading-snug text-ink transition group-hover:text-primary">
                  {p.name}
                </span>
                {p.brand && <span className="mt-1 block text-[12px] text-ink/50">{p.brand}</span>}
                {priced && (
                  <span className="mt-2 block text-[13px] font-bold text-ink">
                    from{' '}
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: priced.currency || 'USD',
                      maximumFractionDigits: 2,
                    }).format(priced.price as number)}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
