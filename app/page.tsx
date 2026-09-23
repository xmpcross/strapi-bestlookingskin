import Link from 'next/link';
import { listPostSummaries, type BlsPostSummary } from '@/lib/strapi';
import { FEATURED_POST_SLUGS, PILLAR_SLUGS, SITE, publisherJsonLd } from '@/lib/site';
import { getTopicGroups } from '@/lib/nav';
import { toCard } from '@/lib/post-card';
import EmailSignup from '@/components/magzin/EmailSignup';
import { CategoryChip, FeatureCard, ListCard, OverlapCard, RowCard, SectionTitle, TextCard, TileCard } from '@/components/magzin/cards';
import SidebarTitle from '@/components/magzin/SidebarTitle';
import FeaturedPostsSlider from '@/components/FeaturedPostsSlider';
import AdSlot from '@/components/AdSlot';

export const revalidate = 60;

/*
 * Home, built to the official Magzin "Home 2" layout (magzin.alithemes.net/home-2), block for block:
 *   1. Pillar guides + featured posts: the first pillar as the feature, then the other pillars and featured
 *      posts (FEATURED_POST_SLUGS, or picked automatically) as four tiles (card-11, card-5)
 *   2. Topics: image chips with post counts          (category-card style-2)
 *   3. Newsletter                                    (block-subscribe)
 *   4. Guides: dark title bar, three cards, six rows (card-7, card-6)
 *   5. More to read: dark title bar, overlap feature, two tiles, two rows (card-1, card-5, card-6)
 *   6. Suggestions: overlap feature and four tiles      (card-1, card-5)
 *   7. Latest guides: six list cards + sidebar          (card-9, author card, card-10, tag chips, cover slider)
 * Headings keep the template's style and length but say what each block really shows: the demo's "Staff Picks",
 * "Handpicked Just for You" and "Most Popular Topics" would claim curation, personalisation and traffic data the
 * site does not have. No view or comment counters are shown. The newsletter form reaches the editors by email.
 * Tier A guides (named author, CMS cover) fill every block; each post appears once.
 */
const none = { data: [] as BlsPostSummary[], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

export default async function HomePage() {
  const groups = await getTopicGroups();
  const topicHubs = groups.flatMap((g) => g.items);
  const slugOf = (href: string) => href.replace(/^\//, '');

  const [guides, pillarRes, hubData] = await Promise.all([
    listPostSummaries({ authored: true, withCover: true, pageSize: 48 }).catch(() => none),
    listPostSummaries({ pillar: true, withCover: true, pageSize: 10 }).catch(() => none),
    Promise.all(topicHubs.map((h) => listPostSummaries({ category: slugOf(h.href), pageSize: 1, withCover: true }).catch(() => none))),
  ]);

  const withImage = (posts: BlsPostSummary[]) => posts.filter((p) => toCard(p).image);
  const primaryCategory = (p: BlsPostSummary) => p.categories?.[0]?.slug ?? '';

  /* 1. Top section. Pillar guides first (the PILLAR_SLUGS one leads), then featured posts to fill four tiles. */
  const pillars = withImage(pillarRes.data).sort((a, b) => Number(PILLAR_SLUGS.has(b.slug)) - Number(PILLAR_SLUGS.has(a.slug)));
  const pillarSlugs = new Set(pillars.map((p) => p.slug));
  const guidePosts = withImage(guides.data).filter((p) => !pillarSlugs.has(p.slug));
  const featuredCount = Math.max(0, 5 - pillars.length);
  let featured: BlsPostSummary[];
  if (FEATURED_POST_SLUGS.length) {
    const bySlug = new Map(guidePosts.map((p) => [p.slug, p]));
    featured = FEATURED_POST_SLUGS.map((s) => bySlug.get(s)).filter((p): p is BlsPostSummary => Boolean(p)).slice(0, featuredCount);
  } else {
    /* Newest first (the listing's order), one per topic so a burst of posts in one hub does not fill the row. */
    const seenTopics = new Set(pillars.map(primaryCategory));
    featured = [];
    for (const p of guidePosts) {
      if (featured.length >= featuredCount) break;
      if (seenTopics.has(primaryCategory(p))) continue;
      seenTopics.add(primaryCategory(p));
      featured.push(p);
    }
  }
  const [feature, ...heroTiles] = [...pillars, ...featured].slice(0, 5).map(toCard);
  const shown = new Set([...pillars, ...featured].map((p) => p.slug));

  const cards = guidePosts.filter((p) => !shown.has(p.slug)).map(toCard);
  /* Each block below takes the next run of guides, so no post appears twice on the page. */
  const blocks = [3, 6, 6, 1, 2, 2, 1, 4, 5, 3];
  const starts = blocks.map((_, i) => blocks.slice(0, i).reduce((n, b) => n + b, 0));
  const [pickCards, pickRows, latest, [forYouFeature], forYouTiles, forYouRows, [suggestFeature], suggestTiles, sideRows, sideSlides] = blocks.map((n, i) =>
    cards.slice(starts[i], starts[i] + n),
  );

  /* Six topics with the most posts, each over its newest cover. Counts are real post totals from the CMS. */
  const topics = topicHubs
    .map((h, i) => ({ ...h, count: hubData[i].meta.pagination.total, image: hubData[i].data[0] ? toCard(hubData[i].data[0]).image : null }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  /* Latest Guides sidebar: more guides, every topic with its post count and a cover slider from guides not shown
     elsewhere on the page. */
  const allTopics = topicHubs
    .map((h, i) => ({ ...h, count: hubData[i].meta.pagination.total }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 9);

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    publisher: publisherJsonLd(),
    potentialAction: { '@type': 'SearchAction', target: `${SITE.url}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  };

  return (
    <div data-testid="home-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <h1 className="visually-hidden">{SITE.name}: honest skincare reviews, ingredient explainers and comparison guides</h1>

      {/* 1. Feature + four tiles */}
      {feature && (
        <section className="sec-1-home-2 sec-padding" style={{ backgroundImage: 'url(/assets/imgs/page/bg-home1-sec1.png)' }} aria-label="Complete guides and featured posts">
          <div className="container">
            <div className="row mt-2 g-4">
              <div className="col-lg-6">
                <FeatureCard card={feature} priority />
              </div>
              {[heroTiles.slice(0, 2), heroTiles.slice(2, 4)].map((col, i) => (
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

      {/* 2. Topics */}
      {topics.length > 0 && (
        <section className="sec-2-home-2">
          <div className="container">
            <h2 className="h6 mb-3">Explore Topics</h2>
            <div className="row g-3">
              {topics.map((t) => (
                <div className="col-lg-2 col-sm-4 col-6" key={t.href}>
                  <CategoryChip href={t.href} name={t.label} image={t.image} count={t.count} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Display unit after the topic chips, before the newsletter. */}
      <div className="container">
        <AdSlot kind="display" />
      </div>

      {/* 3. Newsletter (official Magzin home 2 block: white panel, dot pattern top right, star bottom left) */}
      <section className="home-newsletter">
        <div className="container">
          <div className="newsletter-box mx-auto position-relative overflow-hidden text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="newsletter-dots dark-mode-invert" src="/assets/imgs/template/decorate-1.png" alt="" aria-hidden />
            <svg className="newsletter-star dark-mode-invert" xmlns="http://www.w3.org/2000/svg" width={39} height={39} viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M0.582044 11.7285C8.79451 13.4712 10.252 14.8614 12.125 22.7372C13.8067 14.8768 15.2308 13.4992 23.4018 11.8279C15.1894 10.0852 13.7319 8.69503 11.8589 0.81924C10.1769 8.67956 8.75306 10.0571 0.582044 11.7285Z" fill="#0E0E0F" />
            </svg>
            <div className="d-flex align-items-center justify-content-center gap-1 text-500 position-relative">
              <svg className="dark-mode-invert" xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6.75 4.75H17.25C17.8023 4.75 18.25 5.19772 18.25 5.75V19.25L12 15.75L5.75 19.25V5.75C5.75 5.19772 6.19772 4.75 6.75 4.75Z" stroke="#3A3B3D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mb-0 fs-7">Newsletter</p>
            </div>
            <h2 className="newsletter-title mx-auto mt-3 mb-0 position-relative">Subscribe to our newsletter and get new guides by email</h2>
            <div className="newsletter-form mx-auto position-relative">
              <EmailSignup purpose="newsletter" button="Send" centered note="You’ll only hear from us when new guides are published—no spam." />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Guides: dark title bar, three cards, six rows */}
      {pickCards.length > 0 && (
        <section className="pb-70">
          <div className="container">
            <SectionTitle title="Editor's Guides" description="Written by our named authors" href="/articles" dark />
            <div className="row mt-2 g-4">
              {pickCards.map((card) => (
                <div className="col-lg-4 col-md-6 col-12" key={card.key}>
                  <TextCard card={card} />
                </div>
              ))}
            </div>
            {/* Rows alternate 5/7 and 7/5 columns, as in the template. */}
            <div className="row g-4 mt-1">
              {pickRows.map((card, i) => (
                <div className={`${[5, 7, 7, 5, 5, 7][i] === 5 ? 'col-lg-5' : 'col-lg-7'} col-12`} key={card.key}>
                  <RowCard card={card} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. More to read */}
      {forYouFeature && (
        <section className="sec-6-home-2 pb-70">
          <div className="container">
            <SectionTitle title="More to Read" description="Guides from across the site" href="/articles" dark />
            <div className="row mt-2 g-4">
              <div className="col-lg-6">
                <OverlapCard card={forYouFeature} />
              </div>
              <div className="col-lg-6">
                <div className="row g-4">
                  {forYouTiles.map((card) => (
                    <div className="col-12 col-md-6" key={card.key}>
                      <TileCard card={card} />
                    </div>
                  ))}
                  {forYouRows.map((card) => (
                    <div className="col-12" key={card.key}>
                      <RowCard card={card} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. Suggestions: white title bar, an overlap feature (card-1) and a 2x2 grid of tiles (card-5). "Picks" would
             claim curation, so the description just says what the block holds. */}
      {suggestFeature && (
        <section className="pb-70" data-testid="home-suggestions">
          <div className="container">
            <SectionTitle title="Suggestions" description="More guides to explore" href="/articles" />
            <div className="row mt-2 g-4">
              <div className="col-lg-6">
                <OverlapCard card={suggestFeature} />
              </div>
              <div className="col-lg-6">
                <div className="row g-4">
                  {suggestTiles.map((card) => (
                    <div className="col-md-6 col-12" key={card.key}>
                      <TileCard card={card} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Display unit before the last block. */}
      <div className="container">
        <AdSlot kind="display" />
      </div>

      {/* 7. Latest guides (last on the page): Magzin home 3 "Latest" layout. Six card-9 list cards on the left; the
             sidebar carries more guides, topics with post counts and a cover slider. The template's
             "Top Trending" / "Popular" labels would claim traffic data the site does not have. */}
      {latest.length > 0 && (
        <section className="sec-2-home-3 home-latest pt-70 pb-70 overflow-hidden" data-testid="home-latest-guides">
          <div className="container">
            <div className="row g-lg-4 g-5">
              <div className="col-lg-8">
                <SectionTitle title="Latest Guides" description="Recently published" href="/articles" />
                <div className="row mt-2 g-4">
                  {latest.map((card) => (
                    <div className="col-12" key={card.key}>
                      <ListCard card={card} />
                    </div>
                  ))}
                </div>
              </div>
              <aside className="col-lg-4" aria-label="More from the site">
                <div className="row">
                  {sideRows.length > 0 && (
                    <div className="col-md-6 col-lg-12 col-12">
                      <div>
                        <SidebarTitle>More Guides</SidebarTitle>
                      </div>
                      <div className="d-flex flex-column gap-3">
                        {sideRows.map((card) => (
                          <div className="article card-10 style-2 sidebar-trending" key={card.key}>
                            <Link href={card.href} className="card-img" tabIndex={-1} aria-hidden>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              {card.image ? <img className="w-100" src={card.image} alt="" width={108} height={83} loading="lazy" /> : null}
                            </Link>
                            <div className="card-body">
                              <Link href={card.href}>
                                <span className="h6 fs-6 mb-2 text-truncate-2">{card.title}</span>
                              </Link>
                              <div className="d-flex align-items-center text-600">
                                <span className="fs-8">{card.date}</span>
                                {card.readMinutes ? (
                                  <ul className="ps-4 m-0">
                                    <li>
                                      <span className="fs-8">{card.readMinutes} min read</span>
                                    </li>
                                  </ul>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="row">
                  {allTopics.length > 0 && (
                    <div className="col-md-6 col-lg-12 col-12">
                      <div className="mt-5">
                        <SidebarTitle>Browse Topics</SidebarTitle>
                      </div>
                      <ul className="list-unstyled d-flex flex-wrap gap-3 ps-0">
                        {allTopics.map((t) => (
                          <li key={t.href}>
                            <Link href={t.href} className="tag-item">
                              <span>{t.label}</span>
                              <span className="number">{t.count}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {sideSlides.length > 0 && (
                    <div className="col-md-6 col-lg-12 col-12">
                      <div className="mt-5">
                        <FeaturedPostsSlider
                          showText={false}
                          className="home-cover-slider"
                          posts={sideSlides.map((c) => ({ href: c.href, title: c.title, image: c.image as string, imageAlt: c.imageAlt, author: c.author?.name ?? null, date: c.date }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
