import Link from 'next/link';
import { SITE, SECTIONS } from '@/lib/site';
import { getTopicGroups } from '@/lib/nav';
import { FacebookIcon, RssIcon } from './icons';

/*
 * Magzin footer (style 2) with the site's real destinations. The template's placeholder columns
 * (Careers, Press, Membership, Instagram grid) are not carried over: no such pages exist.
 */
const LEGAL_LINKS = [
  { href: '/legal/disclosure', label: 'Affiliate Disclosure' },
  { href: '/legal/privacy', label: 'Privacy Policy' },
  { href: '/legal/cookies', label: 'Cookie Policy' },
  { href: '/legal/terms', label: 'Terms and Conditions' },
];

export default async function SiteFooter() {
  const groups = await getTopicGroups();
  const byslug = (slug: string) => groups.find((g) => g.slug === slug);
  const columns = [
    { label: 'About', items: [{ label: 'Our Story', href: '/about' }, { label: 'All Articles', href: '/informative-articles' }, { label: 'Help & Support', href: '/faqs' }, { label: 'Site Map', href: '/sitemap' }, { label: 'Get in Touch', href: '/contact' }] },
    byslug('product-type-hubs') && { label: byslug('product-type-hubs')!.label, items: byslug('product-type-hubs')!.items },
    byslug('skin-concern-hubs') && { label: byslug('skin-concern-hubs')!.label, items: byslug('skin-concern-hubs')!.items },
    { label: 'Formats', items: [...(byslug('cross-cutting-hubs')?.items ?? []), ...SECTIONS.map((s) => ({ label: s.title, href: `/${s.slug}` }))] },
  ].filter(Boolean) as { label: string; items: { label: string; href: string }[] }[];

  return (
    <footer data-testid="site-footer">
      <div className="section-footer-2 overflow-hidden">
        <div className="container">
          <div className="row g-5 sec-padding">
            <div className="col-lg-4 pe-lg-5">
              <Link className="d-inline-block" href="/" aria-label={`${SITE.name} home`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="dark-mode-invert" src="/bestlookingskin_logo.svg" width={150} height={47} alt={SITE.name} />
              </Link>
              <p className="fs-7 text-dark mt-4">{SITE.tagline} {SITE.description}</p>
              <div className="d-inline-flex group-social-icons">
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
              <div className="row g-4 justify-content-between">
                {columns.map((col) => (
                  <div className="col-lg-3 col-md-3 col-6" key={col.label}>
                    <h6 className="mb-3">{col.label}</h6>
                    <ul className="list-unstyled ps-0">
                      {col.items.map((l) => (
                        <li className="mb-3" key={l.href}>
                          <Link className="text-500 hover-dark" href={l.href}>
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <div className="bottom-footer2 d-flex flex-wrap justify-content-lg-between justify-content-center align-items-center gap-lg-5 gap-3">
                <p className="text-500 m-0">
                  © {new Date().getFullYear()} <span className="text-dark">{SITE.name}</span>. All rights reserved.
                </p>
                <nav aria-label="Legal" className="d-flex flex-wrap justify-content-center align-items-center gap-lg-4 gap-3">
                  {LEGAL_LINKS.map((l) => (
                    <Link key={l.href} href={l.href} className="text-500 hover-dark d-block px-2 fs-7">
                      {l.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
