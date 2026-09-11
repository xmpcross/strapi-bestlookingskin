import Link from 'next/link';
import type { SidebarRow } from '@/components/ArticleSidebar';

/**
 * "Read Also" card, placed inside the article body.
 *
 * The reference shows a comment count beside each date. Not rendered:
 * bls-post has no comments relation, so every one of them would read "0" or be
 * invented. A count that is always zero is worse than no count -- it advertises
 * that nobody is reading.
 */
export default function ReadAlso({ rows, title = 'Read Also' }: { rows: SidebarRow[]; title?: string }) {
  const items = rows.filter((r) => r.img).slice(0, 2);
  if (items.length < 2) return null;

  return (
    <aside className="my-10 rounded-2xl border border-ink/10 bg-paper p-6" data-testid="read-also">
      <p className="font-display !text-[17px] font-bold text-ink">{title}</p>
      <ul className="mt-5 space-y-5">
        {items.map((row) => (
          <li key={row.href}>
            <Link href={row.href} className="group flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={row.img as string}
                alt={row.title}
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
                loading="lazy"
              />
              <span className="min-w-0">
                <span className="block font-display !text-[15px] font-bold leading-snug text-ink transition group-hover:text-primary">
                  {row.title}
                </span>
                {row.date && <span className="mt-1 block text-[13px] text-ink/50">{row.date}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
