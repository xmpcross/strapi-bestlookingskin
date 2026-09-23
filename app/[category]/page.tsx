import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCategory, listPostSummaries, type BlsPostType } from '@/lib/strapi';
import { SECTIONS, SITE, isListedSection } from '@/lib/site';
import { getTopicGroups } from '@/lib/nav';
import { toCard } from '@/lib/post-card';
import { ListCard, SectionTitle, TileCard } from '@/components/magzin/cards';
import SidebarTitle from '@/components/magzin/SidebarTitle';
import Breadcrumb from '@/components/magzin/Breadcrumb';
import Pagination from '@/components/magzin/Pagination';
import AdSlot from '@/components/AdSlot';
import CategoryListWidget from '@/components/magzin/CategoryListWidget';
import FeaturedPostsSlider from '@/components/FeaturedPostsSlider';
import PillarBanner from '@/components/pillar/PillarBanner';
import CategoryIntro from '@/components/CategoryIntro';

export const revalidate = 60;
export const dynamicParams = true;

/* Archive, sixteen posts a page: filters in a left sidebar (topic, article type, sort), results on the right --
   three image tiles for the newest guides on an unfiltered first page, then list cards. Filters are plain links
   (?type=, ?sort=, ?topics=), so they work without JavaScript; filtered views are noindex. */
const PAGE_SIZE = 16;

// Reserved top-level routes that aren't categories — keep them out of this segment.
const RESERVED = new Set(['about', 'brands', 'search', 'newhome', 'feed.xml', 'sitemap.xml', 'robots.txt']);

type Params = { category: string };
type SearchParams = { page?: string; topics?: string; type?: string; sort?: string };

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
  const { page: pageRaw, topics, type, sort } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);
  const c = await resolveCategory(category);
  const description = c.metaDescription ?? (c.description ? clip(c.description) : `${c.name}: guides and reviews from ${SITE.name}.`);
  const title = c.seoTitle ?? c.name;
  return {
    title: page > 1 ? `${title} (page ${page})` : title,
    description,
    alternates: { canonical: page > 1 ? `/${category}?page=${page}` : `/${category}` },
    openGraph: { title, description, url: `${SITE.url}/${category}` },
    /* A combined-topics, type or sort view is a filter of an existing archive: keep it out of the index. */
    ...(topics || type || sort ? { robots: { index: false, follow: true } } : {}),
  };
}

/* Article types offered as a filter (the post's own postType), in display order. */
const TYPES: { key: BlsPostType; label: string }[] = [
  { key: 'informative', label: 'Explainers' },
  { key: 'how-to-guide', label: 'How-to guides' },
  { key: 'product-review', label: 'Reviews' },
  { key: 'product-comparison', label: 'Comparisons' },
  { key: 'top-rated', label: 'Top-rated roundups' },
  { key: 'product-roundup', label: 'Roundups' },
];
const SORTS = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'az', label: 'A–Z' },
] as const;
type Sort = (typeof SORTS)[number]['key'];

export default async function CategoryPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<SearchParams> }) {
  const { category } = await params;
  if (RESERVED.has(category)) notFound();
  /* Retired format archives (reviews, comparisons, top-rated, how-to): their posts live in the topic hubs now. */
  const retiredTo = SECTIONS.find((sec) => sec.slug === category)?.redirectTo;
  if (retiredTo) permanentRedirect(retiredTo);
  const { page: pageRaw, topics: topicsRaw, type: typeRaw, sort: sortRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);
  const sort: Sort = sortRaw === 'oldest' || sortRaw === 'az' ? sortRaw : 'newest';
  const type = TYPES.find((t) => t.key === typeRaw)?.key;

  const groups = await getTopicGroups();
  /* The All Articles page lists every post; the topic filter then narrows it instead of adding to it. */
  const isAll = Boolean(SECTIONS.find((sec) => sec.slug === category)?.allPosts);
  /* Format archives list by post type, so posts filed under a topic hub still appear in their format's archive. */
  const formatType = SECTIONS.find((sec) => sec.slug === category)?.postType;
  const knownSlugs = new Set([
    ...groups.flatMap((g) => g.items.map((t) => t.href.replace(/^\//, ''))),
    ...SECTIONS.filter((sec) => !sec.allPosts).map((sec) => sec.slug),
  ]);
  const extraTopics = Array.from(new Set((topicsRaw ?? '').split(',').map((t) => t.trim()).filter((t) => t && t !== category && knownSlugs.has(t))));
  const selectedTopics = isAll ? extraTopics : [category, ...extraTopics];
  const filtered = Boolean(type || sort !== 'newest' || extraTopics.length);

  /* The archive's own scope, before the type filter: the base the type counts are taken from. */
  const scope = extraTopics.length
    ? { categories: selectedTopics }
    : isAll
      ? {}
      : formatType
        ? { postType: formatType }
        : { category };

  const [c, res, latestRes] = await Promise.all([
    resolveCategory(category),
    listPostSummaries({ ...scope, ...(type ? { postType: type } : {}), sort, pageSize: PAGE_SIZE, page }).catch(() => null),
    listPostSummaries({ authored: true, withCover: true, pageSize: 20 }).catch(() => null),
  ]);
  /* The hub's pillar guide ("Start here" banner): first page of a topic hub only, not All Articles or a filtered view. */
  const pillarCard =
    page === 1 && !isAll && !formatType && !filtered
      ? await listPostSummaries({ category, pillar: true, pageSize: 1 })
          .then((r) => (r.data[0] ? toCard(r.data[0]) : null))
          .catch(() => null)
      : null;
  const total = res?.meta.pagination.total ?? 0;
  if (!c.known && total === 0 && !filtered) notFound();
  const posts = (res?.data ?? []).map(toCard);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > 1 && posts.length === 0) notFound();

  /* Unfiltered first page: the three newest guides with a cover lead as image tiles; the rest list. */
  const tiles = page === 1 && !filtered ? posts.filter((card) => card.image).slice(0, 3) : [];
  const listed = posts.filter((card) => !tiles.includes(card));

  /* Sidebar data. */
  const outsideArchive = (latestRes?.data ?? []).map(toCard).filter((card) => card.image && !card.href.startsWith(`/${category}/`));
  const latest = outsideArchive.slice(0, 4);
  const featured = outsideArchive
    .slice(4, 7)
    .map((card) => ({ href: card.href, title: card.title, image: card.image as string, imageAlt: card.imageAlt, author: card.author?.name ?? null, date: card.date }));
  const topicSources = [
    ...groups.flatMap((g) => g.items).map((t) => ({ slug: t.href.replace(/^\//, ''), name: t.label })),
    ...SECTIONS.filter(isListedSection).map((sec) => ({ slug: sec.slug, name: sec.title, postType: sec.postType })),
  ] as { slug: string; name: string; postType?: BlsPostType }[];
  const [allTotal, topicCounts, typeCounts] = await Promise.all([
    listPostSummaries({ pageSize: 1 })
      .then((r) => r.meta.pagination.total)
      .catch(() => null),
    Promise.all(
      topicSources.map((t) =>
        listPostSummaries(t.postType ? { postType: t.postType, pageSize: 1 } : { category: t.slug, pageSize: 1 })
          .then((r) => r.meta.pagination.total)
          .catch(() => 0),
      ),
    ),
    /* Type counts within this archive; a format archive is already one type, so it gets no type filter. */
    formatType
      ? Promise.resolve([] as number[])
      : Promise.all(
          TYPES.map((t) =>
            listPostSummaries({ ...scope, postType: t.key, pageSize: 1 })
              .then((r) => r.meta.pagination.total)
              .catch(() => 0),
          ),
        ),
  ]);
  const topicRows = topicSources.map((t, i) => ({ slug: t.slug, name: t.name, count: topicCounts[i] })).filter((t) => t.count > 0 || t.slug === category);
  const topicLabel = (slug: string) => topicSources.find((t) => t.slug === slug)?.name ?? slug.replace(/-/g, ' ');
  const typeRows = TYPES.map((t, i) => ({ ...t, count: typeCounts[i] ?? 0 })).filter((t) => t.count > 0 || t.key === type);
  const scopeTotal = typeRows.reduce((n, t) => n + t.count, 0);

  /* Links that keep the other filters. */
  const href = (next: { type?: string | null; sort?: string | null; page?: number }) => {
    const q = new URLSearchParams();
    if (extraTopics.length) q.set('topics', extraTopics.join(','));
    const t = next.type === undefined ? type : next.type;
    const s = next.sort === undefined ? sort : next.sort;
    if (t) q.set('type', t);
    if (s && s !== 'newest') q.set('sort', s);
    if (next.page && next.page > 1) q.set('page', String(next.page));
    const qs = q.toString();
    return qs ? `/${category}?${qs}` : `/${category}`;
  };
  const pageQuery = (() => {
    const q = new URLSearchParams();
    if (extraTopics.length) q.set('topics', extraTopics.join(','));
    if (type) q.set('type', type);
    if (sort !== 'newest') q.set('sort', sort);
    return q.toString();
  })();

  return (
    <div data-testid={`category-${category}`}>
      <div className="container">
        <Breadcrumb items={[{ label: c.name }]} />
      </div>

      <section className="archive-header-area py-5">
        <div className="container">
          <div className="title">
            <h1 className="h4 mb-0 ds-4">
              {c.name}{' '}
              <span className="text-600 fw-regular fs-6 bg-white rounded-8 p-2 align-middle">
                {total} {total === 1 ? 'article' : 'articles'}
              </span>
            </h1>
            {c.subtitle && <p className="fs-6 text-dark mt-3 mb-1">{c.subtitle}</p>}
            {c.description && <CategoryIntro text={c.description} />}
          </div>
        </div>
      </section>

      {pillarCard && <PillarBanner card={pillarCard} hubName={c.name} />}

      <section className="archive-latest pb-70" data-testid="archive-latest">
        <div className="container">
          <div className="row g-5">
            {/* Filters and widgets */}
            <aside className="col-lg-3 col-12 archive-sidebar order-2 order-lg-1" aria-label="Filters">
              {typeRows.length > 1 && (
                <div className="shop-widget" data-testid="archive-type-filter">
                  <SidebarTitle>Article type</SidebarTitle>
                  <ul className="list-unstyled ps-0 m-0 archive-filter-list">
                    <li>
                      <Link href={href({ type: null, page: 1 })} className={`archive-filter${!type ? ' is-active' : ''}`} aria-current={!type ? 'true' : undefined}>
                        <span>All types</span>
                        <span className="number">{scopeTotal}</span>
                      </Link>
                    </li>
                    {typeRows.map((t) => (
                      <li key={t.key}>
                        <Link href={href({ type: t.key, page: 1 })} className={`archive-filter${type === t.key ? ' is-active' : ''}`} aria-current={type === t.key ? 'true' : undefined}>
                          <span>{t.label}</span>
                          <span className="number">{t.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="shop-widget" data-testid="archive-sort">
                <SidebarTitle>Sort by</SidebarTitle>
                <ul className="list-unstyled ps-0 m-0 d-flex flex-wrap gap-2">
                  {SORTS.map((s) => (
                    <li key={s.key}>
                      <Link href={href({ sort: s.key, page: 1 })} className={`tag-item shop-chip${sort === s.key ? ' shop-active' : ''}`} aria-current={sort === s.key ? 'true' : undefined}>
                        {s.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {topicRows.length > 0 && (
                <div className="shop-widget">
                  <CategoryListWidget
                    title="Browse Topics"
                    allHref="/articles"
                    allLabel="All articles"
                    total={allTotal}
                    rows={topicRows}
                    current={isAll ? undefined : category}
                    allActive={isAll && extraTopics.length === 0}
                    rowHref={(slug) => `/${slug}`}
                  />
                </div>
              )}

              <AdSlot kind="display" className="mb-5" />

              {latest.length > 0 && (
                <div className="shop-widget">
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

              {featured.length > 0 && (
                <div className="shop-widget" data-testid="archive-featured-posts">
                  <SidebarTitle>Featured Posts</SidebarTitle>
                  <FeaturedPostsSlider posts={featured} />
                </div>
              )}
            </aside>

            {/* Results */}
            <div className="col-lg-9 col-12 order-1 order-lg-2">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4 pb-3 border-bottom">
                <p className="mb-0 fs-7 text-600">
                  {total} {total === 1 ? 'article' : 'articles'}
                  {type ? ` · ${TYPES.find((t) => t.key === type)?.label}` : ''}
                  {sort !== 'newest' ? ` · ${SORTS.find((s) => s.key === sort)?.label}` : ''}
                  {pageCount > 1 ? ` · page ${page} of ${pageCount}` : ''}
                </p>
                {filtered && (
                  <Link href={`/${category}`} className="bls-link fs-7 fw-medium">
                    Clear filters
                  </Link>
                )}
              </div>

              {extraTopics.length > 0 && (
                <div className="archive-selected d-flex flex-wrap align-items-center gap-2 mb-4">
                  <span className="fs-7 text-600">Showing posts from:</span>
                  {selectedTopics.map((t) => (
                    <span key={t} className="shop-pill">
                      {topicLabel(t)}
                    </span>
                  ))}
                </div>
              )}

              {posts.length === 0 && <p className="text-600">No articles match these filters yet.</p>}

              {tiles.length > 0 && (
                <div className="row g-4 mb-5" data-testid="archive-grid">
                  {tiles.map((card) => (
                    <div className="col-md-4 col-12" key={card.key}>
                      <TileCard card={card} />
                    </div>
                  ))}
                </div>
              )}

              {listed.length > 0 && (
                <>
                  {tiles.length > 0 && <SectionTitle title={`More in ${c.name}`} as="h2" />}
                  <div className="row mt-2 g-4">
                    {listed.map((card, i) => (
                      <div className="col-12" key={card.key}>
                        <ListCard card={card} />
                        {/* One display unit part-way down the list. */}
                        {i === 5 && <AdSlot kind="display" className="mt-4" />}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {pageCount > 1 && (
                <div className="row mt-5">
                  <div className="col-12 d-flex justify-content-start align-items-center">
                    <Pagination basePath={`/${category}`} page={page} pageCount={pageCount} query={pageQuery} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
