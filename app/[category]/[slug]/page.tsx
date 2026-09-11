import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
// Single post stylesheet, loaded on all article single pages (App Router
// code-splits this CSS to the post route).
import '../../custom.css';
import { getPost, listPosts, mediaUrl, type BlsPost } from '@/lib/strapi';
import { SECTIONS, SITE } from '@/lib/site';
import { fmtDate, firstImageUrl, primaryCategorySlug, postPath } from '@/lib/format';
import PostContent from '@/components/PostContent';
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

  // Sidebar category tiles: count + representative (newest-post) image per section.
  const categoryTiles = await Promise.all(
    SECTIONS.map(async (s) => {
      const r = await listPosts({ category: s.slug, pageSize: 1 }).catch(() => null);
      const first = r?.data?.[0];
      return {
        href: `/${s.slug}`,
        name: s.short,
        count: r?.meta?.pagination?.total ?? 0,
        image: first ? mediaUrl(first.coverImage ?? null) ?? firstImageUrl(first.content) : null,
      };
    }),
  );

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

  // Split the body near its mid-point so the in-article ad lands in the middle
  // of the blog. Prefer a heading boundary (clean section break); fall back to
  // the nearest paragraph end so HTML blocks are never cut open.
  const [bodyFirst, bodySecond] = (() => {
    const html = postBodyHtml;
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

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-12">
        {/* Main article column */}
        <div className="min-w-0">
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={post.coverImage?.alternativeText || post.title}
              className="aspect-[16/9] w-full rounded-3xl object-cover"
            />
          )}

          {/* Title and meta sit under the featured image. */}
          <header className={cover ? 'mt-6' : ''}>
            <h1 className="font-display text-[2rem] font-bold leading-tight tracking-tight text-ink">
              {post.title}
            </h1>
            <p className="mb-[15px] text-[14px] text-ink/55">
              {post.author && (
                <>
                  By{' '}
                  <Link
                    href={`/authors/${post.author.slug}`}
                    className="font-semibold text-ink/75 hover:text-primary"
                  >
                    {post.author.name}
                  </Link>
                  {' · '}
                </>
              )}
              Published {fmtDate(post.publishedAt)}
              {post.readingTimeMinutes ? ` · ${post.readingTimeMinutes} min read` : ''}
            </p>
          </header>

          <div>
            <PostContent html={bodyFirst} />
            {/*
              Gallery images are rendered here rather than embedded in the body.
              The generator reports "embedded N contextual image(s)" for every
              site, but the function behind that message returns early unless the
              site is flightfares.one -- so 67 posts carry gallery images that
              were never placed in their HTML, and only the cover ever showed.
              Rendering from the relation keeps the stored content clean and
              means the placement can change without rewriting every post.
            */}
            {galleryImages[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={galleryImages[0]}
                alt={post.gallery?.[0]?.alternativeText || post.title}
                className="my-10 aspect-[16/9] w-full rounded-2xl object-cover"
                loading="lazy"
              />
            )}
            {bodySecond ? <PostContent html={bodySecond} /> : null}
            {galleryImages[1] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={galleryImages[1]}
                alt={post.gallery?.[1]?.alternativeText || post.title}
                className="mt-10 aspect-[16/9] w-full rounded-2xl object-cover"
                loading="lazy"
              />
            )}
          </div>

          {post.author?.bio && (
            <div
              className="mt-12 flex gap-4 rounded-2xl border border-ink/10 bg-muted/30 p-5"
              data-testid="author-card"
            >
              <div aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-base font-bold text-white">
                {post.author.name.trim().charAt(0).toUpperCase()}
              </div>
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

          <div className="mt-12 rounded-2xl border border-ink/10 bg-muted/40 p-5 text-xs leading-5 text-ink/60">
            <strong className="text-ink/80">Affiliate disclosure.</strong> {SITE.name} earns a
            commission when you buy through links on this page, at no extra cost to you.
            Prices and availability are accurate as of {fmtDate(post.updatedAt)} and subject to change.
          </div>

        </div>

        {/* Right sidebar: post categories + recent posts */}
        <ArticleSidebar
          categoryTiles={categoryTiles}
          popular={popularRows}
          recent={recentRows}
        />
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
