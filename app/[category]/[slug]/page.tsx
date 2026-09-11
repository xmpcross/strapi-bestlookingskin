import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
// Single post stylesheet, loaded on all article single pages (App Router
// code-splits this CSS to the post route).
import '../../custom.css';
import { getPost, listPosts, listCategories, listProductsForHub, getAdjacentPosts, mediaUrl, type BlsPost } from '@/lib/strapi';
import { SECTIONS, SITE } from '@/lib/site';
import { fmtDate, firstImageUrl, primaryCategorySlug, postPath } from '@/lib/format';
import { withHeadingIds } from '@/lib/toc';
import PostContent from '@/components/PostContent';
import ReadingRail from '@/components/ReadingRail';
import AuthorAvatar from '@/components/AuthorAvatar';
import PullQuote from '@/components/PullQuote';
import ReadAlso from '@/components/ReadAlso';
import InlineProducts from '@/components/InlineProducts';
import PostFooterNav from '@/components/PostFooterNav';
import RelatedCarousel from '@/components/RelatedCarousel';
import ArticleSidebar from '@/components/ArticleSidebar';

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

  // Pull related posts (same category, excluding this one) and recent posts
  // across all categories (for the right sidebar) in parallel.
  const [related, recentPosts] = await Promise.all([
    listPosts({ category, pageSize: 9 })
      .then((r) => r.data.filter((p) => p.id !== post.id).slice(0, 8))
      .catch(() => [] as BlsPost[]),
    listPosts({ pageSize: 6 })
      .then((r) => r.data.filter((p) => p.id !== post.id).slice(0, 5))
      .catch(() => [] as BlsPost[]),
  ]);

  /*
   * Sidebar categories: every category that has posts, not just the five format
   * buckets in SECTIONS. The topic hubs are what a reader browses by, and they
   * were only reachable from the header menu and the footer.
   *
   * Counted one query each -- Strapi's REST layer has no aggregate -- and
   * anything empty is dropped, which also removes the three grouping parents
   * (product-type-hubs and friends). Those exist to organise the nav and hold
   * no posts of their own, so a row reading "Skin-Concern Hubs 0" would be
   * noise.
   *
   * No image is fetched any more: the card that renders these shows emoji and a
   * count, so pulling a representative cover per category was 23 wasted reads.
   */
  const allCategories = await listCategories().catch(() => []);
  const categoryTiles = (
    await Promise.all(
      allCategories.map(async (c) => {
        const r = await listPosts({ category: c.slug, pageSize: 1 }).catch(() => null);
        return {
          href: `/${c.slug}`,
          name: c.name,
          count: r?.meta?.pagination?.total ?? 0,
          image: null as string | null,
        };
      }),
    )
  ).filter((t) => t.count > 0);

  const toRow = (p: BlsPost) => ({
    href: postPath(p),
    title: p.title,
    date: fmtDate(p.publishedAt),
    img: mediaUrl(p.coverImage ?? null) ?? firstImageUrl(p.content),
    category: p.categories?.[0]?.name,
  });
  const popularRows = related.map(toRow);
  const recentRows = recentPosts.map(toRow);

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
    const text = prose.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;|&#\d+;/gi, ' ').replace(/\s+/g, ' ');
    const sentences = text.split(/(?<=[.!?])\s+/).filter((t) => t.length >= 80 && t.length <= 190);
    return sentences.length ? sentences[Math.floor(sentences.length / 2)].trim() : '';
  })();

  /* Products from this post's hub, and two more articles to read. Both come
     from data the site already holds, so neither costs a request to a paid API
     at render time. */
  const inlineProducts = await listProductsForHub(category, 3).catch(() => []);
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

  /* The FAQ is the last section of every one of these posts, so anything
     rendered after the body lands underneath it. Split it off, and the second
     gallery image can sit in the article where it belongs rather than stranded
     below a list of questions. */
  const [bodyBeforeFaq, faqSection] = (() => {
    const m = bodySecond.match(/<h[23]\b[^>]*>(?:(?!<\/h[23]>).)*(?:FAQ|Frequently\s+Asked)(?:(?!<\/h[23]>).)*<\/h[23]>/i);
    if (!m || m.index === undefined) return [bodySecond, ''] as const;
    return [bodySecond.slice(0, m.index), bodySecond.slice(m.index)] as const;
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

  return (
    <>
    <article
      className="mx-auto max-w-7xl bg-white px-6 pb-12 pt-4"
      data-testid={`post-${post.slug}`}
      data-category={category}
      data-post-type={post.postType}
    >
      {/* Vendor stylesheets used by the imported product-comparison blocks
          (Content Egg + scoped Bootstrap, both rules scoped under
          .cegg5-container). Loaded for this article only. */}
      {slug === 'cerave-acne-gel-differin-gel-30-day-comparison' && (
        <>
          <link rel="stylesheet" href="/vendor/cegg-bootstrap.min.css" />
          <link rel="stylesheet" href="/vendor/cegg-products.min.css" />
        </>
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* Breadcrumbs sit directly under the site nav, full width and flush:
          no vertical margin or padding, so the rule reads as part of the header
          rather than as the article's first element. */}
      <nav className="my-0 flex items-center gap-2 py-0 text-[12px] font-semibold text-ink/55" data-testid="breadcrumb" aria-label="Breadcrumb">
        <Link href="/" className="shrink-0 font-semibold text-primary hover:text-primary-highlight">Home</Link>
        <span className="shrink-0">/</span>
        <Link href={`/${category}`} className="shrink-0 font-semibold text-primary hover:text-primary-highlight">
          {cat?.name ?? categoryName(category)}
        </Link>
        <span className="shrink-0">/</span>
        <span className="min-w-0 truncate text-ink/75" aria-current="page">{post.title}</span>
      </nav>

      {/* Split hero: byline, title, standfirst and tags on the left, cover on
          the right. The cover used to run full width above everything, which
          gave the page two competing focal points before a word was read. */}
      <div className="mt-6 grid items-center gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* 40 / 60. Expressed as 2fr / 3fr rather than literal percentages so the
            10-unit gap comes out of the track sizing instead of overflowing the row. */}
        <div className="min-w-0">
          {post.author && (
            <p className="flex items-center gap-2 text-[14px] text-ink/60">
              <AuthorAvatar name={post.author.name} src={post.author.avatarUrl} size={28} />
              <Link href={`/authors/${post.author.slug}`} className="font-bold text-ink hover:text-primary">
                {post.author.name}
              </Link>
              <span className="text-ink/45">on {fmtDate(post.publishedAt)}</span>
            </p>
          )}

          <h1 className="mt-5 font-display text-[2rem] font-bold leading-tight tracking-tight text-ink">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-5 max-w-xl text-[17px] leading-8 text-ink/60">{post.excerpt}</p>
          )}

          {/* Category and format, as the tags in the reference. Both are real
              fields, so neither is decoration. */}
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={`/${category}`}
              className="rounded border border-ink/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink/70 transition hover:border-ink/30 hover:text-primary"
            >
              {cat?.name ?? categoryName(category)}
            </Link>
            {post.postType && (
              <span className="rounded border border-ink/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink/70">
                {post.postType.replace(/-/g, ' ')}
              </span>
            )}
          </div>
        </div>

        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={post.coverImage?.alternativeText || post.title}
            className="aspect-[4/3] max-h-[400px] w-full rounded-2xl object-cover"
          />
        )}
      </div>

      <div aria-hidden className="mt-10 h-px w-full bg-ink/10" />

      <div className="mt-10 grid gap-10 lg:grid-cols-[210px_minmax(0,1fr)_280px] lg:gap-12">
        {/* Left rail: reading progress + contents. Ordered after the article on
            small screens, where a contents list above the piece is just a wall
            of links between the reader and the text. */}
        <div className="order-2 lg:order-1">
          <ReadingRail minutes={post.readingTimeMinutes} toc={toc} />
        </div>

        {/* Main article column */}
        <div className="order-1 min-w-0 lg:order-2">


          {/* Disclosure sits above the article, not after it. A notice a reader
              only meets once they have finished, and scrolled past every buy
              button, is not much of a disclosure. */}
          <div className="mb-8 rounded-lg border border-ink/10 bg-muted/30 px-4 py-3 text-[13px] leading-6 text-ink/65">
            <strong className="font-bold text-ink/80">Heads up:</strong> when you buy through links
            on this page we may earn a commission, at no extra cost to you. It never changes which
            products we recommend or what we say about them.{' '}
            <Link href="/legal/disclosure" className="text-primary underline underline-offset-2 hover:text-primary-highlight">
              Read our full disclosure
            </Link>.
          </div>

          <div id="article-body" className="after:clear-both after:block after:content-['']">
            <PostContent html={bodyIntro} />

            {readAlsoRows.length === 2 && <ReadAlso rows={readAlsoRows} />}

            {bodyAfterIntro && <PostContent html={bodyAfterIntro} />}
            {/*
              Gallery images are rendered here rather than embedded in the body.
              The generator reports "embedded N contextual image(s)" for every
              site, but the function behind that message returns early unless the
              site is flightfares.one -- so 67 posts carry gallery images that
              were never placed in their HTML, and only the cover ever showed.
              Rendering from the relation keeps the stored content clean and
              means the placement can change without rewriting every post.
            */}
            {/* Products sit here, not next to the floated gallery images. In the
                previous order they rendered immediately above the first one, so
                a product grid and a photograph stacked directly on top of each
                other and the section read as one large advert. The pull quote
                between them keeps text on both sides of the block. */}
            {inlineProducts.length >= 2 && <InlineProducts products={inlineProducts} />}

            {pullQuote && <PullQuote text={pullQuote} />}

            {/* Floated so the text wraps alongside, as in the reference. Full
                width on small screens -- a 45% float in a 360px column leaves
                two words a line. Captions use alternativeText where the image
                actually has one; nothing is written to fill the space. */}
            {galleryImages[0] && (
              <figure className="mb-6 sm:float-left sm:mr-7 sm:mb-4 sm:w-[45%]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={galleryImages[0]}
                  alt={post.gallery?.[0]?.alternativeText || post.title}
                  className="aspect-[4/5] w-full rounded-lg object-cover"
                  loading="lazy"
                />
                {post.gallery?.[0]?.alternativeText && (
                  <figcaption className="mt-3 text-[13px] leading-5 text-ink/50">
                    {post.gallery[0].alternativeText}
                  </figcaption>
                )}
              </figure>
            )}
            {bodyBeforeFaq ? <PostContent html={bodyBeforeFaq} /> : null}

            {/* Above the FAQ, never below it. */}
            {galleryImages[1] && (
              <figure className="mb-6 sm:float-right sm:ml-7 sm:mb-4 sm:w-[45%]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={galleryImages[1]}
                  alt={post.gallery?.[1]?.alternativeText || post.title}
                  className="aspect-[4/3] w-full rounded-lg object-cover"
                  loading="lazy"
                />
                {post.gallery?.[1]?.alternativeText && (
                  <figcaption className="mt-3 text-[13px] leading-5 text-ink/50">
                    {post.gallery[1].alternativeText}
                  </figcaption>
                )}
              </figure>
            )}

            {faqSection && <PostContent html={faqSection} />}
          </div>

          <PostFooterNav
            title={post.title}
            url={`${SITE.url}/${category}/${post.slug}`}
            tags={[
              { label: cat?.name ?? categoryName(category), href: `/${category}` },
              ...(post.postType ? [{ label: post.postType.replace(/-/g, ' ') }] : []),
            ]}
            prev={prevPost}
            next={nextPost}
          />

          {post.author?.bio && (
            <div
              className="mt-12 flex gap-4 rounded-2xl border border-ink/10 bg-muted/30 p-5"
              data-testid="author-card"
            >
              <AuthorAvatar name={post.author.name} src={post.author.avatarUrl} size={48} />
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink/45">Written by</p>
                <Link
                  href={`/authors/${post.author.slug}`}
                  className="font-display text-base font-bold text-ink hover:text-primary"
                >
                  {post.author.name}
                </Link>
                <p className="mt-2 text-sm leading-6 text-ink/70">{post.author.bio}</p>
              </div>
            </div>
          )}


        </div>

        {/* Right sidebar: post categories + trending */}
        <div className="order-3">
        <ArticleSidebar
          categoryTiles={categoryTiles}
          popular={popularRows}
          recent={recentRows}
        />
        </div>
      </div>

    </article>

    {related.length > 0 && (
      <section className="border-t border-ink/10 bg-muted/40 py-14" data-testid="more-in-category">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">More in {cat?.name ?? categoryName(category)}</h2>
          <div className="mt-6">
            <RelatedCarousel posts={related} />
          </div>
        </div>
      </section>
    )}
    </>
  );
}
