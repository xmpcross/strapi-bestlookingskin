import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCategory, listCategories, listPosts, mediaUrl } from '@/lib/strapi';
import { SECTIONS, SITE } from '@/lib/site';
import { firstImageUrl, fmtDate, postPath } from '@/lib/format';
import LoadMoreArticles from '@/components/LoadMoreArticles';
import ArticleSidebar from '@/components/ArticleSidebar';

export const revalidate = 60;
export const dynamicParams = true;

const PAGE_SIZE = 12;

// Reserved top-level routes that aren't categories — keep them out of this segment.
const RESERVED = new Set(['about', 'brands', 'search', 'newhome', 'feed.xml', 'sitemap.xml', 'robots.txt']);

type Params = { category: string };
type SearchParams = { page?: string; sort?: string };

function isReserved(slug: string) {
  return RESERVED.has(slug);
}

async function resolveCategoryName(slug: string): Promise<string> {
  const fromCms = await getCategory(slug).catch(() => null);
  if (fromCms?.name) return fromCms.name;
  const fromConfig = SECTIONS.find((s) => s.slug === slug);
  return fromConfig?.title ?? slug.replace(/-/g, ' ');
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category } = await params;
  if (isReserved(category)) return {};
  const name = await resolveCategoryName(category);
  return {
    title: name,
    description: `${name} from ${SITE.name} — ${SITE.tagline}`,
    alternates: { canonical: `/${category}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { category } = await params;
  if (isReserved(category)) notFound();

  const { page: pageRaw, sort: sortRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);
  const sort: 'newest' | 'oldest' = sortRaw === 'oldest' ? 'oldest' : 'newest';

  const [name, res, recentRes] = await Promise.all([
    resolveCategoryName(category),
    listPosts({ category, page, pageSize: PAGE_SIZE }).catch(() => null),
    // Sidebar: 5 most recent posts across all categories
    listPosts({ pageSize: 5 }).catch(() => null),
  ]);

  const allPosts = res?.data ?? [];
  // Client-side sort flip — listPosts always returns newest-first; reverse for oldest.
  const posts = sort === 'oldest' ? [...allPosts].reverse() : allPosts;
  const recentPosts = recentRes?.data ?? [];
  const pageCount = res?.meta?.pagination?.pageCount ?? 1;
  const totalPosts = res?.meta?.pagination?.total ?? posts.length;

  if (page > 1 && posts.length === 0) notFound();

  const sectionMeta = SECTIONS.find((s) => s.slug === category);

  /*
   * Sidebar categories: every post category in the CMS, not the SECTIONS
   * constant.
   *
   * SECTIONS is the format buckets -- comparison, review, how-to -- which is
   * how a post is written, not what it is about. The topic hubs are what a
   * reader browses by, they live in Strapi, and listing them here means a hub
   * added in the CMS appears with no deploy. The three group rows
   * (product-type-hubs and friends) are excluded: they hold no posts and exist
   * to organise, not to be browsed.
   *
   * Empty categories are dropped rather than shown at zero -- a row leading to
   * "No posts here yet" is worse than no row.
   */
  const GROUP_SLUGS = new Set(['product-type-hubs', 'skin-concern-hubs', 'cross-cutting-hubs']);
  const allCategories = await listCategories().catch(() => []);
  const categoryTiles = (
    await Promise.all(
      allCategories
        .filter((c) => !GROUP_SLUGS.has(c.slug))
        .map(async (c) => {
          const r = await listPosts({ category: c.slug, pageSize: 1 }).catch(() => null);
          const first = r?.data?.[0];
          return {
            href: `/${c.slug}`,
            name: c.name,
            count: r?.meta?.pagination?.total ?? 0,
            image: first ? mediaUrl(first.coverImage ?? null) ?? firstImageUrl(first.content) : null,
          };
        }),
    )
  ).filter((t) => t.count > 0);
  const toRow = (p: (typeof allPosts)[number]) => ({
    href: postPath(p),
    title: p.title,
    date: fmtDate(p.publishedAt),
    img: mediaUrl(p.coverImage ?? null) ?? firstImageUrl(p.content),
  });
  const popularRows = allPosts.slice(0, 5).map(toRow);
  const recentRows = recentPosts.map(toRow);

  return (
    <div data-testid={`category-${category}`}>
      <section className="bg-paper py-12">
        <div className="mx-auto max-w-7xl px-6">
          <p>
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-normal text-blue-700">
              Category
            </span>
          </p>
          <h1 className="mt-3 font-display font-bold tracking-tight text-ink">
            {name}
          </h1>
          {sectionMeta && (
            <>
              <p className="mt-2 max-w-3xl font-display text-[18px] font-medium leading-7 text-ink/85">
                {sectionMeta.subtitle}
              </p>
              <p className="mt-3 text-[20px] leading-8 text-ink/70">
                {sectionMeta.blurb}
              </p>
            </>
          )}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12">
          {/* Left sidebar — same widget as the single-post page's sidebar. */}
          <ArticleSidebar
            categoryTiles={categoryTiles}
            popular={popularRows}
            recent={recentRows}
            /* The body of this page is already a list of posts from this
               category; a ranked list of posts beside it repeats itself. */
            showTrending={false}
            /* Every category now, so the list is capped and scrolls rather than
               pushing everything below it off the screen. */
            categoryMaxHeight={420}
          />

          {/* Results */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4" data-testid="filters-bar">
              <p className="text-sm text-ink/55">
                {totalPosts === 0 ? 'No posts' : `${totalPosts} post${totalPosts === 1 ? '' : 's'}`}
              </p>
              <div className="flex items-center gap-2 text-sm text-ink/70">
                <span>Sort:</span>
                <Link
                  href={`/${category}${page > 1 ? `?page=${page}` : ''}`}
                  className={
                    sort === 'newest'
                      ? 'rounded-md bg-primary px-2.5 py-1 text-xs font-bold text-white'
                      : 'rounded-md border border-ink/15 px-2.5 py-1 text-xs text-ink/70 hover:border-primary hover:text-primary'
                  }
                >
                  Newest
                </Link>
                <Link
                  href={`/${category}?sort=oldest${page > 1 ? `&page=${page}` : ''}`}
                  className={
                    sort === 'oldest'
                      ? 'rounded-md bg-primary px-2.5 py-1 text-xs font-bold text-white'
                      : 'rounded-md border border-ink/15 px-2.5 py-1 text-xs text-ink/70 hover:border-primary hover:text-primary'
                  }
                >
                  Oldest
                </Link>
              </div>
            </div>

            {posts.length === 0 ? (
              <div className="mt-12 rounded-3xl border border-dashed border-ink/15 px-6 py-16 text-center text-ink/55">
                <p className="text-base">No posts here yet.</p>
              </div>
            ) : (
              <LoadMoreArticles
                category={category}
                initialPosts={posts}
                initialPage={page}
                pageCount={pageCount}
                sort={sort}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
