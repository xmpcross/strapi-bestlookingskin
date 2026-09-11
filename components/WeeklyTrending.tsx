import Link from 'next/link';
import type { SidebarRow } from '@/components/ArticleSidebar';

/**
 * "Weekly trending" sidebar list — one card per post: title and date on the
 * left, square thumbnail on the right.
 *
 * The reference design puts a comment count after the date. It is not rendered:
 * bls-post has no comments relation, so any number here would be invented, and
 * a fabricated engagement figure is worse than none on a site trying to read as
 * trustworthy. Add comments in Strapi and it can go in for real.
 *
 * Replaces a Popular/Recent tab pair. Those tabs needed client state to show a
 * second list most readers never opened; this is one list and renders on the
 * server.
 */
export default function WeeklyTrending({
  rows,
  title = 'Weekly trending',
  limit = 5,
}: {
  rows: SidebarRow[];
  title?: string;
  limit?: number;
}) {
  const items = rows.slice(0, limit);
  if (!items.length) return null;

  return (
    <section aria-labelledby="weekly-trending" data-testid="weekly-trending">
      <h3
        id="weekly-trending"
        className="flex items-center gap-2 font-display !text-base font-bold text-ink"
      >
        <span aria-hidden className="text-primary">✦</span>
        {title}
      </h3>

      <ul className="mt-4 space-y-4">
        {items.map((row) => (
          <li key={row.href}>
            <Link
              href={row.href}
              className="group grid grid-cols-[minmax(0,1fr)_84px] items-center gap-4 rounded-xl border border-ink/10 bg-paper p-4 transition hover:border-ink/20 hover:shadow-sm"
            >
              <div className="min-w-0">
                <h4 className="line-clamp-2 font-display !text-[15px] font-bold leading-snug text-ink transition group-hover:text-primary">
                  {row.title}
                </h4>
                {row.date && (
                  <p className="mt-2 text-[13px] text-ink/50">{row.date}</p>
                )}
              </div>

              <div className="overflow-hidden rounded-lg bg-ink/5">
                {row.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.img}
                    alt={row.title}
                    className="aspect-square h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="aspect-square bg-gradient-to-br from-primary-hover to-primary" />
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
