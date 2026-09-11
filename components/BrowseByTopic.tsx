import Link from 'next/link';

export type TopicRow = { slug: string; name: string; count: number; href?: string };

/**
 * "Browse by topic" sidebar card.
 *
 * Emoji are mapped from the category slug rather than stored on the row: they
 * are decoration, and a CMS field for them would be one more thing to fill in
 * for every new category. An unmapped category renders without one instead of
 * showing a placeholder.
 */
const EMOJI: Record<string, string> = {
  // Product categories
  'facial-cleansers': '🧼',
  'facial-serums': '💧',
  'moisturisers': '🧴',
  'anti-aging': '⏳',
  'toners-and-astringents': '🌿',
  'exfoliators-and-scrubs': '✨',
  // Post format buckets
  'product-comparisons': '⚖️',
  'product-reviews': '⭐',
  'top-rated-products': '🏆',
  'how-to-guides': '🛠️',
  'informative-articles': '📘',
  // Topic hubs
  sunscreen: '☀️',
  serums: '💧',
  moisturizers: '🧴',
  cleansers: '🧼',
  'eye-cream': '👁️',
  exfoliants: '✨',
  'face-masks': '🎭',
  acne: '🔬',
  hyperpigmentation: '🌗',
  'sensitive-skin': '🌸',
  routines: '🗓️',
  ingredients: '🧪',
  dupes: '💸',
  'korean-skincare': '🇰🇷',
};

export default function BrowseByTopic({
  rows,
  title = 'Browse by topic',
  basePath = '/categories',
  maxHeight,
}: {
  rows: TopicRow[];
  title?: string;
  basePath?: string;
  /** Cap the list and scroll past it. The heading stays put. */
  maxHeight?: number;
}) {
  if (!rows.length) return null;
  /* Unique per instance: a post page can show this twice (topics and formats)
     and duplicate ids break the aria-labelledby association. */
  const headingId = `browse-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-xl border border-ink/10 bg-paper p-5"
      data-testid="browse-by-topic"
    >
      <h3
        id={headingId}
        className="flex items-center gap-2 pb-3 font-display !text-base font-bold text-ink"
      >
        <span aria-hidden className="text-primary">✦</span>
        {title}
      </h3>

      <div aria-hidden className="mb-2 h-px w-full bg-ink/10" />

      <ul
        className={`flex flex-col gap-1${maxHeight ? ' overflow-y-auto pr-1' : ''}`}
        style={maxHeight ? { maxHeight } : undefined}
      >
        {rows.map((row) => (
          <li key={row.slug}>
            <Link
              href={row.href ?? `${basePath}/${row.slug}`}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm text-ink/75 transition hover:bg-muted hover:text-primary"
            >
              <span className="flex min-w-0 items-center gap-2">
                {EMOJI[row.slug] && <span aria-hidden>{EMOJI[row.slug]}</span>}
                <span className="truncate">{row.name}</span>
              </span>
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-ink/50">
                {row.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
