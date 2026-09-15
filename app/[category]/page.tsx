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

export const revalidate = 60;
export const dynamicParams = true;

/* Archive in the Magzin category layout (magzin.alithemes.net/category/lifestyle): archive header, a three-column
   grid of card-7 posts beside a sidebar, then pagination. Twelve posts a page (four rows). */
const PAGE_SIZE = 12;

// Reserved top-level routes that aren't categories — keep them out of this segment.
const RESERVED = new Set(['about', 'brands', 'search', 'newhome', 'feed.xml', 'sitemap.xml', 'robots.txt']);

type Params = { category: string };
type SearchParams = { page?: string };

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
  const { page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);
  const c = await resolveCategory(category);
  const description = c.description ? clip(c.description) : `${c.name}: guides and reviews from ${SITE.name}.`;
  return {
    title: page > 1 ? `${c.name} (page ${page})` : c.name,
    description,
    alternates: { canonical: page > 1 ? `/${category}?page=${page}` : `/${category}` },
    openGraph: { title: c.name, description, url: `${SITE.url}/${category}` },
  };
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<SearchParams> }) {
  const { category } = await params;
  if (RESERVED.has(category)) notFound();
  const { page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);

  const start = (page - 1) * PAGE_SIZE;
  const [c, res, groups, latestRes] = await Promise.all([
    resolveCategory(category),
    listPostSummaries({ category, pageSize: 100, page: 1 }).catch(() => null),
    getTopicGroups(),
    listPostSummaries({ authored: true, withCover: true, pageSize: 6 }).catch(() => null),
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
  const latest = (latestRes?.data ?? [])
    .map(toCard)
    .filter((card) => card.image && !card.href.startsWith(`/${category}/`))
    .slice(0, 3);
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
                    <Pagination basePath={`/${category}`} page={page} pageCount={pageCount} />
                  </div>
                </div>
              )}
            </div>

            <aside className="col-lg-3 col-12 archive-sidebar" aria-label="Archive sidebar">
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
              {(topicTags.length > 0 || formatTags.length > 0) && (
                <div className="mb-5">
                  <SidebarTitle>Browse Topics</SidebarTitle>
                  <ul className="list-unstyled d-flex flex-wrap gap-2 ps-0 m-0">
                    {topicTags.map((t) => (
                      <li key={t.href}>
                        <Link href={t.href} className="tag-item">
                          <span className="fs-7">{t.label}</span>
                          <span className="number">{t.count}</span>
                        </Link>
                      </li>
                    ))}
                    {formatTags.map((t) => (
                      <li key={t.href}>
                        <Link href={t.href} className="tag-item">
                          <span className="fs-7">{t.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
