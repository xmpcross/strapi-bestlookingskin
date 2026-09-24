import Link from 'next/link';
import { getTopicGroups } from '@/lib/nav';
import { listPostSummaries } from '@/lib/strapi';
import { toCard } from '@/lib/post-card';
import Breadcrumb from '@/components/magzin/Breadcrumb';

/*
 * The three hub-group pages (/product-type-hubs, /skin-concern-hubs, /cross-cutting-hubs). They are parent rows in
 * Strapi that hold no posts themselves, so the generic archive rendered them as "0 articles" -- thin pages Search
 * Console would file as soft 404s (GSC audit 24 Sep 2026). Each now lists its hubs, with a short introduction.
 */
export const HUB_GROUP_INTROS: Record<string, { title: string; intro: string; description: string }> = {
  'product-type-hubs': {
    title: 'Skincare guides by product',
    intro:
      'Start from the product you are shopping for. Each of these hubs covers one type of product — what it does, which ingredients matter, how to use it and how the popular options compare — so you can choose with the whole category in view.',
    description: 'Skincare guides by product type: serums, moisturizers, cleansers, sunscreen, exfoliants, eye creams and face masks.',
  },
  'skin-concern-hubs': {
    title: 'Skincare guides by concern',
    intro:
      'Start from what you want to change about your skin. These hubs explain what causes each concern, which ingredients have the best evidence behind them, and how to build a routine around them, with notes on when it is worth seeing a dermatologist.',
    description: 'Skincare guides by skin concern: acne, anti-aging, hyperpigmentation and sensitive skin, with routines and ingredients for each.',
  },
  'cross-cutting-hubs': {
    title: 'Routines, ingredients and more',
    intro:
      'Guides that cut across product types and skin concerns: how to put a routine together, what individual ingredients do, Korean skincare, and lower-priced alternatives to popular products.',
    description: 'Skincare routines, ingredient explainers, Korean skincare and dupes: guides that apply across every product type and skin concern.',
  },
};

export default async function HubGroupPage({ slug }: { slug: string }) {
  const groups = await getTopicGroups();
  const group = groups.find((g) => g.slug === slug);
  const copy = HUB_GROUP_INTROS[slug];
  const hubs = group?.items ?? [];
  const data = await Promise.all(
    hubs.map((h) =>
      Promise.all([
        listPostSummaries({ category: h.href.replace(/^\//, ''), pageSize: 1 }).catch(() => null),
        listPostSummaries({ category: h.href.replace(/^\//, ''), pageSize: 1, withCover: true }).catch(() => null),
      ]),
    ),
  );

  return (
    <div data-testid={`hub-group-${slug}`}>
      <section className="sec-breadcumb">
        <div className="container">
          <Breadcrumb items={[{ label: 'Topics', href: '/topics' }, { label: group?.label ?? copy.title }]} />
          <div className="title">
            <h1 className="h4 mb-0 ds-4">{copy.title}</h1>
            <p className="bls-page-lead mt-3 mb-0">{copy.intro}</p>
          </div>
        </div>
      </section>

      <section className="pt-5 pb-70">
        <div className="container">
          <div className="row g-4">
            {hubs.map((h, i) => {
              const [countRes, coverRes] = data[i];
              const count = countRes?.meta.pagination.total ?? 0;
              const post = coverRes?.data[0];
              const card = post ? toCard(post) : null;
              return (
                <div className="col-lg-4 col-sm-6 col-12" key={h.href}>
                  <Link href={h.href} className="topic-card h-100">
                    <span className="topic-card-media">
                      {card?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={card.image} alt={h.label ? `${h.label} hub thumbnail` : (card.title || 'Hub thumbnail')} loading="lazy" />
                      ) : null}
                    </span>
                    <span className="topic-card-body">
                      <span className="d-flex justify-content-between align-items-baseline gap-2">
                        <span className="h6 mb-0 text-dark">{h.label}</span>
                        <span className="fs-8 text-600 text-nowrap">
                          {count} {count === 1 ? 'guide' : 'guides'}
                        </span>
                      </span>
                      {post && <span className="topic-card-latest fs-8 text-600">Latest: {post.title}</span>}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
          <p className="mt-5 mb-0">
            <Link href="/topics" className="bls-link fw-medium">
              See every skincare topic
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
