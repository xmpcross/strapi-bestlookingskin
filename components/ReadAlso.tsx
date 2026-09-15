import Link from 'next/link';

export type ReadAlsoRow = { href: string; title: string; date?: string; img?: string | null };

/**
 * "Read also" box inside the article body (Magzin card-10 rows).
 *
 * No comment counts: bls-post has no comments relation, so every one would read "0" or be invented.
 */
export default function ReadAlso({ rows, title = 'Read also' }: { rows: ReadAlsoRow[]; title?: string }) {
  const items = rows.filter((r) => r.img).slice(0, 2);
  if (items.length < 2) return null;
  return (
    <aside className="read-also rounded-16 p-4 my-5" data-testid="read-also">
      <p className="h6 mb-3">{title}</p>
      <div className="d-flex flex-column flex-md-row gap-3">
        {items.map((row) => (
          <div className="article card-10 style-1 flex-fill" key={row.href}>
            <Link href={row.href} className="card-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="w-100 rounded-8" src={row.img as string} alt="" loading="lazy" width={80} height={80} />
            </Link>
            <div className="card-body">
              <Link href={row.href}>
                <span className="h6 fs-6 mb-2 text-truncate-2 d-block">{row.title}</span>
              </Link>
              {row.date && <span className="fs-8 text-600">{row.date}</span>}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
