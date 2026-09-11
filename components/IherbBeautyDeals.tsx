import { getIherbDeals } from '@/lib/iherb-deals';

/**
 * "Beauty deals today" sidebar widget.
 *
 * Sits in the article sidebar rather than in the body: it is commercial and
 * perishable, and dropping merchant prices into the middle of an editorial
 * guide blurs the line between the advice and the ad. The sidebar is where the
 * other browse-and-discover panels already live.
 *
 * Beauty only -- the same scrape carries supplements, which belong on
 * nxt.discount but not beside a skincare article.
 *
 * Prices are AUD and labelled A$: the source is au.iherb.com while this site's
 * catalogue prices are USD, so an unlabelled "$" would be a wrong price, not a
 * formatting choice. The "checked" date is shown because a scraped price goes
 * stale, and rel="sponsored nofollow" because these are merchant links.
 */
export default function IherbBeautyDeals({ limit = 4 }: { limit?: number }) {
  const data = getIherbDeals({ category: 'Beauty', limit });
  if (!data) return null;

  const checked = new Date(data.fetchedAt);

  return (
    <section
      className="rounded-2xl border border-ink/10 bg-paper p-5"
      aria-label="Beauty deals today"
      data-testid="iherb-beauty-deals"
    >
      <p className="font-display !text-[17px] font-bold text-ink">Beauty deals today</p>
      <p className="mt-1 text-[12px] leading-5 text-ink/50">
        From iHerb, in Australian dollars. Prices change — check before buying.
      </p>

      <ul className="mt-4 space-y-4">
        {data.deals.map((deal) => (
          <li key={deal.id}>
            <a
              href={deal.url}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              className="group flex items-start gap-3"
            >
              {deal.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={deal.image}
                  alt={deal.title}
                  loading="lazy"
                  className="h-14 w-14 shrink-0 rounded-lg bg-white object-contain p-1"
                />
              )}
              <span className="min-w-0">
                {deal.brand && (
                  <span className="block text-[11px] font-semibold text-primary">{deal.brand}</span>
                )}
                <span className="block line-clamp-2 font-display !text-[13px] font-bold leading-snug text-ink transition group-hover:text-primary">
                  {deal.title}
                </span>
                <span className="mt-1 flex items-baseline gap-2">
                  <span className="text-[13px] font-bold text-ink">A${deal.price.toFixed(2)}</span>
                  <span className="text-[11px] text-ink/45 line-through">A${deal.wasPrice.toFixed(2)}</span>
                  <span className="text-[11px] font-bold text-primary">−{deal.percentOff}%</span>
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[11px] text-ink/40">
        Checked{' '}
        <time dateTime={data.fetchedAt}>
          {checked.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
        </time>
        . We may earn a commission from these links.
      </p>
    </section>
  );
}
