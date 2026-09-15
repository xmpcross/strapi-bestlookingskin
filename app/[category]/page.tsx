import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCategory, listPostSummaries } from '@/lib/strapi';
import { SECTIONS, SITE } from '@/lib/site';
import { getTopicGroups } from '@/lib/nav';
import { toCard } from '@/lib/post-card';
import { FeatureCard, TileCard } from '@/components/magzin/cards';
import Breadcrumb from '@/components/magzin/Breadcrumb';
import Pagination from '@/components/magzin/Pagination';

export const revalidate = 60;
export const dynamicParams = true;

/* Archive in the Magzin "Archive 3" layout: a feature and four tiles, then a grid of four per row. */
const FIRST_PAGE = 17; // 1 feature + 4 tiles + 12 in the grid
const PAGE_SIZE = 16;

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

  /* Page 1 holds 17 posts, later pages 16: fetch by offset so no post is skipped or repeated. */
  const start = page === 1 ? 0 : FIRST_PAGE + (page - 2) * PAGE_SIZE;
  const size = page === 1 ? FIRST_PAGE : PAGE_SIZE;
  const [c, res, groups] = await Promise.all([
    resolveCategory(category),
    listPostSummaries({ category, pageSize: 100, page: 1 }).catch(() => null),
    getTopicGroups(),
  ]);
  const all = res?.data ?? [];
  const total = res?.meta.pagination.total ?? all.length;
  if (!c.known && total === 0) notFound();
  const posts = all.slice(start, start + size).map(toCard);
  const pageCount = total <= FIRST_PAGE ? 1 : 1 + Math.ceil((total - FIRST_PAGE) / PAGE_SIZE);
  if (page > 1 && posts.length === 0) notFound();

  const lead = page === 1 ? posts.slice(0, 5) : [];
  const grid = page === 1 ? posts.slice(5) : posts;
  const [feature, ...tiles] = lead;
  const otherTopics = groups.flatMap((g) => g.items).filter((t) => t.href !== `/${category}`);

  return (
    <div data-testid={`category-${category}`}>
      <section className="sec-breadcumb">
        <div className="container">
          <Breadcrumb items={[{ label: c.name }]} />
          <div className="row align-items-end">
            <div className="col-lg-8 col-12">
              <div className="title">
                <h1 className="h4 mb-0 ds-4">
                  {c.name}
                  <span className="text-600 fw-regular fs-6 bg-white rounded-8 p-2 ms-2 align-middle">
                    {total} {total === 1 ? 'article' : 'articles'}
                  </span>
                </h1>
                {c.subtitle && <p className="fs-6 text-dark mt-3 mb-1">{c.subtitle}</p>}
                {c.description && <p className="fs-7 mb-0 mt-2">{c.description}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec-1-archive-3 pt-5 pb-70">
        {feature && (
          <div className="container">
            <div className="row mt-2 g-4">
              <div className="col-lg-6">
                <FeatureCard card={feature} priority />
              </div>
              {[tiles.slice(0, 2), tiles.slice(2, 4)].map((col, i) =>
                col.length ? (
                  <div className="col-lg-3" key={i}>
                    <div className="row g-4">
                      {col.map((card) => (
                        <div className="col-lg-12 col-md-6" key={card.key}>
                          <TileCard card={card} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          </div>
        )}
        {grid.length > 0 && (
          <div className="container">
            <div className="row g-4 mt-4">
              {grid.map((card) => (
                <div className="col-lg-3 col-md-6 col-12" key={card.key}>
                  <TileCard card={card} />
                </div>
              ))}
            </div>
          </div>
        )}
        {total === 0 && (
          <div className="container">
            <p className="text-600 mt-4">Articles for this topic are on the way.</p>
          </div>
        )}
        <div className="container">
          <div className="row mt-5">
            <div className="col-12 d-flex justify-content-center align-items-center">
              <Pagination basePath={`/${category}`} page={page} pageCount={pageCount} />
            </div>
          </div>
        </div>
      </section>

      {otherTopics.length > 0 && (
        <section className="pb-70">
          <div className="container">
            <h2 className="h5 mb-4">Browse other topics</h2>
            <div className="block-tag d-flex flex-wrap gap-2">
              {otherTopics.map((t) => (
                <Link key={t.href} href={t.href} className="tag-item">
                  <span>{t.label}</span>
                </Link>
              ))}
              {SECTIONS.filter((s) => s.slug !== category).map((s) => (
                <Link key={s.slug} href={`/${s.slug}`} className="tag-item">
                  <span>{s.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
