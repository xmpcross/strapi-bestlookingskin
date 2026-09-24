import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { absoluteUrl, seoTitle } from '@/lib/seo';
import '../../article.css';
import '../../top-rated.css';
import { getPost, listPostSummaries, listProductsForPost, listProductsBySlugs, getAdjacentPosts, mediaUrl, type BlsPostSummary } from '@/lib/strapi';
import { productSlugsIn, renderProductBoxes } from '@/lib/product-boxes';
import { AFFILIATE_LINKS_ENABLED, PILLAR_SLUGS, SECTIONS, SITE, publisherJsonLd } from '@/lib/site';
import AdSlot from '@/components/AdSlot';
import { fmtDate, primaryCategorySlug, postPath, descriptionFromBody } from '@/lib/format';
import { withHeadingIds, decodeEntities } from '@/lib/toc';
import { cleanProductRoundupHtml } from '@/lib/legacy-product-roundup';
import { isMarkdownBody, markdownToHtml } from '@/lib/markdown';
import { getTopicGroups } from '@/lib/nav';
import { toCard } from '@/lib/post-card';
import PostContent from '@/components/PostContent';
import PillarLayout from '@/components/pillar/PillarLayout';
import '../../pillar.css';
import ArticleContents from '@/components/ArticleContents';
import ShareRail from '@/components/ShareRail';
import NextUp from '@/components/NextUp';
import FeaturedPostsSlider from '@/components/FeaturedPostsSlider';
import SidebarTitle from '@/components/magzin/SidebarTitle';
import PostAffiliateLinks, { affiliateLinksFor, tagsFromKeywords } from '@/components/PostAffiliateLinks';
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

  /* `ogImage` first: where an editor has set one it is the image chosen for
     sharing, while `coverImage` is chosen to sit at the top of the article.
     The site default backstops both so no post shares as a bare link. */
  const cover = mediaUrl(post.ogImage ?? null) || mediaUrl(post.coverImage ?? null) || SITE.ogImage;

  /* Description, in order of how well it was written for the job: the editor's
     own, the excerpt, then the body's opening prose. SITE.description is last
     and should now be unreachable for any post with a body -- it was previously
     second in line, which is how all 120 legacy posts came to share the
     homepage's description word for word. */
  const description =
    post.seoDescription || post.excerpt || descriptionFromBody(post.content) || SITE.description;

  const title = post.seoTitle || post.title;

  return {
    title: seoTitle(title),
    description,
    keywords: post.seoKeywords,
    alternates: { canonical: `/${category}/${post.slug}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `${SITE.url}/${category}/${post.slug}`,
      images: [{ url: absoluteUrl(cover)! }],
      publishedTime: post.publishedAt,
      /* The release date, as in the sitemap and Article dateModified (not Strapi's updatedAt). */
      modifiedTime: post.publishedAt,
    },
    twitter: {
      /* Always the large card: there is now always an image behind it. Legacy
         posts used to fall through to `summary` while the site default said
         `summary_large_image`, so the same site produced two card shapes. */
      card: 'summary_large_image',
      title,
      description,
      images: [cover],
    },
  };
}

/* Article structured data shared by the post and pillar templates. */
function articleJsonLdBase(post: NonNullable<Awaited<ReturnType<typeof getPost>>>, cover: string | null, category: string) {
  return {
    '@context': 'https://schema.org',
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    /* Full URLs: covers served from /cms-uploads/… were emitted as relative paths. */
    image: cover ? [absoluteUrl(cover)] : undefined,
    datePublished: post.publishedAt,
    /* The release date, as in the sitemap lastmod (lib/strapi.ts listAllPostSlugs): Strapi's updatedAt moves on
       bulk edits that do not change the article. */
    dateModified: post.publishedAt,
    /* A named author is one of the things reviewers and search engines look for
       on affiliate content; without it an Article carries a publisher and no
       human behind it. */
    author: post.author ? { '@type': 'Person', name: post.author.name, url: `${SITE.url}/authors/${post.author.slug}` } : undefined,
    publisher: publisherJsonLd(),
    mainEntityOfPage: `${SITE.url}/${category}/${post.slug}`,
  };
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { slug, category } = await params;
  const post = await getPost(slug).catch(() => null);
  if (!post) notFound();

  // If the URL category doesn't match the post's primary category, send them to the canonical URL. Permanent
  // (308), so a post moved to another category passes its old URL's search standing to the new one.
  const canonicalCat = primaryCategorySlug(post);
  if (canonicalCat !== category) {
    const { permanentRedirect } = await import('next/navigation');
    permanentRedirect(postPath(post));
  }

  // Related posts (same category, excluding this one), recent guides across the site, and the topic hubs.
  const [related, recentPosts, topicGroups] = await Promise.all([
    listPostSummaries({ category, pageSize: 9, withCover: true })
      .then((r) => r.data.filter((p) => p.id !== post.id).slice(0, 8))
      .catch(() => [] as BlsPostSummary[]),
    listPostSummaries({ pageSize: 24, authored: true, withCover: true })
      .then((r) => r.data.filter((p) => p.id !== post.id))
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
  const recentRows = recentPosts.slice(0, 5).map(toRow);
  /* Sidebar "Featured Posts" slider: three authored guides with a working cover that are not already in the
     "Latest guides" list below it, other topics first. The CMS has no featured flag, so nothing here claims an
     editorial pick beyond being shown. */
  const featuredPosts = (() => {
    const shown = new Set(recentRows.slice(0, 3).map((r) => r.href));
    const pool = recentPosts.slice(3).map(toCard).filter((c) => c.image && !shown.has(c.href));
    const otherTopics = pool.filter((c) => !c.href.startsWith(`/${category}/`));
    return [...otherTopics, ...pool.filter((c) => c.href.startsWith(`/${category}/`))]
      .slice(0, 3)
      .map((c) => ({ href: c.href, title: c.title, image: c.image as string, imageAlt: c.imageAlt, author: c.author?.name ?? null, date: c.date }));
  })();
  const topics = topicGroups.flatMap((g) => g.items).filter((t) => t.href !== `/${category}`);

  const cover = mediaUrl(post.coverImage ?? null);
  const cat = post.categories?.[0];

  // Strip <em> / </em> tags from the post body — text content is kept, only
  // the wrapping element is removed (so italic emphasis no longer renders).
  // \b avoids matching <embed>; [^>]* handles any attributes.
  /* Top-rated roundups imported from WordPress (Content Egg / GreenShift markup): their legacy styles and frozen prices
     are stripped first. Keyed on the post type and the markup, not the category, so it follows a post into a hub. */
  const isTopRated = post.postType === 'top-rated' && /cegg5-container|gspb_/.test(post.content ?? '');
  /* Markdown bodies (articles pushed from app.fxnseo.com) become HTML first, so the rest of this pipeline applies. */
  const bodyHtmlSource = isMarkdownBody(post.content) ? markdownToHtml(post.content ?? '') : (post.content ?? '');
  /* ::product:<slug>:: markers (placed by the AI writer) become inline product boxes; see lib/product-boxes.ts. */
  const boxProducts = await listProductsBySlugs(productSlugsIn(bodyHtmlSource));
  const bodySource = renderProductBoxes(bodyHtmlSource, boxProducts);
  /* Generated posts carry their own "Where to buy" section at the end of the body. */
  const hasOwnWhereToBuy = /\bid=["']where-to-buy["']/i.test(bodySource);
  const postBodyRaw = (isTopRated ? cleanProductRoundupHtml(bodySource) : bodySource)
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
    // "Common Questions About Retinol Serums" (and "... on ...") section headings read as "FAQs", like the
    // generated posts' FAQ sections; the heading's own markup is kept, only its text changes.
    .replace(/(<h([2-4])\b[^>]*>)\s*Common\s+Questions\s+(?:about|on)\b(?:(?!<\/h\2>)[\s\S])*<\/h\2>/gi, '$1FAQs</h$2>')
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

  /* The FAQ is the last section of these posts; it is split off so nothing is placed underneath it. */
  const [bodyMain, faqSection] = (() => {
    const m = bodyWithIds.match(/<h[23]\b[^>]*>(?:(?!<\/h[23]>).)*(?:FAQ|Frequently\s+Asked)(?:(?!<\/h[23]>).)*<\/h[23]>/i);
    if (!m || m.index === undefined || m.index === 0) return [bodyWithIds, ''] as const;
    return [bodyWithIds.slice(0, m.index), bodyWithIds.slice(m.index)] as const;
  })();

  /*
   * Top-level positions in the body: where each h2 starts and each paragraph ends, counted only outside block
   * elements. Imported WordPress posts nest content in divs, tables and lists; cutting inside one would split its
   * markup across two renders.
   */
  const topLevel = (() => {
    const h2: number[] = [];
    const paragraphEnds: number[] = [];
    let depth = 0;
    for (const m of bodyMain.matchAll(/<(\/?)(div|section|article|table|figure|ul|ol|blockquote|details|aside)\b[^>]*>|<\/p>|<h2\b/gi)) {
      const tag = m[0].toLowerCase();
      if (tag === '</p>') {
        if (depth === 0) paragraphEnds.push((m.index ?? 0) + 4);
      } else if (tag.startsWith('<h2')) {
        if (depth === 0) h2.push(m.index ?? 0);
      } else if (!tag.endsWith('/>')) {
        depth = Math.max(0, depth + (m[1] ? -1 : 1));
      }
    }
    return { h2, paragraphEnds };
  })();

  /* Pillar pages ("complete guides") use their own template: chapters are the top-level h2 sections. */
  const isPillar = post.postType === 'pillar' || PILLAR_SLUGS.has(post.slug);
  if (isPillar) {
    const heads = topLevel.h2;
    const sectionAt = (i: number) => bodyMain.slice(heads[i], i + 1 < heads.length ? heads[i + 1] : bodyMain.length);
    let intro = heads.length ? bodyMain.slice(0, heads[0]) : bodyMain;
    let first = 0;
    /* A body that opens with a heading restating the title (common in pushed Markdown): that section is the intro. */
    if (!intro.replace(/<[^>]+>/g, '').trim() && heads.length >= 3) {
      intro = sectionAt(0).replace(/^\s*<h2\b[^>]*>[\s\S]*?<\/h2>/i, '');
      first = 1;
    }
    const chapters = heads.slice(first).map((_, k) => {
      const html = sectionAt(first + k);
      const head = html.match(/^\s*<h2\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/i);
      return { id: head?.[1] ?? `chapter-${k + 1}`, text: decodeEntities((head?.[2] ?? '').replace(/<[^>]+>/g, '')).trim(), html };
    });
    const faqId = faqSection.match(/<h[23]\b[^>]*\bid="([^"]+)"/i)?.[1] ?? null;
    const pillarJsonLd = { ...articleJsonLdBase(post, cover, category), '@type': 'Article' };
    const others = recentPosts.filter((p) => primaryCategorySlug(p) !== category).map(toCard).slice(0, 3);
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pillarJsonLd) }} />
        <PillarLayout
          title={post.title}
          excerpt={post.excerpt}
          cover={cover}
          coverAlt={post.coverImage?.alternativeText || post.title}
          category={{ name: cat?.name ?? categoryName(category), href: `/${category}` }}
          author={post.author ?? null}
          publishedLabel={fmtDate(post.publishedAt)}
          updatedAt={post.updatedAt}
          updatedLabel={fmtDate(post.updatedAt)}
          readMinutes={post.readingTimeMinutes ?? null}
          introHtml={intro}
          chapters={chapters}
          faqHtml={faqSection}
          faqId={faqId}
          cluster={related.map(toCard).slice(0, 8)}
          moreGuides={others}
          url={`${SITE.url}/${category}/${post.slug}`}
        />
      </>
    );
  }

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
    const prose = bodyMain
      .slice(0, Math.floor(bodyMain.length / 2))
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
  /* "Affiliate links" when the products' offers resolve to Geniuslink / Takeads links (lib/links.ts); otherwise the
     same retailers are listed under "Where to buy" as plain links. */
  const buyLinks = (() => {
    /* The post's own "Where to buy" section already lists the retailers: no second list after the article. */
    if (hasOwnWhereToBuy) return { mode: 'retailer' as const, links: [] };
    const affiliate = affiliateLinksFor(inlineProducts, 'affiliate');
    return affiliate.length ? { mode: 'affiliate' as const, links: affiliate } : { mode: 'retailer' as const, links: affiliateLinksFor(inlineProducts, 'retailer') };
  })();

  /* The contents box goes after the first top-level paragraph (on Tier A posts, the direct-answer paragraph). */
  const leadCut = topLevel.paragraphEnds[0] !== undefined && (topLevel.h2.length < 2 || topLevel.paragraphEnds[0] < topLevel.h2[1]) ? topLevel.paragraphEnds[0] : 0;

  /*
   * Where the in-article blocks go. They sit only at section boundaries -- just before an h2, never beside other
   * content or floated next to text -- spread one per section in order, with the last one (the second image)
   * above the final section before the FAQ. The first h2 is skipped: the contents box already sits right above
   * it. Posts without enough top-level headings fall back to top-level paragraph ends, still full width.
   */
  const boundaries = (() => {
    const sections = topLevel.h2.slice(1).filter((i) => i > leadCut);
    if (sections.length) return sections;
    const paras = topLevel.paragraphEnds.filter((i) => i > leadCut && i < bodyMain.length - 20);
    const want = Math.min(5, paras.length);
    return Array.from({ length: want }, (_, i) => paras[Math.floor(((i + 1) * paras.length) / (want + 1))]).filter((v, i, a) => v !== undefined && a.indexOf(v) === i);
  })();

  const { prev: prevPost, next: nextPost } = await getAdjacentPosts(category, slug);

  /* Always Article, review posts included. A schema.org Review needs itemReviewed, author and reviewRating; the
     posts carry no rating and no linked product, so marking them Review produced invalid Review snippets in Search
     Console (GSC audit 24 Sep 2026). Only emit Review once a post has a real rating and a linked product. */
  const articleJsonLd = {
    ...articleJsonLdBase(post, cover, category),
    '@type': 'Article',
  };

  const catName = cat?.name ?? categoryName(category);
  const figure = (i: 0 | 1) =>
    galleryImages[i] ? (
      <figure className="post-figure post-figure-wide">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={galleryImages[i]} alt={post.gallery?.[i]?.alternativeText || post.title} className="rounded-8 w-100" loading="lazy" />
        {post.gallery?.[i]?.alternativeText && <figcaption className="fs-8 text-600 mt-2">{post.gallery[i].alternativeText}</figcaption>}
      </figure>
    ) : null;

  /* In-article blocks in reading order, each assigned to a boundary (see `boundaries`). */
  const inserts = [
    figure(0),
    readAlsoRows.length === 2 ? <ReadAlso rows={readAlsoRows} /> : null,
    /* Posts with their own product boxes do not also get the automatic related-products row. */
    !boxProducts.length && inlineProducts.length >= 2 ? <InlineProducts products={inlineProducts} /> : null,
    pullQuote ? <PullQuote text={pullQuote} /> : null,
    figure(1),
  ].filter(Boolean) as React.ReactNode[];
  const slotOf = (i: number) => {
    const n = inserts.length;
    const b = boundaries.length;
    if (!b) return -1;
    if (n <= b) return i === n - 1 ? b - 1 : i;
    return n === 1 ? 0 : Math.round((i * (b - 1)) / (n - 1));
  };
  const bodyParts: React.ReactNode[] = [];
  {
    let from = 0;
    if (leadCut) {
      bodyParts.push(<PostContent key="lead" html={bodyMain.slice(0, leadCut)} />);
      from = leadCut;
    }
    bodyParts.push(<ArticleContents key="contents" toc={toc} />);
    /* Imported WordPress posts wrap the whole body in layout divs, so there are no top-level section breaks to put
       an ad between (and splitting nested markup would unbalance it). They get one in-article unit here instead,
       after the contents box and before the body. */
    if (!boundaries.length) bodyParts.push(<AdSlot key="ad-lead" kind="inArticle" />);
    /* In-article ads (ADSENSE.slots.inArticle): after the first section, and about 60% down on posts with four or
       more sections. Never above the contents box or the direct answer, never two in a row. */
    const adAt = new Set<number>(boundaries.length ? [0] : []);
    if (boundaries.length >= 4) adAt.add(Math.floor(boundaries.length * 0.6));
    boundaries.forEach((cut, bi) => {
      const html = bodyMain.slice(from, cut);
      if (html.trim()) bodyParts.push(<PostContent key={`part-${bi}`} html={html} />);
      from = cut;
      if (adAt.has(bi)) bodyParts.push(<AdSlot key={`ad-${bi}`} kind="inArticle" />);
      inserts.forEach((node, i) => {
        if (slotOf(i) === bi) bodyParts.push(<div key={`insert-${i}`} className="post-insert">{node}</div>);
      });
    });
    const tail = bodyMain.slice(from);
    if (tail.trim()) bodyParts.push(<PostContent key="tail" html={tail} />);
    if (!boundaries.length) inserts.forEach((node, i) => bodyParts.push(<div key={`insert-${i}`} className="post-insert">{node}</div>));
    if (faqSection) bodyParts.push(<PostContent key="faq" html={faqSection} />);
  }

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

      <article className={`sec-1-single-3 pb-70${isTopRated ? ' top-rated-post' : ''}`} data-testid={`post-${post.slug}`} data-category={category} data-post-type={post.postType}>
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
              {AFFILIATE_LINKS_ENABLED && (
                <p className="affiliate-note fs-7 text-600 px-3 py-2 mb-4">
                  <strong className="text-dark">Heads up:</strong> when you buy through links on this page we may earn a commission, at no extra cost to you. It never changes which products
                  we recommend or what we say about them. <Link href="/legal/disclosure" className="text-dark text-decoration-underline">Read our full disclosure</Link>.
                </p>
              )}

              <div id="article-body" className="post-body">
                {bodyParts}
              </div>

              <NextUp
                posts={related.map(toCard)}
                category={{ name: catName, href: `/${category}` }}
                updatedAt={post.updatedAt}
                updatedLabel={fmtDate(post.updatedAt)}
                url={`${SITE.url}/${category}/${post.slug}`}
                title={post.title}
              />

              <PostAffiliateLinks links={buyLinks.links} mode={buyLinks.mode} tags={tagsFromKeywords(post.seoKeywords)} />
              {/* End of article: multiplex (related-content style) unit. */}
              <AdSlot kind="multiplex" />

              {/* End of article: previous / next only. The tags-and-share row and the author bio card were removed at
                  the owner's request; sharing lives in the left rail, the byline in the top section. */}
              <PostFooterNav title={post.title} url={`${SITE.url}/${category}/${post.slug}`} tags={[]} prev={prevPost} next={nextPost} showMeta={false} />

              <CommentForm postTitle={post.title} postUrl={`${SITE.url}/${category}/${post.slug}`} />
            </div>

            <aside className="post-layout-side" aria-label="Article sidebar">
              {recentRows.length > 0 && (
                <div className="mb-5">
                  {/* Magzin "Weekly trending" block (card-10 style-2). Headed "Latest guides": the list is the newest
                      guides, and the site has no traffic data to call anything trending. */}
                  <SidebarTitle>Latest guides</SidebarTitle>
                  <div className="d-flex flex-column gap-3">
                    {recentRows.slice(0, 3).map((row) => (
                      <div className="article card-10 style-2 sidebar-trending" key={row.href}>
                        <Link href={row.href} className="card-img">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {row.img ? <img className="w-100" src={row.img} alt={row.title || 'Latest guide thumbnail'} width={108} height={83} loading="lazy" /> : null}
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
              {/* Sidebar display unit, high in the column so it is seen while the article is read. */}
              <AdSlot kind="display" className="mb-5" />
              {topics.length > 0 && (
                <div className="mb-5">
                  <SidebarTitle>Topics</SidebarTitle>
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
              {featuredPosts.length > 0 && (
                <div className="mb-5 featured-posts-sticky" data-testid="featured-posts">
                  <SidebarTitle>Featured Posts</SidebarTitle>
                  <FeaturedPostsSlider posts={featuredPosts} />
                </div>
              )}
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
