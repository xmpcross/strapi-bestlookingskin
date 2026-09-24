import Link from 'next/link';
import { SITE } from '@/lib/site';
import { getTopicGroups } from '@/lib/nav';
import { listPostSummaries, listProductCategoryCounts, type BlsPostSummary } from '@/lib/strapi';
import { postPath } from '@/lib/format';
import { FacebookIcon, RssIcon } from './icons';

/*
 * Magzin footer style 4 (the "Personal" home): brand block with socials, and link columns for topics, the site and
 * products (the template's Instagram image grid was replaced by the Products links). Style 4 has no legal row, so a
 * bottom bar below it carries the copyright (left) and the legal links (right): a dead or missing policy link is
 * worse than none on a site carrying affiliate disclosures.
 */
/*
 * About and Contact sit here rather than in a column.
 *
 * They matter for the trust signals an affiliate site covering skin health is
 * judged on (see the YMYL notes in CLAUDE.md), so they need to be on every
 * page -- but they are not browsing destinations, and a column of them pushes
 * the topic links, which are, further down.
 */
const LEGAL_LINKS = [
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
  { href: '/legal/disclosure', label: 'Affiliate Disclosure' },
  { href: '/legal/privacy', label: 'Privacy Policy' },
  { href: '/legal/cookies', label: 'Cookie Policy' },
  { href: '/legal/terms', label: 'Terms and Conditions' },
];

/* "Best Skin Care Routine: Step-by-Step Guide (2025)" would put a stale year on
   every page of the site. The year is dropped from the link label only -- fix
   the title itself in Strapi. */
const stripYear = (title: string) => title.replace(/\s*\((?:19|20)\d\d\)\s*$/, '').trim();

const noPosts = { data: [] as BlsPostSummary[], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

export default async function SiteFooter() {
  const [groups, productCategories, pillars] = await Promise.all([
    getTopicGroups(),
    listProductCategoryCounts().catch(() => []),
    listPostSummaries({ pillar: true, pageSize: 2 }).catch(() => noPosts),
  ]);

  /*
   * Topic links ordered by how much is actually behind them, not by the order
   * the CMS happens to return.
   *
   * The old `.slice(0, 5)` took the first five in GROUP_ORDER, which is the
   * product-type group -- so `ingredients` and `routines`, the two LARGEST hubs
   * on the site at 18 posts each, could never appear in the footer at all.
   *
   * The per-hub count uses exactly the same arguments as SiteHeader's, so Next's
   * fetch cache serves one set of requests to both components rather than two.
   * Keep them identical if either is changed.
   */
  const allHubs = groups.flatMap((g) => g.items);
  const hubCounts = await Promise.all(
    allHubs.map((h) => listPostSummaries({ category: h.href.replace(/^\//, ''), pageSize: 1, withCover: true }).catch(() => noPosts)),
  );
  const topics = allHubs
    .map((h, i) => ({ ...h, count: hubCounts[i].meta.pagination.total }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  /*
   * Labels describe the destination rather than greeting the reader. "Our Story",
   * "Help & Support" and "Get in Touch" tell a search engine nothing about the
   * page at the other end, and anchor text is a signal about that page.
   *
   * `All Articles` also pointed at /informative-articles, a RETIRED section (see
   * SECTIONS in lib/site.ts), so every click 308'd away -- a permanent redirect
   * in a sitewide footer wastes a crawl on every page of the site.
   */
  const siteLinks = [
    ...pillars.data.map((p) => ({ label: stripYear(p.title), href: postPath(p) })),
    { label: 'Skincare FAQs', href: '/faqs' },
    { label: 'Browse Every Guide', href: '/sitemap' },
  ];
  /* All products, then the product categories that hold products (four, so the column matches the others). */
  /* `Brands` lives here now that it is out of the top nav -- the page is worth
     keeping crawlable, it is just not a primary destination for a reader.
     Category names are trimmed: "Moisturisers " ships from the CMS with a
     trailing space, which renders as a ragged link. */
  const productLinks = [
    { label: 'All Products', href: '/products' },
    ...productCategories.slice(0, 4).map((c) => ({ label: c.name.trim(), href: `/categories/${c.slug}` })),
    { label: 'Shop by Category', href: '/categories' },
    { label: 'Brands', href: '/brands' },
  ];

  return (
    <footer data-testid="site-footer">
      <div className="section-footer-4 overflow-hidden">
        <div className="container border-top-300">
          <div className="row g-5 sec-padding">
            <div className="col-12 footer-col-brand pe-lg-5">
              <div className="d-flex gap-2 align-items-center">
                <Link href="/" aria-label={`${SITE.name} home`}>
                  {/* Both marks ship; CSS shows one. See `.logo-light` / `.logo-dark`
                      in magzin.css for why this is not a single currentColor SVG. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="logo-light" src="/bestlookingskin_logo.svg" width={170} height={35} alt={SITE.name} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="logo-dark" src="/bestlookingskin_logo-light.svg" width={170} height={35} alt={SITE.name} aria-hidden="true" />
                </Link>
              </div>
              <p className="text-dark mt-4 footer-description">
                {SITE.tagline} {SITE.description}
              </p>
              <div className="d-inline-flex group-social-icons bg-transparent mt-3">
                {SITE.social.facebook && (
                  <a href={SITE.social.facebook} className="icon-shape icon-46" target="_blank" rel="noopener noreferrer" aria-label={`${SITE.name} on Facebook`}>
                    <FacebookIcon />
                  </a>
                )}
                <a href="/feed.xml" className="icon-shape icon-46" aria-label={`${SITE.name} RSS feed`}>
                  <RssIcon />
                </a>
              </div>
            </div>
            <div className="col-md-4 col-6 footer-col-links">
              <h6 className="mb-3">Skincare Topics</h6>
              <ul className="list-unstyled ps-0">
                {topics.map((l) => (
                  <li className="mb-3" key={l.href}>
                    <Link className="text-500 hover-dark" href={l.href}>
                      {l.label}
                    </Link>
                  </li>
                ))}
                {/* Six of fifteen hubs fit here; this is how a reader reaches the rest. */}
                <li>
                  <Link className="text-dark fw-semi-bold" href="/topics">
                    All Skincare Topics
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-md-4 col-6 footer-col-links">
              <h6 className="mb-3">Start Here</h6>
              <ul className="list-unstyled ps-0">
                {siteLinks.map((l, i) => (
                  <li className={i < siteLinks.length - 1 ? 'mb-3' : ''} key={l.href}>
                    <Link className="text-500 hover-dark" href={l.href}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-md-4 col-6 footer-col-links">
              <h6 className="mb-3">Products</h6>
              <ul className="list-unstyled ps-0">
                {productLinks.map((l, i) => (
                  <li className={i < productLinks.length - 1 ? 'mb-3' : ''} key={l.href}>
                    <Link className="text-500 hover-dark" href={l.href}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        {/* Bottom bar: copyright left, legal links right (stacked on phones). */}
        <div className="container footer-bottom">
          <div className="row g-2 align-items-center py-4">
            <div className="col-md-6 col-12">
              <p className="fs-8 my-0">
                © {new Date().getFullYear()} — {SITE.name}. All rights reserved.
              </p>
              <p className="fs-8 text-500 mb-0 mt-1">
                {SITE.business.tradingName} is a trading name of {SITE.business.legalName} · ABN {SITE.business.abnDisplay} ·{' '}
                {SITE.business.postalAddressInline}
              </p>
            </div>
            <div className="col-md-6 col-12">
              <nav aria-label="Legal" className="d-flex flex-wrap gap-3 justify-content-md-end">
                {LEGAL_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} className="fs-8 text-500 hover-dark">
                    {l.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
