import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { SITE, AFFILIATE_LINKS_ENABLED } from '@/lib/site';
import { listAuthors, listPostSummaries, listProducts, type BlsAuthor } from '@/lib/strapi';
import { getTopicGroups } from '@/lib/nav';
import { toCard } from '@/lib/post-card';
import Breadcrumb from '@/components/magzin/Breadcrumb';
import { CategoryChip } from '@/components/magzin/cards';
import AuthorAvatar from '@/components/AuthorAvatar';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Who writes BestLooking.Skin, how we research skincare products and ingredients, what we cover, and how the site is funded.',
  alternates: { canonical: '/about' },
};

const METHOD = [
  {
    title: 'Formula-first research',
    text: 'We start from what a product contains: its ingredient list, what the brand claims, who it is made for, and where it fits in a real routine.',
  },
  {
    title: 'Sources you can check',
    text: 'Our newer guides cite the American Academy of Dermatology, the NHS, Cleveland Clinic and peer-reviewed research, and label brand claims as the brand’s.',
  },
  {
    title: 'Practical routine advice',
    text: 'We focus on how products work together: what to start with, what to layer carefully, and when a simpler routine is the smarter choice.',
  },
];

const VALUES = ['Clarity over hype', 'Inclusive skincare education', 'Budget-aware recommendations', 'Open about how we are funded'];

/*
 * About page. Everything factual on it comes from the CMS at render time: the guide, product and topic counts,
 * the topic cards (each topic's own newest cover), and the named authors with their bios. The two photographs
 * are editorial still lifes (no people), so the page does not imply a studio or a team portrait it does not
 * have; the people shown are the site's real named authors.
 */
export default async function AboutPage() {
  const [posts, products, groups, authors] = await Promise.all([
    listPostSummaries({ pageSize: 1 }).catch(() => null),
    listProducts({ pageSize: 1 }).catch(() => null),
    getTopicGroups().catch(() => []),
    listAuthors().catch(() => [] as BlsAuthor[]),
  ]);
  const hubs = groups.flatMap((g) => g.items);
  const hubData = await Promise.all(
    hubs.map((h) => listPostSummaries({ category: h.href.replace(/^\//, ''), pageSize: 1, withCover: true }).catch(() => null)),
  );
  const topics = hubs
    .map((h, i) => ({ ...h, count: hubData[i]?.meta.pagination.total ?? 0, image: hubData[i]?.data[0] ? toCard(hubData[i]!.data[0]).image : null }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const stats = [
    { value: posts?.meta.pagination.total, label: 'guides and reviews' },
    { value: products?.meta.pagination.total, label: 'products in our catalogue' },
    { value: hubs.length || undefined, label: 'skincare topics' },
    { value: authors.length || undefined, label: 'named authors' },
  ].filter((s): s is { value: number; label: string } => typeof s.value === 'number' && s.value > 0);

  return (
    <div data-testid="about-page" className="about-page">
      <section className="sec-breadcumb">
        <div className="container">
          <Breadcrumb items={[{ label: 'About Us' }]} />
        </div>
      </section>

      {/* Hero: statement beside the lead photograph. */}
      <section className="pt-4 pb-5">
        <div className="container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6 col-12">
              <p className="bls-eyebrow mb-3">About Us</p>
              <h1 className="h2 mb-0">Skincare research made easier to understand.</h1>
              <p className="bls-page-lead mt-4 mb-0">
                BestLooking.Skin helps readers compare skincare products, understand ingredients, and build routines
                with more confidence. We turn product pages, ingredient lists and published research into plain,
                practical guidance for everyday skincare decisions.
              </p>
              <div className="d-flex flex-wrap gap-2 mt-4">
                <Link href="/articles" className="btn btn-dark bls-btn">
                  Read our guides
                </Link>
                <Link href="/products" className="btn bls-btn bls-btn-outline">
                  Browse products
                </Link>
              </div>
            </div>
            <div className="col-lg-6 col-12">
              <div className="about-photo">
                <Image
                  src="/assets/imgs/about/about-hero.jpg"
                  alt="Plain skincare bottles and a jar beside an open notebook, a pen and a glass of water on a light wooden desk"
                  width={1600}
                  height={1200}
                  priority
                  sizes="(min-width: 992px) 50vw, 100vw"
                />
              </div>
            </div>
          </div>

          {stats.length > 0 && (
            <ul className="about-stats list-unstyled m-0 mt-5" aria-label="BestLooking.Skin in numbers">
              {stats.map((s) => (
                <li key={s.label}>
                  <span className="about-stat-value">{s.value.toLocaleString('en-US')}</span>
                  <span className="about-stat-label">{s.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Purpose: photograph beside the text. */}
      <section className="pb-70">
        <div className="container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-5 col-12 order-2 order-lg-1">
              <div className="about-photo about-photo-sm">
                <Image
                  src="/assets/imgs/about/about-purpose.jpg"
                  alt="Four skincare textures in a row on a pale tile: a clear gel, a cream, a serum and a golden oil"
                  width={1600}
                  height={1200}
                  sizes="(min-width: 992px) 40vw, 100vw"
                />
              </div>
            </div>
            <div className="col-lg-7 col-12 order-1 order-lg-2 bls-prose">
              <p className="bls-eyebrow mb-2">Our purpose</p>
              <h2 className="h4 mb-4">Helping you choose skincare with less confusion.</h2>
              <p>
                The skincare market is crowded with bold claims, trending ingredients and launches that make a simple
                routine feel complicated. Our job is to slow that down. We organise the information so you can see
                what a product is designed to do, who it may suit, and whether it makes sense for your skin.
              </p>
              <p className="mb-0">
                We publish ingredient explainers, routine guides, product reviews and side-by-side comparisons. The
                goal is not to tell every reader to buy the same thing. It is to give you enough context to choose what
                fits your skin, your preferences and your budget.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How we work: three numbered cards. */}
      <section className="about-band sec-padding">
        <div className="container">
          <div className="row mb-4">
            <div className="col-lg-7 col-12">
              <p className="bls-eyebrow mb-2">How we work</p>
              <h2 className="h4 mb-0">A practical research process for real routines.</h2>
            </div>
          </div>
          <div className="row g-4">
            {METHOD.map((item, i) => (
              <div className="col-lg-4 col-12" key={item.title}>
                <div className="about-step h-100">
                  <span className="about-step-num" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="h6 mt-3 mb-2">{item.title}</h3>
                  <p className="fs-7 mb-0 text-600">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we cover: the busiest topics, each over its own newest cover. */}
      {topics.length > 0 && (
        <section className="sec-padding">
          <div className="container">
            <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
              <div>
                <p className="bls-eyebrow mb-2">What we cover</p>
                <h2 className="h4 mb-0">From ingredients to full routines.</h2>
              </div>
              <Link href="/topics" className="bls-link fw-medium">
                All topics
              </Link>
            </div>
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

      {/* Who writes here: the real named authors from the CMS. */}
      {authors.length > 0 && (
        <section className="pb-70">
          <div className="container">
            <p className="bls-eyebrow mb-2">Who writes here</p>
            <h2 className="h4 mb-4">The people behind the guides.</h2>
            <div className="row g-4">
              {authors.map((a) => (
                <div className="col-lg-6 col-12" key={a.slug}>
                  <Link href={`/authors/${a.slug}`} className="about-author h-100">
                    <AuthorAvatar name={a.name} src={a.avatarUrl} size={64} />
                    <span>
                      <span className="h6 d-block mb-1">{a.name}</span>
                      {a.bio && <span className="fs-7 text-600 d-block about-author-bio">{a.bio}</span>}
                      <span className="fs-7 fw-medium text-dark d-inline-block mt-2">Read their guides →</span>
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Values and how the site is funded. */}
      <section className="pb-70">
        <div className="container">
          <div className="bls-panel-muted p-4 p-md-5">
            <div className="row g-5">
              <div className="col-lg-5 col-12">
                <p className="bls-eyebrow mb-2">What we value</p>
                <h2 className="h5 mb-3">Useful guidance, not skincare noise.</h2>
                <ul className="block-tag list-unstyled d-flex flex-wrap gap-2 m-0 p-0">
                  {VALUES.map((value) => (
                    <li key={value} className="tag-item bls-tag">
                      {value}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-lg-7 col-12 bls-prose">
                <p className="bls-eyebrow mb-2">How we are funded</p>
                {AFFILIATE_LINKS_ENABLED ? (
                  <p className="mb-0">
                    BestLooking.Skin may earn a commission when readers buy through affiliate links. This does not add
                    extra cost for you, and it never changes what we recommend or what we say about a product.
                  </p>
                ) : (
                  <>
                    <p>
                      BestLooking.Skin is supported by advertising, served by Google AdSense and labelled
                      &ldquo;Advertisement&rdquo;. We do not currently use affiliate links, so we earn nothing when you
                      buy a product we write about, and retailer links go straight to the retailer&rsquo;s own page.
                    </p>
                    <p className="mb-0">Advertisers have no say in what we write.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business details and contact. */}
      <section className="pb-70">
        <div className="container">
          <div className="row g-4 align-items-center about-business">
            <div className="col-lg-8 col-12">
              <p className="bls-eyebrow mb-2">Who runs this site</p>
              <p className="mb-3">
                {SITE.business.legalName}
                <br />
                Trading Name: {SITE.business.tradingName}
                <br />
                Australian business based in WA.
                <br />
                ABN {SITE.business.abnDisplay}.
              </p>
              <p className="mb-0 text-600">
                Mailing address:
                {SITE.business.postalAddress.map((line, i, all) => (
                  <span key={line}>
                    <br />
                    {line}
                    {i < all.length - 1 ? ',' : ''}
                  </span>
                ))}
              </p>
            </div>
            <div className="col-lg-4 col-12 text-lg-end">
              <Link href="/contact" className="btn btn-dark bls-btn">
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
