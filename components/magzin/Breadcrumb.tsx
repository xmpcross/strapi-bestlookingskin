import Link from 'next/link';
import { SITE } from '@/lib/site';

/* Magzin breadcrumb with BreadcrumbList structured data. The last crumb is the current page. */
export default function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  const all = [{ label: 'Home', href: '/' }, ...items];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, ...(c.href ? { item: `${SITE.url}${c.href === '/' ? '' : c.href}` } : {}) })),
  };
  return (
    <nav aria-label="Breadcrumb" data-testid="breadcrumb">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ol className="breadcrumb list-unstyled d-flex flex-row flex-wrap gap-2 align-items-center m-0 ps-0 py-4">
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={`${c.label}-${i}`} className={`breadcrumb-item d-flex align-items-center gap-2 ${last ? 'active text-dark fs-7' : ''}`} aria-current={last ? 'page' : undefined}>
              {i > 0 && (
                <span className="icon-shape icon-xxs" aria-hidden>
                  <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 15 15" fill="none">
                    <path d="M6.125 4.5625L9.5625 7.84375L6.125 11.125" stroke="#626568" strokeWidth="0.9375" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
              {last || !c.href ? (
                <span className={last ? 'text-truncate' : 'text-600 fs-7'} style={last ? { maxWidth: '60vw' } : undefined}>
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="text-600 fs-7 hover-dark">
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
