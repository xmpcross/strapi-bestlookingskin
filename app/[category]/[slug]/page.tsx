import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import '../../article.css';
import { getPost, listPostSummaries, listProductsForPost, getAdjacentPosts, mediaUrl, type BlsPostSummary } from '@/lib/strapi';
import { SECTIONS, SITE } from '@/lib/site';
import { fmtDate, primaryCategorySlug, postPath } from '@/lib/format';
import { withHeadingIds, decodeEntities } from '@/lib/toc';
import { getTopicGroups } from '@/lib/nav';
import { toCard } from '@/lib/post-card';
import PostContent from '@/components/PostContent';
import ArticleContents from '@/components/ArticleContents';
import ShareRail from '@/components/ShareRail';
import ReadingRail from '@/components/ReadingRail';
import AuthorAvatar from '@/components/AuthorAvatar';
import PullQuote from '@/components/PullQuote';
import ReadAlso from '@/components/ReadAlso';
import InlineProducts from '@/components/InlineProducts';
import PostFooterNav from '@/components/PostFooterNav';
import CommentForm from '@/components/CommentForm';
import Breadcrumb from '@/components/magzin/Breadcrumb';
import { TileCard } from '@/components/magzin/cards';

export const revalidate = 60;
export const dynamicParams = true;

type Params = { category: string; slug: string };

function categoryName(slug?: string): string {
  if (!slug) return '';
  return SECTIONS.find((s) => s.slug === slug)?.title ?? slug.replace(/-/g, ' ');
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, category } = await params;
  const post = await getPost(slug).catch(() => null);
  if (!post) return { title: 'Not found' };

  const cover = mediaUrl(post.coverImage ?? null) || mediaUrl(post.ogImage ?? null);
  const description = post.seoDescription || post.excerpt || SITE.description;

  return {
    title: post.seoTitle || post.title,
    description,
    keywords: post.seoKeywords,
    alternates: { canonical: `/${category}/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.seoTitle || post.title,
      description,
      url: `${SITE.url}/${category}/${post.slug}`,
      images: cover ? [{ url: cover }] : undefined,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
    twitter: {
      card: cover ? 'summary_large_image' : 'summary',
      title: post.seoTitle || post.title,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { slug, category } = await params;
  const post = await getPost(slug).catch(() => null);
  if (!post) notFound();

  // If the URL category doesn't match the post's primary category, send them to the canonical URL.
  const canonicalCat = primaryCategorySlug(post);
  if (canonicalCat !== category) {
    const { redirect } = await import('next/navigation');
    redirect(postPath(post));
  }

  // Related posts (same category, excluding this one), recent guides across the site, and the topic hubs.
  const [related, recentPosts, topicGroups] = await Promise.all([
    listPostSummaries({ category, pageSize: 9, withCover: true })
      .then((r) => r.data.filter((p) => p.id !== post.id).slice(0, 8))
      .catch(() => [] as BlsPostSummary[]),
    listPostSummaries({ pageSize: 6, authored: true, withCover: true })
      .then((r) => r.data.filter((p) => p.id !== post.id).slice(0, 5))
      .catch(() => [] as BlsPostSummary[]),
    getTopicGroups(),
  ]);

  const toRow = (p: BlsPostSummary) => ({
    href: postPath(p),
    title: p.title,
    date: fmtDate(p.publishedAt),
    img: mediaUrl(p.coverImage ?? null),
    minutes: p.author ? p.readingTimeMinutes : null,
  });
  const recentRows = recentPosts.map(toRow);
  const topics = topicGroups.flatMap((g) => g.items).filter((t) => t.href !== `/${category}`);

  const cover = mediaUrl(post.coverImage ?? null);
  const cat = post.categories?.[0];

  // Strip <em> / </em> tags from the post body — text content is kept, only
  // the wrapping element is removed (so italic emphasis no longer renders).
  // \b avoids matching <embed>; [^>]* handles any attributes.
  const postBodyRaw = (post.content ?? '')
    // Collapse "<wbr>/<wbr>" sequences to a single "<wbr>" (drops the slash).
    .replace(/<wbr\s*\/?>\s*\/\s*<wbr\s*\/?>/gi, '<wbr>')
    .replace(/<\/?em\b[^>]*>/gi, '')
    // Remove the WordPress "more" marker (id="more-14899"). Matched generically
    // by the id with a backreferenced close tag (<span id="more-14899"></span>,
    // <p id="more-14899"></p>, etc.). Done before the empty-paragraph strip so a
    // <p> that only wrapped this marker collapses to <p></p> and is dropped too.
    .replace(/<(\w+)\b[^>]*\bid=["']?more-14899["']?[^>]*>\s*<\/\1>/gi, '')
    // Drop empty paragraphs — those whose only content is whitespace,
    // &nbsp;/&#160; or <br> tags (common artifacts from the WordPress import).
    // This also removes the empty <p></p> immediately above and below the
    // removed marker.
    .replace(/<p\b[^>]*>(?:\s|&nbsp;|&#160;|<br\s*\/?>)*<\/p>/gi, '')
    ;

  /*
   * Promote heading levels only for bodies that start at h3.
   *
   * The imported WordPress posts open their sections at h3, because the old
   * theme used h2 for the article title -- so those need shifting up to read as
   * a sensible outline. Generated posts already use h2 for sections and h3 for
   * subsections. Running the shift over those flattened every h3 into an h2:
   * best-oil-free-moisturizer went from 8 h2 + 20 h3 to 28 h2 and no
   * subheadings at all, on every one of the 75 planned posts.
   *
   * So the shift is now conditional on the body containing no h2 of its own.
   */
  const bodyStartsAtH3 = !/<h2\b/i.test(postBodyRaw);
  const postBodyHtml = bodyStartsAtH3
    ? postBodyRaw.replace(/<(\/?)(h3|h4|h5)(\b[^>]*)>/gi, (_m, slash, tag, rest) => {
        const map: Record<string, string> = { h3: 'h2', h4: 'h3', h5: 'h4' };
        return `<${slash}${map[tag.toLowerCase()]}${rest}>`;
      })
    : postBodyRaw;

  /* Ids and the contents list come from one pass, so the rail's anchors and the
     body's headings cannot drift apart. Done before the split, or headings in
     the second half would be numbered as if the first half did not exist. */
  const { html: bodyWithIds, toc } = withHeadingIds(postBodyHtml);

  /* Split the body at two heading boundaries, giving three parts, so the
     in-article blocks land between sections rather than inside one. Headings
     are preferred over paragraph ends because a block dropped mid-argument
     reads as an interruption; falls back to a paragraph end so HTML is never
     cut open. */
  const [bodyFirst, bodySecond] = (() => {
    const html = bodyWithIds;
    if (html.length < 600) return [html, ''] as const;
    const mid = Math.floor(html.length / 2);
    const nearest = (positions: number[]) =>
      positions.reduce((best, i) => (Math.abs(i - mid) < Math.abs(best - mid) ? i : best), -1);
    let cut = nearest([...html.matchAll(/<h[23]\b/gi)].map((m) => m.index ?? -1).filter((i) => i > 0));
    if (cut < 0 || Math.abs(cut - mid) > html.length * 0.35) {
      cut = nearest([...html.matchAll(/<\/p>/gi)].map((m) => (m.index ?? -1) + 4).filter((i) => i > 0));
    }
    return cut > 0 ? ([html.slice(0, cut), html.slice(cut)] as const) : ([html, ''] as const);
  })();

  /* Gallery images, excluding anything that duplicates the cover. */
  const galleryImages = (post.gallery ?? [])
    .map((g) => mediaUrl(g))
    .filter((url): url is string => Boolean(url) && url !== cover);

  /* A sentence from the article, set as a pull quote. Its own words, so nothing
     is attributed to anyone -- see PullQuote. Picked from the longer sentences
     in the first half, where a highlight still earns its place. */
  const pullQuote = (() => {
    /* Headings are dropped before the text is flattened. Stripping tags alone
       glues a heading onto the sentence that follows it -- the first run
       produced "Combination Skin Combination skin - oily through the T-zone
       ...", which reads as a transcription error. */
    const prose = bodyFirst
      .replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, ' ')
      .replace(/<(figure|figcaption|table)[\s\S]*?<\/\1>/gi, ' ');
    /* Decoded, not deleted: the earlier pass replaced entities with a space,
       which silently dropped every quotation mark and apostrophe out of the
       pull quote. */
    const text = decodeEntities(prose.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
    const sentences = text.split(/(?<=[.!?])\s+/).filter((t) => t.length >= 80 && t.length <= 190);
    return sentences.length ? sentences[Math.floor(sentences.length / 2)].trim() : '';
  })();

  /* Products from this post's hub, and two more articles to read. Both come
     from data the site already holds, so neither costs a request to a paid API
     at render time. */
  const inlineProducts = await listProductsForPost(post.title, category, 3).catch(() => []);
  const readAlsoRows = recentRows.filter((r) => r.href !== postPath(post)).slice(0, 2);

  /* Read Also goes after the fourth paragraph rather than at the end of the
     article: by then the reader has committed, and a related link is a next
     step instead of an interruption. Split on a paragraph close, so the cut is
     always between elements and never inside one. */
  const [bodyIntro, bodyAfterIntro] = (() => {
    const closes = [...bodyFirst.matchAll(/<\/p>/gi)].map((m) => (m.index ?? 0) + m[0].length);
    if (closes.length < 5) return [bodyFirst, ''] as const;
    const cut = closes[3];
    return [bodyFirst.slice(0, cut), bodyFirst.slice(cut)] as const;
  })();

  /* The contents box goes after the first paragraph (on Tier A posts, the direct-answer paragraph). */
  const [bodyLead, bodyIntroRest] = (() => {
    /* Only a top-level paragraph: cutting inside an imported WordPress block (div, table, list…) would split
       its markup across two renders. Walk the block tags and stop at the first </p> at depth 0. */
    let depth = 0;
    for (const m of bodyIntro.matchAll(/<(\/?)(div|section|article|table|figure|ul|ol|blockquote|details|aside)\b[^>]*>|<\/p>/gi)) {
      if (m[0].toLowerCase() === '</p>') {
        if (depth === 0) {
          const cut = (m.index ?? 0) + 4;
          return [bodyIntro.slice(0, cut), bodyIntro.slice(cut)] as const;
        }
      } else if (!m[0].endsWith('/>')) {
        depth += m[1] ? -1 : 1;
      }
    }
    return ['', bodyIntro] as const;
  })();

  /* The FAQ is the last section of every one of these posts, so anything
     rendered after the body lands underneath it. Split it off, and the second
     gallery image can sit in the article where it belongs rather than stranded
     below a list of questions. */
  const [bodyBeforeFaq, faqSection] = (() => {
    const m = bodySecond.match(/<h[23]\b[^>]*>(?:(?!<\/h[23]>).)*(?:FAQ|Frequently\s+Asked)(?:(?!<\/h[23]>).)*<\/h[23]>/i);
    if (!m || m.index === undefined) return [bodySecond, ''] as const;
    return [bodySecond.slice(0, m.index), bodySecond.slice(m.index)] as const;
  })();

  /* Two paragraphs held back so the products block is never flush against the
     right-floated image: text sits above it and below it. Asked for as "move it
     up 2 paragraphs", and the split is on a paragraph close so the cut lands
     between elements. */
  const [bodyMid, bodyBeforeImage] = (() => {
    const closes = [...bodyAfterIntro.matchAll(/<\/p>/gi)].map((m) => (m.index ?? 0) + m[0].length);
    if (closes.length < 3) return [bodyAfterIntro, ''] as const;
    const cut = closes[closes.length - 3];
    return [bodyAfterIntro.slice(0, cut), bodyAfterIntro.slice(cut)] as const;
  })();

  const { prev: prevPost, next: nextPost } = await getAdjacentPosts(category, slug);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': post.postType === 'product-review' ? 'Review' : 'Article',
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: cover ? [cover] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    /* A named author is one of the things reviewers and search engines look for
       on affiliate content; without it an Article carries a publisher and no
       human behind it. */
    author: post.author
      ? { '@type': 'Person', name: post.author.name, url: `${SITE.url}/authors/${post.author.slug}` }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
    },
    mainEntityOfPage: `${SITE.url}/${category}/${post.slug}`,
  };

  const catName = cat?.name ?? categoryName(category);
  const figure = (i: 0 | 1, side: 'start' | 'end') =>
    galleryImages[i] ? (
      <figure className={`post-figure post-figure-${side}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={galleryImages[i]} alt={post.gallery?.[i]?.alternativeText || post.title} className="rounded-8 w-100" loading="lazy" />
        {post.gallery?.[i]?.alternativeText && <figcaption className="fs-8 text-600 mt-2">{post.gallery[i].alternativeText}</figcaption>}
      </figure>
    ) : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {/* Vendor stylesheets used by the imported product-comparison blocks (Content Egg + scoped Bootstrap,
          both scoped under .cegg5-container). Loaded for this article only. */}
      {slug === 'cerave-acne-gel-differin-gel-30-day-comparison' && (
        <>
          <link rel="stylesheet" href="/vendor/cegg-bootstrap.min.css" />
          <link rel="stylesheet" href="/vendor/cegg-products.min.css" />
        </>
      )}

      <article className="sec-1-single-3 pb-70" data-testid={`post-${post.slug}`} data-category={category} data-post-type={post.postType}>
        {/* Top section in two columns, 40% / 60%: title and description on the left, the featured image on the right. */}
        <div className="position-relative block-banner">
          <div className="container">
            <Breadcrumb items={[{ label: catName, href: `/${category}` }, { label: post.title }]} />
            <div className="row g-5 align-items-center post-hero-row">
              <div className={cover ? 'col-12 post-hero-text' : 'col-lg-8'}>
                <div className="card-title post-hero">
                  <div className="article card-info d-flex flex-wrap align-items-center gap-2 mt-2">
                    <Link href={`/${category}`} className={`badge ${toCard(post).badgeTone} fs-8`}>
                      {catName}
                    </Link>
                    {post.postType && post.postType !== 'other' && <span className="badge bg-100 fs-8 text-capitalize">{post.postType.replace(/-/g, ' ')}</span>}
                    {post.author && post.readingTimeMinutes ? (
                      <ul className="d-flex align-items-center text-600 m-0 ps-3">
                        <li>
                          <p className="fs-8 m-0">{post.readingTimeMinutes} min read</p>
                        </li>
                      </ul>
                    ) : null}
                  </div>
                  <h1 className="h3 mt-4 mb-0">{post.title}</h1>
                  {post.excerpt && <p className="post-standfirst text-600 mt-3 mb-0">{post.excerpt}</p>}
                  {/* Byline under the description (moved from above the H1 at the owner's request). */}
                  <div className="d-flex flex-wrap align-items-center gap-2 pt-4">
                    {post.author && (
                      <Link href={`/authors/${post.author.slug}`} className="author d-flex align-items-center gap-2">
                        <AuthorAvatar name={post.author.name} src={post.author.avatarUrl} size={36} />
                        <span className="fs-7 text-dark fw-regular">{post.author.name}</span>
                      </Link>
                    )}
                    <ul className="d-flex align-items-center gap-4 text-600 m-0 ps-3">
                      <li>
                        <time className="fs-8" dateTime={post.publishedAt}>
                          {fmtDate(post.publishedAt)}
                        </time>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              {cover && (
                <div className="col-12 post-hero-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="rounded-16 w-100 cover-image post-cover" src={cover} alt={post.coverImage?.alternativeText || post.title} width={660} height={495} fetchPriority="high" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="container">
          {/* Three columns from lg up: share rail, article, sidebar. Widths adjust in app/magzin.css (.post-layout). */}
          <div className="post-layout mt-4">
            <div className="post-layout-rail d-none d-lg-block">
              <div className="post-sticky">
                <ShareRail url={`${SITE.url}/${category}/${post.slug}`} title={post.title} minutes={post.author ? post.readingTimeMinutes : null} />
              </div>
            </div>
            <div className="post-layout-main">
              {/* Disclosure above the article, not after it. */}
              <p className="affiliate-note fs-7 text-600 px-3 py-2 mb-4">
                <strong className="text-dark">Heads up:</strong> when you buy through links on this page we may earn a commission, at no extra cost to you. It never changes which products
                we recommend or what we say about them. <Link href="/legal/disclosure" className="text-dark text-decoration-underline">Read our full disclosure</Link>.
              </p>

              <div id="article-body" className="post-body">
                {bodyLead && <PostContent html={bodyLead} />}
                <ArticleContents toc={toc} />
                {bodyIntroRest && <PostContent html={bodyIntroRest} />}
                {figure(0, 'start')}
                {readAlsoRows.length === 2 && <ReadAlso rows={readAlsoRows} />}
                {bodyMid && <PostContent html={bodyMid} />}
                {inlineProducts.length >= 2 && <InlineProducts products={inlineProducts} />}
                {bodyBeforeImage && <PostContent html={bodyBeforeImage} />}
                {figure(1, 'end')}
                {pullQuote && <PullQuote text={pullQuote} />}
                {bodyBeforeFaq ? <PostContent html={bodyBeforeFaq} /> : null}
                {faqSection && <PostContent html={faqSection} />}
              </div>

              <PostFooterNav
                title={post.title}
                url={`${SITE.url}/${category}/${post.slug}`}
                tags={[{ label: catName, href: `/${category}` }, ...(post.postType && post.postType !== 'other' ? [{ label: post.postType.replace(/-/g, ' ') }] : [])]}
                prev={prevPost}
                next={nextPost}
              >
                {post.author?.bio && (
                  <div className="author-card d-flex flex-column flex-sm-row gap-4 mt-5" data-testid="author-card">
                    <AuthorAvatar name={post.author.name} src={post.author.avatarUrl} size={96} shape="square" />
                    <div>
                      <p className="h5 mb-2">
                        <Link href={`/authors/${post.author.slug}`}>{post.author.name}</Link>
                      </p>
                      <p className="fs-7 text-600 mb-3">{post.author.bio}</p>
                      {/* bls-author has name, slug, bio and avatarUrl only: no social profiles to link. */}
                      <Link href={`/authors/${post.author.slug}`} className="fs-7 text-dark text-decoration-underline">
                        More from {post.author.name}
                      </Link>
                    </div>
                  </div>
                )}
              </PostFooterNav>

              <CommentForm postTitle={post.title} postUrl={`${SITE.url}/${category}/${post.slug}`} />
            </div>

            <aside className="post-layout-side" aria-label="Article sidebar">
              {recentRows.length > 0 && (
                <div className="mb-5">
                  {/* Magzin "Weekly trending" block (card-10 style-2). Headed "Latest guides": the list is the newest
                      guides, and the site has no traffic data to call anything trending. */}
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <svg className="dark-mode-invert" xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M0.582044 11.7285C8.79451 13.4712 10.252 14.8614 12.125 22.7372C13.8067 14.8768 15.2308 13.4992 23.4018 11.8279C15.1894 10.0852 13.7319 8.69503 11.8589 0.81924C10.1769 8.67956 8.75306 10.0571 0.582044 11.7285Z" fill="#0E0E0F" />
                    </svg>
                    <h2 className="h5 mb-0 sidebar-heading">Latest guides</h2>
                  </div>
                  <div className="d-flex flex-column gap-3">
                    {recentRows.slice(0, 3).map((row) => (
                      <div className="article card-10 style-2 sidebar-trending" key={row.href}>
                        <Link href={row.href} className="card-img">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {row.img ? <img className="w-100" src={row.img} alt="" width={108} height={83} loading="lazy" /> : null}
                        </Link>
                        <div className="card-body">
                          <Link href={row.href}>
                            <span className="h6 fs-6 mb-2 text-truncate-2">{row.title}</span>
                          </Link>
                          <div className="d-flex align-items-center text-600">
                            <span className="fs-8">{row.date}</span>
                            {row.minutes ? (
                              <ul className="ps-4 m-0">
                                <li>
                                  <span className="fs-8">{row.minutes} min read</span>
                                </li>
                              </ul>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {topics.length > 0 && (
                <div className="mb-5">
                  <h2 className="h5 mb-3">Topics</h2>
                  <ul className="list-unstyled d-flex flex-wrap gap-2 ps-0">
                    {topics.map((t) => (
                      <li key={t.href}>
                        <Link href={t.href} className="tag-item">
                          <span>{t.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="post-sticky">
                <ReadingRail minutes={post.author ? post.readingTimeMinutes : null} toc={toc} />
              </div>
            </aside>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="related-post sec-padding bg-white" data-testid="more-in-category">
          <div className="container">
            <div className="row g-4">
              <div className="col-12">
                <h2 className="h5 mb-0">More in {catName}</h2>
              </div>
              {related.map((p) => (
                <div className="col-6 col-md-4 col-lg-3" key={p.id}>
                  <TileCard card={toCard(p)} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
