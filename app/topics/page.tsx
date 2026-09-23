import Link from 'next/link';
import type { Metadata } from 'next';
import { SITE } from '@/lib/site';
import { getTopicGroups } from '@/lib/nav';
import { listPostSummaries, mediaUrl, type BlsPostSummary } from '@/lib/strapi';
import { postPath } from '@/lib/format';
import Breadcrumb from '@/components/magzin/Breadcrumb';

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
 * Counts come from the CMS, so a hub added in Strapi appears here with no
 * deploy, same as the nav itself.
 */

const empty = { data: [] as BlsPostSummary[], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

export default async function TopicsPage() {
  const groups = await getTopicGroups();
  const hubs = groups.flatMap((g) => g.items);

  const [counts, pillars] = await Promise.all([
    Promise.all(hubs.map((h) => listPostSummaries({ category: h.href.replace(/^\//, ''), pageSize: 1 }).catch(() => empty))),
    listPostSummaries({ pillar: true, pageSize: 4 }).catch(() => empty),
  ]);

  const countFor = new Map(hubs.map((h, i) => [h.href, counts[i].meta.pagination.total]));
  const total = [...countFor.values()].reduce((n, c) => n + c, 0);

  return (
    <div data-testid="topics-page">
      <section className="sec-breadcumb">
        <div className="container">
          <Breadcrumb items={[{ label: 'Topics' }]} />
          <div className="row align-items-end">
            <div className="col-lg-8 col-12">
              <div className="title">
                <h1 className="h4 mb-0 ds-4">Skincare Topics</h1>
                <p className="fs-7 mb-0 mt-3">
                  {total > 0
                    ? `${total} guides across ${hubs.length} topics — written by our named authors, grouped by product type, skin concern and the things that cut across both.`
                    : 'Every skincare topic we cover, grouped by product type, skin concern and the things that cut across both.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The complete guides first: they are the deepest thing on the site and the
          right entry point for someone who has not decided what they are looking for. */}
      {pillars.data.length > 0 && (
        <section className="pt-5">
          <div className="container">
            <h2 className="h6 mb-3">Start here</h2>
            <div className="row g-4">
              {pillars.data.map((p) => {
                const cover = mediaUrl(p.coverImage ?? null);
                return (
                  <div className="col-lg-6 col-12" key={p.slug}>
                    <Link href={postPath(p)} className="d-flex gap-3 text-decoration-none pillar-card">
                      {cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cover}
                          alt=""
                          width={120}
                          height={90}
                          loading="lazy"
                          style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, flex: 'none' }}
                        />
                      )}
                      <span>
                        <span className="d-block fw-semi-bold text-dark">{p.title}</span>
                        {p.excerpt && <span className="d-block fs-8 text-600 mt-1">{p.excerpt.slice(0, 120)}</span>}
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="pt-5 pb-70">
        <div className="container">
          {groups.length === 0 ? (
            <p className="fs-7 text-600">No topics yet.</p>
          ) : (
            groups.map((group) => (
              <div className="mb-5" key={group.slug}>
                <h2 className="h6 mb-3">{group.label}</h2>
                <div className="row g-3">
                  {group.items.map((item) => {
                    const count = countFor.get(item.href) ?? 0;
                    return (
                      <div className="col-lg-3 col-sm-6 col-12" key={item.href}>
                        <Link href={item.href} className="d-flex justify-content-between align-items-center p-3 border rounded text-decoration-none topic-tile">
                          <span className="fw-semi-bold text-dark">{item.label}</span>
                          <span className="fs-8 text-600">
                            {count} {count === 1 ? 'guide' : 'guides'}
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
      </section>
    </div>
  );
}
