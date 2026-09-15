import type { PricePoint } from '@/lib/strapi';

/**
 * Price-intelligence signals derived from commerce-price-snapshots, rendered as
 * a green checkmark list (styled after the Shopify "Xtra" theme product
 * feature list): a bold lead phrase + supporting text. Shows whether the
 * current price is a good deal vs. its recent history. Renders nothing without
 * enough history. Pure/server component.
 */
export default function PriceBadges({
  history,
  current,
  windowDays = 90,
}: {
  history: PricePoint[];
  current?: number;
  windowDays?: number;
}) {
  if (!current || !Number.isFinite(current) || !history?.length) return null;

  // eslint-disable-next-line react-hooks/purity -- a server-rendered badge; "now" is the render time, revalidated with the page.
  const cutoff = Date.now() - windowDays * 86400000;
  const recent = history.filter((p) => p.date && new Date(p.date).getTime() >= cutoff);
  const series = recent.length >= 2 ? recent : history;
  const prices = series.map((p) => p.price).filter((n) => Number.isFinite(n) && n > 0);
  if (prices.length < 2) return null;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const windowLabel = recent.length >= 2 ? `${windowDays} days` : 'tracked history';

  const atLow = current <= min * 1.01;
  const pctBelowAvg = Math.round(((avg - current) / avg) * 100);
  const nearHigh = current >= max * 0.99 && !atLow;

  const items: { strong: string; rest?: string; warn?: boolean }[] = [];
  if (atLow || pctBelowAvg >= 5) items.push({ strong: 'Buy Now,', rest: ' good time to buy.' });
  if (atLow) items.push({ strong: 'Lowest price', rest: ` in ${windowLabel}` });
  if (pctBelowAvg >= 5) items.push({ strong: 'Cheaper,', rest: ` price is ${pctBelowAvg}% below average.` });
  if (nearHigh && pctBelowAvg < 5) items.push({ strong: 'Near its highest', rest: ' — consider waiting', warn: true });

  if (!items.length) return null;

  return (
    <ul className="shop-checks list-unstyled ps-0 mt-4 mb-0" data-testid="price-badges">
      {items.map((it) => (
        <li key={it.strong}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={it.warn ? 'shop-check-warn' : 'shop-check-ok'}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>
            <strong className="fw-semi-bold text-dark">{it.strong}</strong>
            {it.rest}
          </span>
        </li>
      ))}
    </ul>
  );
}
