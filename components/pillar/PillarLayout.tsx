import Link from 'next/link';
import PostContent from '@/components/PostContent';
import AuthorAvatar from '@/components/AuthorAvatar';
import ShareRail from '@/components/ShareRail';
import Breadcrumb from '@/components/magzin/Breadcrumb';
import { RowCard, TextCard } from '@/components/magzin/cards';
import type { PostCardData } from '@/lib/post-card';
import ChapterNav from './ChapterNav';

export type PillarChapter = { id: string; text: string; html: string };

/**
 * Pillar page ("complete guide") template, used for posts whose post type is `pillar`.
 *
 * Top to bottom: a hero (breadcrumb, category, title, standfirst, byline with updated date, read time and chapter
 * count, cover); an "In this guide" overview of numbered chapters; the guide itself beside a sticky chapter
 * navigation, each h2 section a numbered chapter, the FAQ as a card; the author box; "Explore <hub>" with the
 * hub's other guides (the cluster this pillar sits over); and more guides from other topics.
 *
 * Everything shown comes from the post and the CMS: chapters are the article's own h2 sections, the overview
 * lists their titles, nothing is summarised or invented.
 */
export default function PillarLayout({
  title,
  excerpt,
  cover,
  coverAlt,
  category,
  author,
  publishedLabel,
  updatedAt,
  updatedLabel,
  readMinutes,
  introHtml,
  chapters,
  faqHtml,
  faqId,
  cluster,
  moreGuides,
  url,
}: {
  title: string;
  excerpt?: string;
  cover: string | null;
  coverAlt: string;
  category: { name: string; href: string };
  author: { name: string; slug: string; avatarUrl?: string; bio?: string } | null;
  publishedLabel: string;
  updatedAt: string;
  updatedLabel: string;
  readMinutes: number | null;
  introHtml: string;
  chapters: PillarChapter[];
  faqHtml: string;
  faqId: string | null;
  cluster: PostCardData[];
  moreGuides: PostCardData[];
  url: string;
}) {
  return (
    <article className="pillar" data-testid="pillar-page">
      <header className="pillar-hero">
        <div className="container">
          <Breadcrumb items={[{ label: category.name, href: category.href }, { label: title }]} />
          <div className="pillar-hero-grid">
            <div className="pillar-hero-text">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <span className="pillar-eyebrow">Complete guide</span>
                <Link href={category.href} className="pillar-chip">
                  {category.name}
                </Link>
              </div>
              <h1 className="pillar-title">{title}</h1>
              {excerpt && <p className="pillar-standfirst">{excerpt}</p>}
              <div className="pillar-meta">
                {author && (
                  <Link href={`/authors/${author.slug}`} className="pillar-meta-author">
                    <AuthorAvatar name={author.name} src={author.avatarUrl} size={40} />
                    <span>
                      <span className="pillar-meta-label">Written by</span>
                      <span className="pillar-meta-name">{author.name}</span>
                    </span>
                  </Link>
                )}
                <ul className="pillar-meta-facts">
                  <li>
                    <span className="pillar-meta-label">Updated</span>
                    <time dateTime={updatedAt}>{updatedLabel}</time>
                  </li>
                  {readMinutes ? (
                    <li>
                      <span className="pillar-meta-label">Reading time</span>
                      <span>{readMinutes} min</span>
                    </li>
                  ) : null}
                  {chapters.length > 0 && (
                    <li>
                      <span className="pillar-meta-label">Chapters</span>
                      <span>{chapters.length}</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
            {cover && (
              <div className="pillar-hero-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover} alt={coverAlt} width={1280} height={720} fetchPriority="high" />
              </div>
            )}
          </div>

          {chapters.length > 1 && (
            <nav className="pillar-overview" aria-labelledby="pillar-overview-title">
              <p id="pillar-overview-title" className="pillar-overview-title">
                In this guide
              </p>
              <ol>
                {chapters.map((c, i) => (
                  <li key={c.id}>
                    <a href={`#${c.id}`}>
                      <span className="pillar-overview-num">{String(i + 1).padStart(2, '0')}</span>
                      <span>{c.text}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>
      </header>

      <div className="container">
        <div className="pillar-layout">
          <aside className="pillar-aside d-none d-lg-block" aria-label="Guide navigation">
            <div className="pillar-sticky">
              {chapters.length > 1 && <ChapterNav chapters={chapters.map(({ id, text }) => ({ id, text }))} faqId={faqId} />}
              <div className="pillar-share">
                <ShareRail url={url} title={title} />
              </div>
            </div>
          </aside>

          <div className="pillar-main">
            <p className="affiliate-note fs-7 text-600 px-3 py-2 mb-4">
              <strong className="text-dark">Heads up:</strong> when you buy through links on this page we may earn a commission, at no extra cost to you. It never changes which products
              we recommend or what we say about them. <Link href="/legal/disclosure" className="text-dark text-decoration-underline">Read our full disclosure</Link>.
            </p>

            <div id="pillar-body" className="pillar-body">
              {introHtml.trim() && (
                <div className="pillar-intro">
                  <PostContent html={introHtml} />
                </div>
              )}
              {chapters.map((c, i) => (
                <section key={c.id} className="pillar-chapter" aria-labelledby={c.id}>
                  <span className="pillar-chapter-label">Chapter {String(i + 1).padStart(2, '0')}</span>
                  <PostContent html={c.html} />
                </section>
              ))}
              {faqHtml.trim() && (
                <section className="pillar-faq">
                  <PostContent html={faqHtml} />
                </section>
              )}
            </div>

            {author && (
              <aside className="pillar-author" aria-label="About the author">
                <AuthorAvatar name={author.name} src={author.avatarUrl} size={64} />
                <div>
                  <p className="pillar-meta-label mb-1">About the author</p>
                  <Link href={`/authors/${author.slug}`} className="pillar-author-name">
                    {author.name}
                  </Link>
                  {author.bio && <p className="pillar-author-bio">{author.bio}</p>}
                  <p className="pillar-author-dates">
                    Published {publishedLabel} · Updated {updatedLabel}
                  </p>
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>

      {cluster.length > 0 && (
        <section className="pillar-cluster" aria-labelledby="pillar-cluster-title">
          <div className="container">
            <div className="pillar-section-head">
              <div>
                <p className="pillar-eyebrow">Keep going</p>
                <h2 id="pillar-cluster-title" className="pillar-section-title">
                  Explore {category.name}
                </h2>
              </div>
              <Link href={category.href} className="pillar-section-link">
                All {category.name} guides
              </Link>
            </div>
            <div className="row g-4">
              {cluster.map((card) => (
                <div className="col-lg-3 col-md-6 col-12" key={card.key}>
                  <TextCard card={card} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {moreGuides.length > 0 && (
        <section className="pillar-more" aria-labelledby="pillar-more-title">
          <div className="container">
            <h2 id="pillar-more-title" className="pillar-section-title mb-4">
              More guides
            </h2>
            <div className="row g-4">
              {moreGuides.map((card) => (
                <div className="col-lg-4 col-md-6 col-12" key={card.key}>
                  <RowCard card={card} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
