import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCategory, listPostSummaries } from '@/lib/strapi';
import { SECTIONS, SITE } from '@/lib/site';
import { getTopicGroups } from '@/lib/nav';
import { toCard } from '@/lib/post-card';
import { TextCard } from '@/components/magzin/cards';
import SidebarTitle from '@/components/magzin/SidebarTitle';
import Breadcrumb from '@/components/magzin/Breadcrumb';
import Pagination from '@/components/magzin/Pagination';
import TopicMultiSelect from '@/components/magzin/TopicMultiSelect';
import FeaturedPostsSlider from '@/components/FeaturedPostsSlider';

export const revalidate = 60;
export const dynamicParams = true;

/* Archive in the Magzin category layout (magzin.alithemes.net/category/lifestyle): archive header, a three-column
   grid of card-7 posts beside a sidebar, then pagination. Twelve posts a page (four rows). */
const PAGE_SIZE = 12;

// Reserved top-level routes that aren't categories — keep them out of this segment.
const RESERVED = new Set(['about', 'brands', 'search', 'newhome', 'feed.xml', 'sitemap.xml', 'robots.txt']);

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
    known: Boolean(fromCms || section),
  };
}

const clip = (s: string, n = 158) => (s.length <= n ? s : `${s.slice(0, s.lastIndexOf(' ', n - 1))}…`);

export async function generateMetadata({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const { category } = await params;
  if (RESERVED.has(category)) return {};
  const { page: pageRaw, topics } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);
  const c = await resolveCategory(category);
  const description = c.description ? clip(c.description) : `${c.name}: guides and reviews from ${SITE.name}.`;
  return {
    title: page > 1 ? `${c.name} (page ${page})` : c.name,
    description,
    alternates: { canonical: page > 1 ? `/${category}?page=${page}` : `/${category}` },
    openGraph: { title: c.name, description, url: `${SITE.url}/${category}` },
    /* A combined-topics view is a filter of existing archives: keep it out of the index. */
    ...(topics ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<SearchParams> }) {
  const { category } = await params;
  if (RESERVED.has(category)) notFound();
  const { page: pageRaw, topics: topicsRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);

  /* Topics picked in the Browse Topics dropdown, on top of this archive's own (only known hub / format slugs). */
  const groups = await getTopicGroups();
  const knownSlugs = new Set([...groups.flatMap((g) => g.items.map((t) => t.href.replace(/^\//, ''))), ...SECTIONS.map((sec) => sec.slug)]);
  const extraTopics = Array.from(new Set((topicsRaw ?? '').split(',').map((t) => t.trim()).filter((t) => t && t !== category && knownSlugs.has(t))));
  const selectedTopics = [category, ...extraTopics];

  const start = (page - 1) * PAGE_SIZE;
  const [c, res, latestRes] = await Promise.all([
    resolveCategory(category),
    (extraTopics.length ? listPostSummaries({ categories: selectedTopics, pageSize: 100, page: 1 }) : listPostSummaries({ category, pageSize: 100, page: 1 })).catch(() => null),
    listPostSummaries({ authored: true, withCover: true, pageSize: 12 }).catch(() => null),
  ]);
  const all = res?.data ?? [];
  const total = res?.meta.pagination.total ?? all.length;
  if (!c.known && total === 0) notFound();
  const posts = all.slice(start, start + PAGE_SIZE).map(toCard);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > 1 && posts.length === 0) notFound();

  /* Sidebar. "Latest guides" (the template's "Weekly trending": the site has no traffic data) lists the newest
     authored guides outside this archive; "Browse Topics" (its "Popular tags") lists every hub with its post count,
     then the article formats. */
  const outsideArchive = (latestRes?.data ?? []).map(toCard).filter((card) => card.image && !card.href.startsWith(`/${category}/`));
  const latest = outsideArchive.slice(0, 3);
  /* Featured Posts slider above Latest guides: the next three authored guides with a cover (no editorial flag exists). */
  const featured = outsideArchive
    .slice(3, 6)
    .map((card) => ({ href: card.href, title: card.title, image: card.image as string, imageAlt: card.imageAlt, author: card.author?.name ?? null, date: card.date }));
  const hubs = groups.flatMap((g) => g.items).filter((t) => t.href !== `/${category}`);
  const hubCounts = await Promise.all(
    hubs.map((h) =>
      listPostSummaries({ category: h.href.replace(/^\//, ''), pageSize: 1, withCover: true })
        .then((r) => r.meta.pagination.total)
        .catch(() => 0),
    ),
  );
  const topicTags = hubs.map((h, i) => ({ ...h, count: hubCounts[i] })).filter((t) => t.count > 0);
  const formatTags = SECTIONS.filter((sec) => sec.slug !== category).map((sec) => ({ label: sec.title, href: `/${sec.slug}` }));
  const topicOptions = [
    { slug: category, label: c.name },
    ...topicTags.map((t) => ({ slug: t.href.replace(/^\//, ''), label: t.label, count: t.count })),
    ...formatTags.map((t) => ({ slug: t.href.replace(/^\//, ''), label: t.label })),
  ];
  const topicLabel = (slug: string) => topicOptions.find((o) => o.slug === slug)?.label ?? slug.replace(/-/g, ' ');

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

      <section className="pb-70">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-9 col-12">
              {extraTopics.length > 0 && (
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
              )}
              {posts.length > 0 ? (
                <div className="row g-4">
                  {posts.map((card) => (
                    <div className="col-lg-4 col-md-6 col-12" key={card.key}>
                      <TextCard card={card} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-600">Articles for this topic are on the way.</p>
              )}
              {pageCount > 1 && (
                <div className="row mt-5">
                  <div className="col-12 d-flex justify-content-start align-items-center">
                    <Pagination basePath={`/${category}`} page={page} pageCount={pageCount} query={extraTopics.length ? `topics=${extraTopics.join(',')}` : ''} />
                  </div>
                </div>
              )}
            </div>

            <aside className="col-lg-3 col-12 archive-sidebar" aria-label="Archive sidebar">
              {featured.length > 0 && (
                <div className="mb-5" data-testid="archive-featured-posts">
                  <SidebarTitle>Featured Posts</SidebarTitle>
                  <FeaturedPostsSlider posts={featured} />
                </div>
              )}
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
              {topicOptions.length > 1 && (
                <div className="mb-5">
                  <SidebarTitle>Browse Topics</SidebarTitle>
                  <TopicMultiSelect basePath={`/${category}`} current={category} options={topicOptions} selected={selectedTopics} />
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
