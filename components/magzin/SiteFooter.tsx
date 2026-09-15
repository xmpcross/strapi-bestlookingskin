import Link from 'next/link';
import { SITE } from '@/lib/site';
import { getTopicGroups } from '@/lib/nav';
import { listProductCategoryCounts } from '@/lib/strapi';
import { FacebookIcon, RssIcon } from './icons';

/*
 * Magzin footer style 4 (the "Personal" home): brand block with socials, and link columns for topics, the site and
 * products (the template's Instagram image grid was replaced by the Products links). Style 4 has no legal row, so a
 * bottom bar below it carries the copyright (left) and the legal links (right): a dead or missing policy link is
 * worse than none on a site carrying affiliate disclosures.
 */
const LEGAL_LINKS = [
  { href: '/legal/disclosure', label: 'Affiliate Disclosure' },
  { href: '/legal/privacy', label: 'Privacy Policy' },
  { href: '/legal/cookies', label: 'Cookie Policy' },
  { href: '/legal/terms', label: 'Terms and Conditions' },
];

export default async function SiteFooter() {
  const [groups, productCategories] = await Promise.all([getTopicGroups(), listProductCategoryCounts().catch(() => [])]);
  const topics = groups.flatMap((g) => g.items).slice(0, 5);
  const siteLinks = [
    { label: 'Our Story', href: '/about' },
    { label: 'All Articles', href: '/informative-articles' },
    { label: 'Help & Support', href: '/faqs' },
    { label: 'Site Map', href: '/sitemap' },
    { label: 'Get in Touch', href: '/contact' },
  ];
  /* All products, then the product categories that hold products (four, so the column matches the others). */
  const productLinks = [
    { label: 'All Products', href: '/products' },
    ...productCategories.slice(0, 4).map((c) => ({ label: c.name, href: `/categories/${c.slug}` })),
  ];

  return (
    <footer data-testid="site-footer">
      <div className="section-footer-4 overflow-hidden">
        <div className="container border-top-300">
          <div className="row g-5 sec-padding">
            <div className="col-lg-4 col-md-8 pe-lg-5">
              <div className="d-flex gap-2 align-items-center">
                <Link href="/" aria-label={`${SITE.name} home`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/bestlookingskin_logo.svg" width={170} height={35} alt={SITE.name} />
                </Link>
              </div>
              <p className="fs-7 text-dark mt-4">
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
            <div className="col-lg-8">
              <div className="row g-4">
                <div className="col-lg-3 col-md-3 col-6">
                  <h6 className="mb-3">Topics</h6>
                  <ul className="list-unstyled ps-0">
                    {topics.map((l, i) => (
                      <li className={i < topics.length - 1 ? 'mb-3' : ''} key={l.href}>
                        <Link className="text-500 hover-dark" href={l.href}>
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="col-lg-3 col-md-3 col-6">
                  <h6 className="mb-3">About</h6>
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
                <div className="col-lg-3 col-md-3 col-6">
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
          </div>
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
