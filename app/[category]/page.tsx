import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCategory, listPostSummaries, type BlsPostType } from '@/lib/strapi';
import { SECTIONS, SITE, isListedSection } from '@/lib/site';
import { getTopicGroups } from '@/lib/nav';
import { toCard } from '@/lib/post-card';
import { ListCard, RowCard, SectionTitle, TextCard, TileCard } from '@/components/magzin/cards';
import SidebarTitle from '@/components/magzin/SidebarTitle';
import Breadcrumb from '@/components/magzin/Breadcrumb';
import Pagination from '@/components/magzin/Pagination';
import CategoryListWidget from '@/components/magzin/CategoryListWidget';
import FeaturedPostsSlider from '@/components/FeaturedPostsSlider';
import PillarBanner from '@/components/pillar/PillarBanner';

export const revalidate = 60;
export const dynamicParams = true;

/* Archive in Magzin blocks, sixteen posts a page. Page 1: archive header, a grid of three card-7 text cards over four
   card-5 image tiles, a strip of three row cards, then the "latest" block (card-9 list cards beside the sidebar,
   as on home 3). Later pages show only the list block, so every post appears once. */
const PAGE_SIZE = 16;

// Reserved top-level routes that aren't categories — keep them out of this segment.
const RESERVED = new Set(['about', 'brands', 'posts', 'search', 'newhome', 'feed.xml', 'sitemap.xml', 'robots.txt']);

type Params = { category: string };
type SearchParams = { page?: string; topics?: string };

async function resolveCategory(slug: string) {
  const fromCms = await getCategory(slug).catch(() => null);
  const section = SECTIONS.find((s) => s.slug === slug);
  return {
    name: fromCms?.name ?? section?.title ?? slug.replace(/-/g, ' '),
    /* A real description: the section's own blurb or the category's CMS description; never the site default. */
    description: section?.blurb ?? fromCms?.description ?? null,
    subtitle: section?.subtitle ?? null,
    seoTitle: section?.seoTitle ?? null,
    metaDescription: section?.metaDescription ?? null,
    known: Boolean(fromCms || section),
  };
}

const clip = (s: string, n = 158) => (s.length <= n ? s : `${s.slice(0, s.lastIndexOf(' ', n - 1))}…`);

export async function generateMetadata({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const { category } = await params;
  if (RESERVED.has(category)) return {};
  const retiredTo = SECTIONS.find((sec) => sec.slug === category)?.redirectTo;
  if (retiredTo) permanentRedirect(retiredTo);
  const { page: pageRaw, topics } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);
  const c = await resolveCategory(category);
  const description = c.metaDescription ?? (c.description ? clip(c.description) : `${c.name}: guides and reviews from ${SITE.name}.`);
  const title = c.seoTitle ?? c.name;
  return {
    title: page > 1 ? `${title} (page ${page})` : title,
    description,
    alternates: { canonical: page > 1 ? `/${category}?page=${page}` : `/${category}` },
    openGraph: { title, description, url: `${SITE.url}/${category}` },
    /* A combined-topics view is a filter of existing archives: keep it out of the index. */
    ...(topics ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<SearchParams> }) {
  const { category } = await params;
  if (RESERVED.has(category)) notFound();
  /* Retired format archives (reviews, comparisons, top-rated, how-to): their posts live in the topic hubs now. */
  const retiredTo = SECTIONS.find((sec) => sec.slug === category)?.redirectTo;
  if (retiredTo) permanentRedirect(retiredTo);
  const { page: pageRaw, topics: topicsRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);

  /* Topics picked in the Browse Topics dropdown, on top of this archive's own (only known hub / format slugs). */
  const groups = await getTopicGroups();
  /* The All Articles page lists every post; the topic filter then narrows it instead of adding to it. */
  const isAll = Boolean(SECTIONS.find((sec) => sec.slug === category)?.allPosts);
  /* Format archives (reviews, comparisons, top-rated, how-to) list by post type, so posts filed under a topic hub
     still appear in their format's archive. */
  const formatType = SECTIONS.find((sec) => sec.slug === category)?.postType;
  const knownSlugs = new Set([
    ...groups.flatMap((g) => g.items.map((t) => t.href.replace(/^\//, ''))),
    ...SECTIONS.filter((sec) => !sec.allPosts).map((sec) => sec.slug),
  ]);
  const extraTopics = Array.from(new Set((topicsRaw ?? '').split(',').map((t) => t.trim()).filter((t) => t && t !== category && knownSlugs.has(t))));
  const selectedTopics = isAll ? extraTopics : [category, ...extraTopics];

  /* Paged by the CMS, so an archive (or a combined or all-posts listing) of any size is complete. */
  const [c, res, latestRes] = await Promise.all([
    resolveCategory(category),
    (extraTopics.length
      ? listPostSummaries({ categories: selectedTopics, pageSize: PAGE_SIZE, page })
      : isAll
        ? listPostSummaries({ pageSize: PAGE_SIZE, page })
        : formatType
          ? listPostSummaries({ postType: formatType, pageSize: PAGE_SIZE, page })
          : listPostSummaries({ category, pageSize: PAGE_SIZE, page })
    ).catch(() => null),
    listPostSummaries({ authored: true, withCover: true, pageSize: 20 }).catch(() => null),
  ]);
  /* The hub's pillar guide ("Start here" banner): first page of a topic hub only, not All Articles or a filtered view. */
  const pillarCard =
    page === 1 && !isAll && !formatType && extraTopics.length === 0
      ? await listPostSummaries({ category, pillar: true, pageSize: 1 })
          .then((r) => (r.data[0] ? toCard(r.data[0]) : null))
          .catch(() => null)
      : null;
  const total = res?.meta.pagination.total ?? 0;
  if (!c.known && total === 0) notFound();
  const posts = (res?.data ?? []).map(toCard);
  /* Page 1 layout. The strip and the tiles are image-led, so they take the newest posts with a cover (the strip falls
     back to any post); the text cards take the next three; everything else lists. Each post appears once. */
  const take = (pool: typeof posts, n: number, used: Set<typeof posts[number]>) => {
    const picked = pool.filter((card) => !used.has(card)).slice(0, n);
    picked.forEach((card) => used.add(card));
    return picked;
  };
  const used = new Set<(typeof posts)[number]>();
  const withCover = posts.filter((card) => card.image);
  const strip = page === 1 ? take(withCover, 3, used) : [];
  if (page === 1 && strip.length < 3) strip.push(...take(posts, 3 - strip.length, used));
  const tiles = page === 1 ? take(withCover, 4, used) : [];
  const textCards = page === 1 ? take(posts, 3, used) : [];
  const listed = posts.filter((card) => !used.has(card));
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > 1 && posts.length === 0) notFound();

  /* Sidebar. "Latest guides" (the template's "Weekly trending": the site has no traffic data) lists the newest
     authored guides outside this archive; "Browse Topics" (its "Popular tags") lists every hub with its post count,
     then the article formats. */
  const outsideArchive = (latestRes?.data ?? []).map(toCard).filter((card) => card.image && !card.href.startsWith(`/${category}/`));
  const latest = outsideArchive.slice(0, 5);
  /* Featured Posts slider: the next three authored guides with a cover (no editorial flag exists). */
  const featured = outsideArchive
    .slice(5, 8)
    .map((card) => ({ href: card.href, title: card.title, image: card.image as string, imageAlt: card.imageAlt, author: card.author?.name ?? null, date: card.date }));
  /* "Browse Topics": every hub, then the article formats, each with its live post count (the "Browse by category"
     widget from the product pages); the current archive is highlighted. */
  const topicSources = [
    ...groups.flatMap((g) => g.items).map((t) => ({ slug: t.href.replace(/^\//, ''), name: t.label })),
    ...SECTIONS.filter(isListedSection).map((sec) => ({ slug: sec.slug, name: sec.title, postType: sec.postType })),
  ] as { slug: string; name: string; postType?: BlsPostType }[];
  const [allTotal, ...topicCounts] = await Promise.all([
    listPostSummaries({ pageSize: 1 })
      .then((r) => r.meta.pagination.total)
      .catch(() => null),
    ...topicSources.map((t) =>
      listPostSummaries(t.postType ? { postType: t.postType, pageSize: 1 } : { category: t.slug, pageSize: 1 })
        .then((r) => r.meta.pagination.total)
        .catch(() => 0),
    ),
  ]);
  const topicRows = topicSources.map((t, i) => ({ slug: t.slug, name: t.name, count: topicCounts[i] })).filter((t) => t.count > 0 || t.slug === category);
  const topicLabel = (slug: string) => topicSources.find((t) => t.slug === slug)?.name ?? slug.replace(/-/g, ' ');

  return (
    <div data-testid={`category-${category}`}>
      <div className="container">
        <Breadcrumb items={[{ label: c.name }]} />
      </div>

      <section className="archive-header-area py-5">
        <div className="container">
          <div className="row align-items-end">
            <div className="col-12">
              <div className="title">
                <h1 className="h4 mb-0 ds-4">
                  {c.name}{' '}
                  <span className="text-600 fw-regular fs-6 bg-white rounded-8 p-2 align-middle">
                    {total} {total === 1 ? 'article' : 'articles'}
                  </span>
                </h1>
                {c.subtitle && <p className="fs-6 text-dark mt-3 mb-1">{c.subtitle}</p>}
                {c.description && <p className="fs-7 mb-0 mt-2 archive-description">{c.description}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {pillarCard && <PillarBanner card={pillarCard} hubName={c.name} />}

      {extraTopics.length > 0 && (
        <div className="container">
          <div className="archive-selected d-flex flex-wrap align-items-center gap-2 mb-4">
            <span className="fs-7 text-600">Showing posts from:</span>
            {selectedTopics.map((t) => (
              <span key={t} className="shop-pill">
                {topicLabel(t)}
              </span>
            ))}
            <Link href={`/${category}`} className="fs-7 text-dark text-decoration-underline ms-1">
              Clear
            </Link>
          </div>
        </div>
      )}

      {posts.length === 0 && (
        <div className="container pb-5">
          <p className="text-600">Articles for this topic are on the way.</p>
        </div>
      )}

      {/* Grid: three text cards, then four image tiles. */}
      {(textCards.length > 0 || tiles.length > 0) && (
        <section className="archive-grid pb-4" data-testid="archive-grid">
          <div className="container">
            {textCards.length > 0 && (
              <div className="row g-4">
                {textCards.map((card) => (
                  <div className="col-lg-4 col-md-6 col-12" key={card.key}>
                    <TextCard card={card} />
                  </div>
                ))}
              </div>
            )}
            {tiles.length > 0 && (
              <div className="row g-4 mt-1">
                {tiles.map((card) => (
                  <div className="col-lg-3 col-md-6 col-12" key={card.key}>
                    <TileCard card={card} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Strip above the list block: three row cards (thumbnail, title, date, read time). */}
      {strip.length > 0 && (
        <section className="archive-strip pt-3 pb-70" data-testid="archive-strip">
          <div className="container">
            <div className="row g-4">
              {strip.map((card) => (
                <div className="col-lg-4 col-md-6 col-12" key={card.key}>
                  <RowCard card={card} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest block: list cards beside the sidebar (Magzin home 3). The template's "Top Trending" and "Popular"
          labels would claim traffic data the site does not have. */}
      <section className="sec-2-home-3 archive-latest pb-70 overflow-hidden" data-testid="archive-latest">
        <div className="container">
          <div className="row g-lg-4 g-5">
            <div className="col-lg-8 col-12">
              {listed.length > 0 && (
                <>
                  <SectionTitle title={page === 1 ? `More in ${c.name}` : c.name} description={page === 1 ? 'Newest first' : `Page ${page} of ${pageCount}`} as="h2" />
                  <div className="row mt-2 g-4">
                    {listed.map((card) => (
                      <div className="col-12" key={card.key}>
                        <ListCard card={card} />
                      </div>
                    ))}
                  </div>
                </>
              )}
              {pageCount > 1 && (
                <div className="row mt-5">
                  <div className="col-12 d-flex justify-content-start align-items-center">
                    <Pagination basePath={`/${category}`} page={page} pageCount={pageCount} query={extraTopics.length ? `topics=${extraTopics.join(',')}` : ''} />
                  </div>
                </div>
              )}
            </div>

            <aside className="col-lg-4 col-12 archive-sidebar" aria-label="Archive sidebar">
              {latest.length > 0 && (
                <div className="mb-5">
                  <SidebarTitle>Latest guides</SidebarTitle>
                  <div className="d-flex flex-column gap-3">
                    {latest.map((card) => (
                      <div className="article card-10 style-2 sidebar-trending" key={card.key}>
                        <Link href={card.href} className="card-img" tabIndex={-1} aria-hidden>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="w-100" src={card.image as string} alt="" width={108} height={83} loading="lazy" />
                        </Link>
                        <div className="card-body">
                          <Link href={card.href}>
                            <span className="h6 mb-2 text-truncate-2 archive-side-title">{card.title}</span>
                          </Link>
                          <span className="fs-8 text-600">{card.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {topicRows.length > 0 && (
                <div className="mb-5">
                  <CategoryListWidget
                    title="Browse Topics"
                    allHref="/informative-articles"
                    allLabel="All articles"
                    total={allTotal}
                    rows={topicRows}
                    current={isAll ? undefined : category}
                    allActive={isAll && extraTopics.length === 0}
                    rowHref={(slug) => `/${slug}`}
                  />
                </div>
              )}
              {featured.length > 0 && (
                <div className="mb-5" data-testid="archive-featured-posts">
                  <SidebarTitle>Featured Posts</SidebarTitle>
                  <FeaturedPostsSlider posts={featured} />
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
