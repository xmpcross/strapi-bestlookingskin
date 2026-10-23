import { listPostSummaries, listProducts, mediaUrl, type BlsPostSummary } from '@/lib/strapi';
import { ADSENSE, PILLAR_SLUGS, SITE, publisherJsonLd } from '@/lib/site';
import { getTopicGroups } from '@/lib/nav';
import { toCard, type PostCardData } from '@/lib/post-card';
import { b } from '@/lib/blush';
import AdSlot from '@/components/AdSlot';
import BlushShell from '@/components/blush/BlushShell';
import { PostCard, SectionHeader } from '@/components/blush/cards';
import {
  CtaPanel,
  EditorSpotlight,
  GuideRail,
  HeadToHead,
  HighlightColumns,
  HomeCover,
  ProductSlider,
  StandardsBand,
  TopicTiles,
  type SliderProduct,
  type TopicTile,
} from '@/components/blush/home';
import './blush.css';
import './blush-extra.css';

export const revalidate = 60;

/*
 * Home, in the Blush design: an editorial cover, a row of the latest guides, the latest products, the pillar
 * guides, head-to-head comparisons, a "how we work" band counted from the site's own content, the latest
 * grid, highlights, the topics, and the newsletter.
 *
 * Headings say what each block really shows. The site has no traffic data, so nothing is called "popular" or
 * "trending", and the band's figures are counts, never claims. Prices are not shown on the product slider: they
 * live on the product pages. Tier A guides (named author, CMS cover) fill every block, each used once.
 */
const none = { data: [] as BlsPostSummary[], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

export default async function HomePage() {
  const groups = await getTopicGroups();
  const topicHubs = groups.flatMap((g) => g.items);
  const slugOf = (href: string) => href.replace(/^\//, '');

  const [guidesRes, pillarRes, hubData, productsRes] = await Promise.all([
    listPostSummaries({ authored: true, withCover: true, pageSize: 64 }).catch(() => none),
    listPostSummaries({ pillar: true, withCover: true, pageSize: 10 }).catch(() => none),
    Promise.all(topicHubs.map((h) => listPostSummaries({ category: slugOf(h.href), pageSize: 1, withCover: true }).catch(() => none))),
    listProducts({ pageSize: 12, sort: 'newest' }).catch(() => null),
  ]);

  const withImage = (posts: BlsPostSummary[]) => posts.filter((p) => toCard(p).image);
  const pillars = withImage(pillarRes.data)
    .sort((a, c) => Number(PILLAR_SLUGS.has(c.slug)) - Number(PILLAR_SLUGS.has(a.slug)))
    .map(toCard);
  const pillarKeys = new Set(pillars.map((p) => p.key));
  /* Newest first, as the listing returns them. */
  const candidates: PostCardData[] = withImage(guidesRes.data).map(toCard).filter((c) => !pillarKeys.has(c.key));

  /* Each block takes its stories from the candidates not yet used, so nothing appears twice. */
  const used = new Set<string>();
  const take = (n: number, from: PostCardData[] = candidates): PostCardData[] => {
    const chosen = from.filter((c) => !used.has(c.key)).slice(0, n);
    chosen.forEach((c) => used.add(c.key));
    return chosen;
  };

  const cover = take(4 - Math.min(1, pillars.length));
  if (pillars.length) cover.unshift(pillars[0]);
  const strip = take(4);
  const rail = take(8);
  /* Editor's guides: the remaining pillar guides first, then the newest left. */
  const editorsFrom = pillars.slice(1, 5);
  const editors = [...editorsFrom, ...take(4 - editorsFrom.length)];
  const comparisons = take(5, candidates.filter((c) => / vs\.? /i.test(c.title)));
  const latest = take(8);
  const highlights = take(9);
  const highlightGroups = [highlights.slice(0, 3), highlights.slice(3, 6), highlights.slice(6, 9)].filter((g) => g.length);

  const topics: TopicTile[] = topicHubs
    .map((h, i) => ({ label: h.label, href: h.href, count: hubData[i].meta.pagination.total, image: hubData[i].data[0] ? toCard(hubData[i].data[0]).image : null }))
    .filter((t) => t.count > 0)
    .sort((a, c) => c.count - a.count)
    .slice(0, 6);

  const products: SliderProduct[] = (productsRes?.data ?? [])
    .map((p) => ({ slug: p.slug, name: p.name, image: mediaUrl(p.primaryImage ?? null) ?? '', alt: p.primaryImage?.alternativeText || p.name, category: p.categories?.[0]?.name ?? '' }))
    .filter((p) => p.image);

  const authorCount = new Set(withImage(guidesRes.data).map((p) => p.author?.name).filter(Boolean)).size;
  const standards = [
    { figure: String(guidesRes.meta.pagination.total), label: 'Guides published', note: 'Each one is written and filed under a named author.' },
    { figure: String(topicHubs.length), label: 'Topics covered', note: 'From cleansers and sunscreen to acne and hyperpigmentation.' },
    { figure: String(productsRes?.meta.pagination.total ?? 0), label: 'Products in the shop', note: 'Each with its own page, specs and where to buy.' },
    { figure: String(authorCount), label: 'Named authors', note: 'Every byline links to a profile with a bio.' },
  ].filter((item) => item.figure !== '0');

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
    <BlushShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <main id="content" data-testid="home-page">
        <h1 className={b('sr-only')}>{SITE.name}: honest skincare reviews, ingredient explainers and comparison guides</h1>

        <div className={b('section')}>
          <HomeCover posts={cover} strip={strip} />
        </div>

        {rail.length > 0 && (
          <section className={b('container section')} aria-labelledby="home-latest-guides">
            <GuideRail cards={rail} title="Latest guides" id="home-latest-guides" href="/topics" linkLabel="All topics" />
          </section>
        )}

        {products.length > 0 && (
          <section className={b('container section')} aria-labelledby="home-products">
            <ProductSlider products={products} />
          </section>
        )}

        {/* Display unit after the product row. */}
        {ADSENSE.slots.display && (
          <div className={b('container section')}>
            <AdSlot kind="display" />
          </div>
        )}

        {editors.length > 0 && (
          <section className={b('container section')} aria-labelledby="home-editors">
            <SectionHeader title="Editor's guides" id="home-editors" />
            <EditorSpotlight cards={editors} />
          </section>
        )}

        {comparisons.length >= 2 && (
          <section className={b('container section')} aria-labelledby="home-compare">
            <SectionHeader title="Head to head" id="home-compare" href="/dupes" linkLabel="All comparisons" />
            <HeadToHead cards={comparisons} />
          </section>
        )}

        <div className={b('section')}>
          <StandardsBand
            eyebrow="How we work"
            title="Every guide has a named author and opens with the answer."
            intro="Guides are written under a byline, lead with a short direct answer, then explain the reasoning. Where a page links to a retailer, it says so."
            items={standards}
          />
        </div>

        {latest.length > 0 && (
          <section className={b('container section')} aria-labelledby="home-latest">
            <SectionHeader title="Latest posts" id="home-latest" count={`${guidesRes.meta.pagination.total} in the archive`} href="/topics" linkLabel="All topics" />
            <div className={b('grid-cards grid-cards--4')}>
              {latest.map((card) => (
                <PostCard key={card.key} card={card} />
              ))}
            </div>
          </section>
        )}

        {highlightGroups.length > 0 && (
          <section className={b('container section')} aria-labelledby="home-highlights">
            <SectionHeader title="Highlights" id="home-highlights" />
            <HighlightColumns groups={highlightGroups} />
          </section>
        )}

        {topics.length > 0 && (
          <section className={b('container section')} aria-labelledby="home-topics">
            <SectionHeader title="Browse by topic" id="home-topics" href="/topics" linkLabel="All topics" />
            <TopicTiles topics={topics} />
          </section>
        )}

        <div className={b('container section')}>
          <CtaPanel />
        </div>
      </main>
    </BlushShell>
  );
}
