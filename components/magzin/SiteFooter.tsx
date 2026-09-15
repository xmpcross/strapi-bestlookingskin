import Link from 'next/link';
import { SITE, SECTIONS } from '@/lib/site';
import { getTopicGroups } from '@/lib/nav';
import { listAuthors, listProductBrands, listProductCategoryCounts } from '@/lib/strapi';
import EmailSignup from './EmailSignup';
import { FacebookIcon, RssIcon } from './icons';

/*
 * Site footer: a full link directory, built from live data so a new hub, product category, brand or author appears
 * with no code change.
 *
 *   Top band      logo, what the site is, socials, newsletter sign-up
 *   Link columns  the three topic-hub groups (from the CMS nav), the article formats, the shop (all products, every
 *                 product category, brands) and the company pages (about, authors, help, contact, site map, search, RSS)
 *   Brands band   every brand the catalogue carries, A-Z
 *   Bottom bar    copyright and the legal pages
 *
 * Group headings are rewritten for readers ("Product-Type Hubs" is a CMS label, not a heading).
 */

const LEGAL_LINKS = [
  { href: '/legal/disclosure', label: 'Affiliate Disclosure' },
  { href: '/legal/privacy', label: 'Privacy Policy' },
  { href: '/legal/cookies', label: 'Cookie Policy' },
  { href: '/legal/terms', label: 'Terms and Conditions' },
];

const GROUP_TITLES: Record<string, string> = {
  'product-type-hubs': 'Skincare by Type',
  'skin-concern-hubs': 'Skin Concerns',
  'cross-cutting-hubs': 'Routines & Ingredients',
  more: 'More Topics',
};

type FooterLink = { label: string; href: string; count?: number };

function LinkColumn({ title, links }: { title: string; links: FooterLink[] }) {
  if (!links.length) return null;
  return (
    <div className="col">
      <h2 className="footer-col-title">{title}</h2>
      <ul className="footer-links list-unstyled ps-0 m-0">
        {links.map((l) => (
          <li key={l.href}>
            <Link className="text-500 hover-dark" href={l.href}>
              {l.label}
              {typeof l.count === 'number' && <span className="footer-link-count">{l.count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function SiteFooter() {
  const [groups, productCategories, brands, authors] = await Promise.all([
    getTopicGroups(),
    listProductCategoryCounts().catch(() => []),
    listProductBrands().catch(() => []),
    listAuthors().catch(() => []),
  ]);

  const topicColumns = groups.map((g) => ({ title: GROUP_TITLES[g.slug] ?? g.label, links: g.items }));
  const guideLinks: FooterLink[] = SECTIONS.map((s) => ({ label: s.title, href: `/${s.slug}` }));
  const shopLinks: FooterLink[] = [
    { label: 'All Products', href: '/products' },
    ...productCategories.map((c) => ({ label: c.name, href: `/categories/${c.slug}`, count: c.count })),
    { label: 'All Categories', href: '/categories' },
    { label: 'All Brands', href: '/brands' },
  ];
  const companyLinks: FooterLink[] = [
    { label: 'Our Story', href: '/about' },
    ...authors.map((a) => ({ label: a.name, href: `/authors/${a.slug}` })),
    { label: 'Help & FAQs', href: '/faqs' },
    { label: 'Get in Touch', href: '/contact' },
    { label: 'Search', href: '/search' },
    { label: 'Site Map', href: '/sitemap' },
    { label: 'RSS Feed', href: '/feed.xml' },
  ];

  return (
    <footer data-testid="site-footer">
      <div className="section-footer-4 site-footer overflow-hidden">
        <div className="container">
          {/* Top band: brand and newsletter. */}
          <div className="footer-top row g-4 align-items-center">
            <div className="col-lg-6 col-12">
              <Link href="/" aria-label={`${SITE.name} home`} className="d-inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/bestlookingskin_logo.svg" width={170} height={35} alt={SITE.name} />
              </Link>
              <p className="fs-7 text-dark mt-3 mb-0 footer-about">
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
            <div className="col-lg-5 offset-lg-1 col-12">
              <div className="footer-newsletter">
                <h2 className="footer-col-title mb-2">Get new guides by email</h2>
                <p className="fs-7 text-600 mb-3">We only email when new guides are published.</p>
                <EmailSignup purpose="newsletter" button="Subscribe" />
              </div>
            </div>
          </div>

          {/* Link directory. */}
          <nav aria-label="Footer" className="footer-directory row row-cols-2 row-cols-md-3 row-cols-xl-6 g-4">
            {topicColumns.map((c) => (
              <LinkColumn key={c.title} title={c.title} links={c.links} />
            ))}
            <LinkColumn title="Guides & Reviews" links={guideLinks} />
            <LinkColumn title="Shop" links={shopLinks} />
            <LinkColumn title="Company" links={companyLinks} />
          </nav>

          {/* Every brand the catalogue carries. */}
          {brands.length > 0 && (
            <div className="footer-brands">
              <h2 className="footer-col-title">Brands we cover</h2>
              <ul className="list-unstyled ps-0 m-0">
                {brands.map((b) => (
                  <li key={b.slug}>
                    <Link className="text-500 hover-dark" href={`/brands/${encodeURIComponent(b.slug)}`}>
                      {b.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Bottom bar: copyright left, legal links right (stacked on phones). */}
        <div className="container footer-bottom">
          <div className="row g-2 align-items-center py-4">
            <div className="col-md-6 col-12">
              <p className="fs-8 my-0">
                © {new Date().getFullYear()} — {SITE.name}. All rights reserved.
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
