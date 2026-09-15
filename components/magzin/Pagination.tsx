import Link from 'next/link';

const Arrow = ({ dir }: { dir: 'prev' | 'next' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} viewBox="0 0 22 22" fill="none" aria-hidden>
    {dir === 'prev' ? (
      <>
        <path d="M9.49993 6.5L4.78564 11L9.49993 15.5" stroke="#0E0E0F" strokeWidth="1.28571" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17.2143 11H5" stroke="#0E0E0F" strokeWidth="1.28571" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ) : (
      <>
        <path d="M12.5 6.5L17.2143 11L12.5 15.5" stroke="#0E0E0F" strokeWidth="1.28571" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16.9999 11H4.78564" stroke="#0E0E0F" strokeWidth="1.28571" strokeLinecap="round" strokeLinejoin="round" />
      </>
    )}
  </svg>
);

/* Server-rendered numbered pagination (Magzin style). Page 1 links to the bare path. */
export default function Pagination({ basePath, page, pageCount, query = '' }: { basePath: string; page: number; pageCount: number; query?: string }) {
  if (pageCount <= 1) return null;
  /* `query` carries other listing parameters (e.g. "topics=a,b") onto every page link. */
  const href = (n: number) => {
    const qs = [query, n > 1 ? `page=${n}` : ''].filter(Boolean).join('&');
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const items: (number | '…')[] = [];
  for (let n = 1; n <= pageCount; n++) {
    if (n === 1 || n === pageCount || Math.abs(n - page) <= 1) items.push(n);
    else if (items.at(-1) !== '…') items.push('…');
  }
  return (
    <nav aria-label="Pages">
      <ul className="pagination gap-2">
        {page > 1 && (
          <li className="page-item">
            <Link href={href(page - 1)} className="page-link icon-lg pagination_item rounded-circle icon-shape" aria-label="Previous page" rel="prev">
              <Arrow dir="prev" />
            </Link>
          </li>
        )}
        {items.map((n, i) =>
          n === '…' ? (
            <li key={`gap-${i}`} className="page-item disabled">
              <span className="icon-lg pagination_item rounded-circle icon-shape fs-18 fw-semi-bold">…</span>
            </li>
          ) : (
            <li key={n} className={`page-item ${n === page ? 'active' : ''}`}>
              <Link href={href(n)} className="page-link icon-lg pagination_item rounded-circle icon-shape fs-18 fw-semi-bold" aria-current={n === page ? 'page' : undefined}>
                {n}
              </Link>
            </li>
          ),
        )}
        {page < pageCount && (
          <li className="page-item">
            <Link href={href(page + 1)} className="page-link icon-lg pagination_item rounded-circle icon-shape" aria-label="Next page" rel="next">
              <Arrow dir="next" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
