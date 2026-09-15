import type { PricePoint } from '@/lib/strapi';

function money(n: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

const shortDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
const usDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
const isoDay = (d: string) => new Date(d).toISOString().slice(0, 10);

/* A round axis maximum a little above the highest price, split into four steps. */
function niceScale(max: number) {
  const raw = (max * 1.15) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  return { top: step * 4, step };
}

/**
 * Price history chart built from commerce-price-snapshots (no chart library). A card with a price axis, dashed grid,
 * a filled line from the first to the latest recorded price, a "Latest price" callout, and the highest and lowest
 * recorded prices underneath. The product page renders it only when at least two real snapshots exist; it never
 * draws estimated or filled-in points.
 */
export default function PriceHistoryChart({ points }: { points: PricePoint[] }) {
  if (points.length < 2) return null;

  const currency = points[0].currency || 'USD';
  const n = points.length;
  const latest = points[n - 1];
  const highest = points.reduce((a, b) => (b.price > a.price ? b : a));
  const lowest = points.reduce((a, b) => (b.price < a.price ? b : a));
  const { top, step } = niceScale(highest.price);
  const ticks = [4, 3, 2, 1, 0].map((i) => i * step);

  /* Plot coordinates in a 0-1000 x 0-100 box; the SVG stretches to the card, markers are HTML so they stay round. */
  const px = (i: number) => (i / (n - 1)) * 1000;
  const py = (price: number) => (1 - price / top) * 100;
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(2)},${py(p.price).toFixed(2)}`).join(' ');
  const area = `${line} L1000,100 L0,100 Z`;
  const lastY = py(latest.price);

  return (
    <div data-testid="price-history-chart">
      <div className="ph-card">
        <p className="ph-updated">Latest update: {shortDate(latest.date)}</p>
        <div className="ph-body">
          <ul className="ph-axis list-unstyled m-0 p-0" aria-hidden>
            {ticks.map((t) => (
              <li key={t} style={{ top: `${(1 - t / top) * 100}%` }}>
                {Math.round(t).toLocaleString('en-US')} {currency}
              </li>
            ))}
          </ul>
          <div className="ph-plot">
            <svg
              viewBox="0 0 1000 100"
              preserveAspectRatio="none"
              className="ph-svg"
              role="img"
              aria-label={`Price history from ${usDate(points[0].date)} to ${usDate(latest.date)}: highest ${money(highest.price, currency)}, lowest ${money(lowest.price, currency)}, latest ${money(latest.price, currency)}`}
            >
              <defs>
                <linearGradient id="ph-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 25, 50, 75].map((y) => (
                <line
                  key={y}
                  x1="0"
                  x2="1000"
                  y1={y}
                  y2={y}
                  className="ph-gridline"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <line x1="0" x2="1000" y1="100" y2="100" className="ph-baseline" vectorEffect="non-scaling-stroke" />
              <path d={area} fill="url(#ph-area)" />
              <path
                d={line}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <span className="ph-dot is-first" style={{ left: '0%', top: `${py(points[0].price)}%` }} aria-hidden />
            <span className="ph-dot is-latest" style={{ left: '100%', top: `${lastY}%` }} aria-hidden />
            <div className={`ph-callout ${lastY > 55 ? 'is-above' : ''}`} style={{ top: `${lastY}%` }}>
              <span className="ph-callout-label">Latest price</span>
              <span className="ph-callout-value">
                {latest.price.toFixed(2)} {currency}
              </span>
            </div>
          </div>
        </div>
        <div className="ph-dates" aria-hidden>
          <span>{isoDay(points[0].date)}</span>
          <span>{isoDay(latest.date)}</span>
        </div>
      </div>
      <div className="ph-extremes">
        <p className="m-0">
          <span className="ph-high">Highest Price:</span> {money(highest.price, currency)} - {usDate(highest.date)}
        </p>
        <p className="m-0">
          <span className="ph-low">Lowest Price:</span> {money(lowest.price, currency)} - {usDate(lowest.date)}
        </p>
      </div>
    </div>
  );
}
