import Link from 'next/link';
import { listAuthors, listPostSummaries, type BlsPostSummary } from '@/lib/strapi';
import { SITE } from '@/lib/site';
import { getTopicGroups } from '@/lib/nav';
import { toCard } from '@/lib/post-card';
import AuthorAvatar from '@/components/AuthorAvatar';
import EmailSignup from '@/components/magzin/EmailSignup';
import { CategoryChip, FeatureCard, ImageLinkCard, OverlapCard, RowCard, SectionTitle, TextCard, TileCard, WideCard } from '@/components/magzin/cards';

export const revalidate = 60;

/*
 * Home, built to the official Magzin "Home 2" layout (magzin.alithemes.net/home-2), block for block:
 *   1. Feature post + four tiles                    (card-11, card-5)
 *   2. Topics: image chips with post counts          (category-card style-2)
 *   3. Newsletter                                    (block-subscribe)
 *   4. Guides: dark title bar, three cards, six rows (card-7, card-6)
 *   5. Latest guides: five wide cards                (card-12)
 *   6. More to read: dark title bar, overlap feature, two tiles, two rows (card-1, card-5, card-6)
 *   7. Recommended: author avatars and eight cards   (card-recommend)
 *   8. Become an author                              (sec-8-home-2)
 * Headings keep the template's style and length but say what each block really shows: the demo's "Staff Picks",
 * "Handpicked Just for You" and "Most Popular Topics" would claim curation, personalisation and traffic data the
 * site does not have. No view or comment counters are shown. The two email forms reach the editors by email.
 * Tier A guides (named author, CMS cover) fill every block; each post appears once.
 */
const none = { data: [] as BlsPostSummary[], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

export default async function HomePage() {
  const groups = await getTopicGroups();
  const topicHubs = groups.flatMap((g) => g.items);
  const slugOf = (href: string) => href.replace(/^\//, '');

  const [guides, hubData, authors] = await Promise.all([
    listPostSummaries({ authored: true, withCover: true, pageSize: 40 }).catch(() => none),
    Promise.all(topicHubs.map((h) => listPostSummaries({ category: slugOf(h.href), pageSize: 1, withCover: true }).catch(() => none))),
    listAuthors().catch(() => []),
  ]);

  const cards = guides.data.map(toCard).filter((c) => c.image);
  /* Each block takes the next run of guides, so no post appears twice on the page. */
  const blocks = [1, 4, 3, 6, 5, 1, 2, 2, 8, 3];
  const starts = blocks.map((_, i) => blocks.slice(0, i).reduce((n, b) => n + b, 0));
  const [[feature], heroTiles, pickCards, pickRows, latest, [forYouFeature], forYouTiles, forYouRows, recommended, authorImages] = blocks.map((n, i) =>
    cards.slice(starts[i], starts[i] + n),
  );

  /* Six topics with the most posts, each over its newest cover. Counts are real post totals from the CMS. */
  const topics = topicHubs
    .map((h, i) => ({ ...h, count: hubData[i].meta.pagination.total, image: hubData[i].data[0] ? toCard(hubData[i].data[0]).image : null }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

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
      <h1 className="visually-hidden">{SITE.name}: honest skincare reviews, ingredient explainers and comparison guides</h1>

      {/* 1. Feature + four tiles */}
      {feature && (
        <section className="sec-1-home-2 sec-padding" style={{ backgroundImage: 'url(/assets/imgs/page/bg-home1-sec1.png)' }} aria-label="Latest guides">
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

      {/* 3. Newsletter */}
      <section className="sec-padding">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 col-12 mx-auto">
              <div className="block-subscribe text-center home-subscribe">
                <div className="decorate-1" style={{ backgroundImage: 'url(/assets/imgs/template/decorate-1.png)' }} />
                <div className="block-title d-flex align-items-center justify-content-center gap-1 fs-7 text-600">
                  <svg className="dark-mode-invert" xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M4.75 7.75C4.75 6.64543 5.64543 5.75 6.75 5.75H17.25C18.3546 5.75 19.25 6.64543 19.25 7.75V16.25C19.25 17.3546 18.3546 18.25 17.25 18.25H6.75C5.64543 18.25 4.75 17.3546 4.75 16.25V7.75Z" stroke="#0E0E0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5.5 6.5L12 12.25L18.5 6.5" stroke="#0E0E0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="fs-7 fw-regular">Newsletter</span>
                </div>
                <h2 className="h4 my-3">
                  Get new skincare guides <br className="d-none d-lg-block" />
                  sent to your inbox
                </h2>
                <p className="fs-7 mb-4">We will email you when new guides are published. No spam, and we never share your address.</p>
                <div className="mx-auto home-subscribe-form">
                  <EmailSignup purpose="newsletter" button="Send" note />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Guides: dark title bar, three cards, six rows */}
      {pickCards.length > 0 && (
        <section className="pb-70">
          <div className="container">
            <SectionTitle title="Editor's Guides" description="Written by our named authors" href="/informative-articles" dark />
            <div className="row mt-2 g-4">
              {pickCards.map((card) => (
                <div className="col-lg-4 col-md-6 col-12" key={card.key}>
                  <TextCard card={card} />
                </div>
              ))}
            </div>
            <div className="row g-4 mt-1">
              {pickRows.map((card) => (
                <div className="col-lg-6" key={card.key}>
                  <RowCard card={card} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Latest guides */}
      {latest.length > 0 && (
        <section className="sec-5-home-2 pb-70 overflow-hidden">
          <div className="container">
            <SectionTitle title="Latest Guides" description="Recently published" href="/informative-articles" />
            <div className="row mt-2 g-4">
              {latest.map((card) => (
                <div className="col-12" key={card.key}>
                  <WideCard card={card} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. More to read */}
      {forYouFeature && (
        <section className="sec-6-home-2 pb-70">
          <div className="container">
            <SectionTitle title="More to Read" description="Guides from across the site" href="/sitemap" dark />
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

      {/* 7. Recommended */}
      {recommended.length > 0 && (
        <section className="sec-7-home-2 sec-padding" style={{ backgroundImage: 'url(/assets/imgs/page/bg-home2-sec7.png)' }}>
          <div className="container">
            <div className="d-flex align-items-center justify-content-between gap-3">
              <h2 className="h4 mb-0 ds-4">Recommended</h2>
              <div className="justify-content-between align-items-center gap-3 d-none d-md-flex">
                <Link href="/informative-articles" className="view-more">
                  <span className="circle" aria-hidden="true">
                    <span className="icon arrow" />
                  </span>
                  <span className="button-text">View More</span>
                </Link>
                {authors.length > 0 && (
                  <div className="block-author d-none d-lg-flex align-items-center" aria-label="Our authors">
                    {authors.slice(0, 5).map((a, i) => (
                      <Link key={a.slug} href={`/authors/${a.slug}`} className="avatar avatar-64 rounded-circle overflow-hidden border-3 border-white bg-white d-flex" style={{ zIndex: 5 - i }} title={a.name}>
                        <AuthorAvatar name={a.name} src={a.avatarUrl} size={64} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="row mt-4 g-4">
              {recommended.map((card) => (
                <div className="col-lg-3 col-md-4 col-6" key={card.key}>
                  <ImageLinkCard href={card.href} title={card.title} image={card.image} alt={card.imageAlt} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. Become an author */}
      <section className="sec-8-home-2 bg-white">
        <div className="decorate-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/imgs/template/decorate-4.png" alt="" width={250} height={250} />
        </div>
        <div className="container position-relative z-1">
          <div className="row g-4 align-items-center">
            <div className="col-lg-6 col-12">
              <div className="block-title d-flex align-items-center gap-1 fs-7 text-600">
                <svg className="dark-mode-invert" xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 11.25C13.7949 11.25 15.25 9.79493 15.25 8C15.25 6.20507 13.7949 4.75 12 4.75C10.2051 4.75 8.75 6.20507 8.75 8C8.75 9.79493 10.2051 11.25 12 11.25Z" stroke="#0E0E0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6.84747 19.25H17.1525C18.2944 19.25 19.174 18.2681 18.6408 17.2584C17.8563 15.7731 16.068 14 12 14C7.93198 14 6.14364 15.7731 5.35921 17.2584C4.82594 18.2681 5.70555 19.25 6.84747 19.25Z" stroke="#0E0E0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="fs-7 fw-regular">Start your writing journey today.</span>
              </div>
              <h2 className="h4 mb-4 ds-5">Become an author</h2>
              <EmailSignup purpose="author" button="Send" />
            </div>
            {authorImages.length > 0 && (
              <div className="col-lg-5 col-12 ms-lg-auto position-relative z-1">
                <div className="d-flex align-items-center justify-content-center gap-1">
                  {authorImages.map((card, i) =>
                    card.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={card.key}
                        className={`rounded-16 cover-image ${i === 0 ? 'mb-3 d-none d-md-block' : ''}`}
                        src={card.image}
                        alt={card.imageAlt}
                        width={[115, 170, 133][i]}
                        height={[148, 220, 172][i]}
                        loading="lazy"
                        style={{ objectFit: 'cover', width: [115, 170, 133][i], height: [148, 220, 172][i], flexShrink: 0 }}
                      />
                    ) : null,
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
