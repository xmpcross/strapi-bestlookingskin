import type { PricePoint } from '@/lib/strapi';

function money(n: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="price-stat-label">{label}</p>
      <p className={`price-stat-value ${accent ? 'is-accent' : ''}`}>{value}</p>
    </div>
  );
}

/**
 * Dependency-free SVG price-history chart, built from commerce-price-snapshots.
 * Renders summary stats (current / lowest / highest / change) and an area line.
 */
export default function PriceHistoryChart({ points }: { points: PricePoint[] }) {
  if (!points.length) {
    return (
      <p className="text-600">
        No price history yet — we&apos;ll chart this product&apos;s price as we track it over time.
      </p>
    );
  }

  const currency = points[0].currency || 'USD';
  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const current = prices[prices.length - 1];
  const first = prices[0];
  const change = first ? ((current - first) / first) * 100 : 0;
  const n = points.length;

  const W = 640;
  const H = 220;
  const padX = 8;
  const padY = 16;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;
  const span = max - min || 1;
  const x = (i: number) => (n === 1 ? W / 2 : padX + (i / (n - 1)) * innerW);
  const y = (p: number) => padY + (1 - (p - min) / span) * innerH;

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.price).toFixed(1)}`).join(' ');
  const area = `${line} L${x(n - 1).toFixed(1)},${(H - padY).toFixed(1)} L${x(0).toFixed(1)},${(H - padY).toFixed(1)} Z`;
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div data-testid="price-history-chart">
      <div className="d-flex flex-wrap gap-4 mb-4">
        <Stat label="Current" value={money(current, currency)} />
        <Stat label="Lowest" value={money(min, currency)} accent />
        <Stat label="Highest" value={money(max, currency)} />
        {n > 1 && <Stat label="Change" value={`${change >= 0 ? '+' : ''}${change.toFixed(1)}%`} />}
      </div>

      {n === 1 ? (
        <p className="fs-7 text-600">
          Only one price point recorded so far — the trend line will build as we track more prices.
        </p>
      ) : (
        <>
          {/* Line and fill take currentColor from .price-chart, so the chart follows the light/dark theme. */}
          <svg viewBox={`0 0 ${W} ${H}`} className="price-chart" role="img" aria-label="Price history chart" preserveAspectRatio="none">
            <defs>
              <linearGradient id="ph-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.14" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width={W} height={H} className="ph-bg" />
            <line x1={padX} y1={y(max)} x2={W - padX} y2={y(max)} className="ph-grid" />
            <line x1={padX} y1={y(min)} x2={W - padX} y2={y(min)} className="ph-grid" />
            <path d={area} fill="url(#ph-fill)" />
            <path d={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <circle cx={x(0)} cy={y(first)} r="3.5" fill="currentColor" />
            <circle cx={x(n - 1)} cy={y(current)} r="4.5" fill="currentColor" />
          </svg>
          <div className="d-flex justify-content-between fs-8 text-500 mt-1">
            <span>{fmtDate(points[0].date)}</span>
            <span>{fmtDate(points[n - 1].date)}</span>
          </div>
        </>
      )}
    </div>
  );
}
