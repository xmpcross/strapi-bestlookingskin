import Link from 'next/link';
import type { Metadata } from 'next';
import { getTopicGroups } from '@/lib/nav';
import { listPostSummaries, type BlsPostSummary } from '@/lib/strapi';
import { postPath } from '@/lib/format';
import { toCard } from '@/lib/post-card';
import Breadcrumb from '@/components/magzin/Breadcrumb';
import CategoryListWidget from '@/components/magzin/CategoryListWidget';
import SidebarTitle from '@/components/magzin/SidebarTitle';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Skincare Topics',
  description:
    'Every skincare topic covered on BestLooking.Skin — serums, cleansers, sunscreen, acne, anti-aging, routines and ingredients — with the number of guides in each.',
  alternates: { canonical: '/topics' },
};

/*
 * The editorial index.
 *
 * Built because "Topics" in the header was a mega-menu whose trigger was
 * `<a href="#">`: the site's entire writing axis hung off a nav item with no
 * destination. That costs three things -- a page that could rank for
 * "skincare guides" style queries, a crawlable route into the hubs that does
 * not depend on a hover menu, and somewhere for a reader to land who wants to
 * browse rather than search.
 *
 * Layout matches /products: filters in a left sidebar, results on the right. The filters are plain links
 * (?group=, ?sort=), so they work without JavaScript and every filtered view has its own URL; the canonical
 * stays /topics. Counts and covers come from the CMS, so a hub added in Strapi appears with no deploy.
 */

const empty = { data: [] as BlsPostSummary[], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

const SORTS = [
  { key: 'guides', label: 'Most guides' },
  { key: 'az', label: 'A–Z' },
] as const;
type Sort = (typeof SORTS)[number]['key'];

type SearchParams = { group?: string; sort?: string };

export default async function TopicsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { group: groupParam, sort: sortParam } = await searchParams;
  const sort: Sort = sortParam === 'az' ? 'az' : 'guides';

  const groups = await getTopicGroups();
  const hubs = groups.flatMap((g) => g.items);

  const [counts, latest, pillars] = await Promise.all([
    Promise.all(hubs.map((h) => listPostSummaries({ category: h.href.replace(/^\//, ''), pageSize: 1 }).catch(() => empty))),
    Promise.all(hubs.map((h) => listPostSummaries({ category: h.href.replace(/^\//, ''), pageSize: 1, withCover: true }).catch(() => empty))),
    listPostSummaries({ pillar: true, pageSize: 4 }).catch(() => empty),
  ]);

  const info = new Map(
    hubs.map((h, i) => {
      const post = latest[i].data[0];
      return [h.href, { count: counts[i].meta.pagination.total, post, image: post ? toCard(post).image : null }];
    }),
  );
  const total = [...info.values()].reduce((n, t) => n + t.count, 0);

  const active = groups.find((g) => g.slug === groupParam);
  const shown = (active ? [active] : groups).map((g) => ({
    ...g,
    items: [...g.items].sort((a, b) =>
      sort === 'az' ? a.label.localeCompare(b.label) : (info.get(b.href)?.count ?? 0) - (info.get(a.href)?.count ?? 0),
    ),
  }));
  const shownTopics = shown.reduce((n, g) => n + g.items.length, 0);

  const qs = (next: SearchParams) => {
    const p = new URLSearchParams();
    const group = 'group' in next ? next.group : active?.slug;
    const s = 'sort' in next ? next.sort : sort;
    if (group) p.set('group', group);
    if (s && s !== 'guides') p.set('sort', s);
    const q = p.toString();
    return q ? `/topics?${q}` : '/topics';
  };

  return (
    <div data-testid="topics-page">
      <section className="sec-breadcumb">
        <div className="container">
          <Breadcrumb items={[{ label: 'Topics' }]} />
          <div className="row align-items-end">
            <div className="col-12">
              <div className="title">
                <h1 className="h4 mb-0 ds-4">Skincare Topics</h1>
                <p className="bls-page-lead mt-3 mb-0">
                  {total > 0
                    ? `${total} guides across ${hubs.length} topics — written by our named authors, grouped by product type, skin concern and the things that cut across both.`
                    : 'Every skincare topic we cover, grouped by product type, skin concern and the things that cut across both.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-5 pb-70">
        <div className="container">
          <div className="row g-5">
            {/* Filters */}
            <aside className="col-lg-3 col-12" aria-label="Filter topics">
              <div className="shop-widget">
                <CategoryListWidget
                  title="Filter by group"
                  allHref={qs({ group: undefined })}
                  allLabel="All topics"
                  allActive={!active}
                  total={total}
                  rows={groups.map((g) => ({
                    slug: g.slug,
                    name: g.label,
                    count: g.items.reduce((n, it) => n + (info.get(it.href)?.count ?? 0), 0),
                  }))}
                  current={active?.slug}
                  rowHref={(slug) => qs({ group: slug })}
                />
              </div>

              <div className="shop-widget">
                <SidebarTitle>Sort topics</SidebarTitle>
                <ul className="list-unstyled ps-0 m-0 d-flex flex-wrap gap-2">
                  {SORTS.map((s) => (
                    <li key={s.key}>
                      <Link
                        href={qs({ sort: s.key })}
                        className={`tag-item shop-chip${sort === s.key ? ' shop-active' : ''}`}
                        aria-current={sort === s.key ? 'true' : undefined}
                      >
                        {s.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {pillars.data.length > 0 && (
                <div className="shop-widget">
                  <SidebarTitle>Start here</SidebarTitle>
                  <ul className="list-unstyled ps-0 m-0 topics-start">
                    {pillars.data.map((p) => {
                      const cover = toCard(p).image;
                      return (
                        <li key={p.slug}>
                          <Link href={postPath(p)} className="d-flex gap-3 align-items-center text-decoration-none">
                            {cover && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={cover} alt="" width={64} height={48} loading="lazy" />
                            )}
                            <span className="fs-7 fw-semi-bold text-dark">{p.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </aside>

            {/* Topics */}
            <div className="col-lg-9 col-12">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4 pb-3 border-bottom">
                <h2 className="h5 mb-0">
                  {active ? active.label : 'All topics'}{' '}
                  <span className="fs-7 text-600 fw-normal">
                    {shownTopics} {shownTopics === 1 ? 'topic' : 'topics'}
                  </span>
                </h2>
                {active && (
                  <Link href={qs({ group: undefined })} className="bls-link fs-7 fw-medium">
                    Clear filter
                  </Link>
                )}
              </div>

              {shown.length === 0 ? (
                <p className="fs-7 text-600">No topics yet.</p>
              ) : (
                shown.map((g) => (
                  <div className="mb-5" key={g.slug}>
                    {!active && <h3 className="h6 mb-3">{g.label}</h3>}
                    <div className="row g-4">
                      {g.items.map((item) => {
                        const t = info.get(item.href);
                        const count = t?.count ?? 0;
                        return (
                          <div className="col-xl-4 col-sm-6 col-12" key={item.href}>
                            <Link href={item.href} className="topic-card h-100">
                              <span className="topic-card-media">
                                {t?.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={t.image} alt="" loading="lazy" />
                                ) : null}
                              </span>
                              <span className="topic-card-body">
                                <span className="d-flex justify-content-between align-items-baseline gap-2">
                                  <span className="h6 mb-0 text-dark">{item.label}</span>
                                  <span className="fs-8 text-600 text-nowrap">
                                    {count} {count === 1 ? 'guide' : 'guides'}
                                  </span>
                                </span>
                                {t?.post && <span className="topic-card-latest fs-8 text-600">Latest: {t.post.title}</span>}
                              </span>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
