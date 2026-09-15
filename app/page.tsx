import Link from 'next/link';
import { listPostSummaries, type BlsPostSummary } from '@/lib/strapi';
import { SECTIONS, SITE } from '@/lib/site';
import { getTopicGroups } from '@/lib/nav';
import { toCard } from '@/lib/post-card';
import { CategoryChip, FeatureCard, ImageLinkCard, RowCard, SectionTitle, TextCard, TileCard, WideCard } from '@/components/magzin/cards';
import TopicSlider, { type TopicTab } from '@/components/magzin/TopicSlider';
import DarkSlider from '@/components/magzin/DarkSlider';

export const revalidate = 60;

/*
 * Home, in the Magzin "Home 2 — Publisher" layout.
 *   1. Lead: newest Tier A guide as the feature, the next four as tiles
 *   2. Product-type hubs as image chips
 *   3. Browse by topic: skin-concern and cross-cutting hubs as tabs, each with its newest guides
 *   4. More guides (dark band): a slider and a list of the next most recent guides
 *   5. Latest articles
 *   6. Explore by format (reviews, comparisons, how-to...)
 *   7. The editorial promise, linking to /about
 * Tier A guides (named author, CMS cover) lead every section; see CLAUDE.md.
 */
const none = { data: [] as BlsPostSummary[] };

export default async function HomePage() {
  const groups = await getTopicGroups();
  const productHubs = groups.find((g) => g.slug === 'product-type-hubs')?.items ?? [];
  const topicHubs = [...(groups.find((g) => g.slug === 'skin-concern-hubs')?.items ?? []), ...(groups.find((g) => g.slug === 'cross-cutting-hubs')?.items ?? [])];
  const slugOf = (href: string) => href.replace(/^\//, '');

  const [guides, hubCovers, topicPosts, formatCovers] = await Promise.all([
    listPostSummaries({ authored: true, pageSize: 20 }).catch(() => none),
    Promise.all(productHubs.slice(0, 6).map((h) => listPostSummaries({ category: slugOf(h.href), pageSize: 1, withCover: true }).catch(() => none))),
    Promise.all(topicHubs.map((h) => listPostSummaries({ category: slugOf(h.href), pageSize: 6 }).catch(() => none))),
    Promise.all(SECTIONS.map((s) => listPostSummaries({ category: s.slug, pageSize: 1, withCover: true }).catch(() => none))),
  ]);

  const cards = guides.data.map(toCard);
  const [feature, ...rest] = cards;
  const tiles = rest.slice(0, 4);
  const sliderCards = rest.slice(4, 10);
  const rowCards = rest.slice(10, 16);
  const wideCards = rest.slice(16, 19);

  const tabs: TopicTab[] = topicHubs
    .map((h, i) => ({ slug: slugOf(h.href), label: h.label, href: h.href, posts: topicPosts[i].data.map(toCard) }))
    .filter((t) => t.posts.length > 0);

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    potentialAction: { '@type': 'SearchAction', target: `${SITE.url}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  };

  return (
    <div data-testid="home-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <h1 className="visually-hidden">
        {SITE.name}: honest skincare reviews, ingredient explainers and comparison guides
      </h1>

      {feature && (
        <section className="sec-1-home-2 sec-padding" aria-label="Latest guides">
          <div className="container">
            <div className="row mt-2 g-4">
              <div className="col-lg-6">
                <FeatureCard card={feature} priority />
              </div>
              {[tiles.slice(0, 2), tiles.slice(2, 4)].map((col, i) => (
                <div className="col-lg-3" key={i}>
                  <div className="row g-4">
                    {col.map((card) => (
                      <div className="col-lg-12 col-md-6" key={card.key}>
                        <TileCard card={card} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {productHubs.length > 0 && (
        <section className="sec-2-home-2" aria-label="Product types">
          <div className="container">
            <div className="row g-3">
              {productHubs.slice(0, 6).map((h, i) => (
                <div className="col-lg-2 col-sm-4 col-6" key={h.href}>
                  <CategoryChip href={h.href} name={h.label} image={hubCovers[i]?.data[0] ? toCard(hubCovers[i].data[0]).image : null} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tabs.length > 0 && (
        <section className="sec-3-home-2 sec-padding overflow-hidden">
          <div className="container">
            <SectionTitle title="Browse by Topic" description="Skin concerns, routines and ingredients" />
          </div>
          <div className="position-relative mt-4">
            <div className="container">
              <TopicSlider tabs={tabs} />
            </div>
          </div>
        </section>
      )}

      {sliderCards.length > 0 && (
        <section className="sec-4-home-2 pb-70 pt-5 bg-800 changeless">
          <div className="container">
            <SectionTitle title="More Guides" description="Recently published on BestLooking.Skin" dark />
            <div className="row my-4">
              <div className="col-12">
                <DarkSlider>
                  {sliderCards.map((card) => (
                    <TextCard card={card} key={card.key} />
                  ))}
                </DarkSlider>
              </div>
            </div>
            <div className="row g-4">
              {rowCards.map((card) => (
                <div className="col-lg-6" key={card.key}>
                  <RowCard card={card} dark />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {wideCards.length > 0 && (
        <section className="sec-5-home-2 sec-padding overflow-hidden">
          <div className="container">
            <SectionTitle title="Latest Articles" description="Fresh guides, checked against their sources" href="/informative-articles" />
            <div className="row mt-2 g-4">
              {wideCards.map((card) => (
                <div className="col-12" key={card.key}>
                  <WideCard card={card} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="sec-7-home-2 sec-padding">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between gap-3">
            <h2 className="h4 mb-0 ds-4">Explore by Format</h2>
          </div>
          <div className="row mt-4 g-4">
            {SECTIONS.map((s, i) => {
              const cover = formatCovers[i]?.data[0];
              return (
                <div className="col-lg col-md-4 col-6" key={s.slug}>
                  <ImageLinkCard href={`/${s.slug}`} title={s.title} image={cover ? toCard(cover).image : null} alt={s.title} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sec-8-home-2 bg-white">
        <div className="container position-relative z-1">
          <div className="row g-4 align-items-center">
            <div className="col-lg-7 col-12">
              <p className="fs-7 text-600 mb-2">Why BestLooking.Skin</p>
              <h2 className="h4 mb-4 ds-5">Useful skincare advice before anything else.</h2>
              <p className="text-600 mb-4">
                We translate product claims, ingredient lists and routine advice into practical notes you can use before you buy, for every skin type and budget. Guides name their author and
                are refreshed as formulas and products change.
              </p>
              <Link href="/about" className="btn btn-dark">
                About us
              </Link>
            </div>
            <div className="col-lg-4 col-12 ms-lg-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="rounded-16 w-100 cover-image" src="/showcase-serum.jpg" alt="Applying a serum to the cheek with a glass dropper" width={540} height={540} loading="lazy" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
