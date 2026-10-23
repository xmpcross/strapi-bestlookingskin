import Link from 'next/link';
import { SITE } from '@/lib/site';
import { b } from '@/lib/blush';
import { Icon } from './Icon';
import { CategoryTag } from './cards';

/** Breadcrumb trail with BreadcrumbList structured data. The last crumb is the current page. */
export function Crumbs({ items }: { items: { label: string; href?: string }[] }) {
  const all = [{ label: 'Home', href: '/' }, ...items];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, ...(c.href ? { item: `${SITE.url}${c.href === '/' ? '' : c.href}` } : {}) })),
  };
  return (
    <nav aria-label="Breadcrumb" data-testid="breadcrumb" className="bl-crumbs">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ol>
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={`${c.label}-${i}`} aria-current={last ? 'page' : undefined}>
              {i > 0 && <Icon name="arrow-right" size={12} className="bl-crumbs__sep" />}
              {last || !c.href ? <span>{c.label}</span> : <Link href={c.href}>{c.label}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

/** The article's title block: tag, headline, standfirst, byline with date and read time. */
export function ArticleTitle({
  title,
  excerpt,
  category,
  author,
  publishedAt,
  dateLabel,
  minutes,
}: {
  title: string;
  excerpt?: string;
  category: { name: string; href: string };
  author: { name: string; slug: string; avatarUrl?: string } | null;
  publishedAt: string;
  dateLabel: string;
  minutes: number | null;
}) {
  return (
    <div className={b('posthero__head opener')}>
      <div className={b('chip-row')}>
        <CategoryTag category={category} />
      </div>
      <h1 className={b('txt-h1')}>{title}</h1>
      {excerpt && <p className={b('txt-l txt-dim posthero__standfirst')}>{excerpt}</p>}
      <div className={b('meta meta--inline posthero__byline')}>
        {author && (
          <span className={b('meta__byline')}>
            <span className={b('avatar-stack')}>
              <span
                className={b('avatar avatar--md')}
                aria-hidden="true"
                style={author.avatarUrl ? { backgroundImage: `url("${author.avatarUrl}")` } : undefined}
              >
                {!author.avatarUrl && initials(author.name)}
              </span>
            </span>
            <span className={b('meta__conjunction')}>By</span>
            <Link className={b('meta__author')} href={`/authors/${author.slug}`}>
              {author.name}
            </Link>
          </span>
        )}
        {author && <span className={b('meta__rule posthero__bylineRule')} aria-hidden="true" />}
        <span className={b('posthero__facts')}>
          <span className={b('meta__fact')}>
            <Icon name="calendar" size={14} />
            <time dateTime={publishedAt}>{dateLabel}</time>
          </span>
          {minutes ? (
            <>
              <span className={b('meta__rule')} aria-hidden="true" />
              <span className={b('meta__fact')}>
                <Icon name="clock" size={14} />
                {minutes} min read
              </span>
            </>
          ) : null}
        </span>
      </div>
    </div>
  );
}

/** The cover, in a section of its own between the title and the columns. */
export function CoverBar({ src, alt }: { src: string; alt: string }) {
  return (
    <section className={b('post-coverbar')} aria-label="Cover image">
      <div className={b('container')}>
        <header className={b('posthero')}>
          <figure className={b('container-reading posthero__figure')}>
            <div className={b('media media--photo')}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={alt} width={1366} height={700} fetchPriority="high" decoding="async" />
            </div>
          </figure>
        </header>
      </div>
    </section>
  );
}

export type SideRow = { href: string; title: string; img: string | null; date: string };

/** The article's right-hand list: the newest guides, a thumbnail beside a two-line headline and its date. */
export function LatestSide({ rows, title = 'Latest guides' }: { rows: SideRow[]; title?: string }) {
  if (!rows.length) return null;
  return (
    <section className={b('latest-side')} aria-labelledby="bl-latest-side-title">
      <h2 className={b('txt-h4 latest-side__title')} id="bl-latest-side-title">
        {title}
      </h2>
      <ul className={b('latest-side__list')}>
        {rows.map((row) => (
          <li key={row.href} className={b('latest-side__item')}>
            <Link className={b('latest-side__link')} href={row.href}>
              <span className={b('latest-side__thumb')}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {row.img && <img src={row.img} alt="" width={160} height={120} loading="lazy" decoding="async" />}
              </span>
              <span className={b('latest-side__body')}>
                <span className={b('latest-side__name line-clamp-2')}>{row.title}</span>
                <span className={b('label txt-dim')}>{row.date}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
