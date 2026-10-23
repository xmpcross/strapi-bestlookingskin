import Link from 'next/link';
import { SITE } from '@/lib/site';
import { b } from '@/lib/blush';
import { SocialIcon } from './Icon';

const NAME = SITE.name;

/* The footer link columns, as on the live site's footer. */
const COLUMNS = [
  {
    title: 'Skincare Topics',
    links: [
      ['Skincare Routines', '/routines'],
      ['Moisturizers', '/moisturizers'],
      ['Ingredients A–Z', '/ingredients'],
      ['Serums', '/serums'],
      ['Acne & Breakouts', '/acne'],
      ['Sunscreen & SPF', '/sunscreen'],
      ['All Skincare Topics', '/topics'],
    ],
  },
  {
    title: 'Start Here',
    links: [
      ['Best Skin Care Routine by Skin Type: Full Guide', '/routines/best-skin-care-routine-by-skin-type'],
      ['Best Skin Care Routine: Step-by-Step Guide', '/routines/best-skin-care-routine-guide'],
      ['Skincare FAQs', '/faqs'],
      ['Browse Every Guide', '/sitemap'],
    ],
  },
  {
    title: 'Products',
    links: [
      ['All Products', '/products'],
      ['Anti-Aging', '/categories/anti-aging'],
      ['Exfoliators & Scrubs', '/categories/exfoliators-and-scrubs'],
      ['Facial Cleansers', '/categories/facial-cleansers'],
      ['Facial Serums', '/categories/facial-serums'],
      ['Shop by Category', '/categories'],
      ['Brands', '/brands'],
    ],
  },
] as const;

const LEGAL = [
  ['About Us', '/about'],
  ['Contact', '/contact'],
  ['Affiliate Disclosure', '/legal/disclosure'],
  ['Privacy Policy', '/legal/privacy'],
  ['Cookie Policy', '/legal/cookies'],
  ['Terms and Conditions', '/legal/terms'],
] as const;

export default function BlushFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className={b('site-footer')}>
      <div className={b('container site-footer__inner')}>
        <div className={b('site-footer__masthead')}>
          <Link href="/" className={b('wordmark wordmark--logo site-footer__wordmark')} aria-label={`${NAME} home`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={b('logo logo--on-light')} src="/bestlookingskin_logo.svg" width={194} height={40} alt={NAME} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={b('logo logo--on-dark')} src="/bestlookingskin_logo-light.svg" width={194} height={40} alt="" aria-hidden="true" />
          </Link>
          <p className={b('txt-s txt-dim site-footer__bio')}>
            {SITE.tagline} {SITE.description}
          </p>
          <ul className={b('site-footer__socials')}>
            <li>
              <a href={SITE.social.facebook} className={b('icon-btn icon-btn--line')} aria-label="Facebook" rel="noreferrer">
                <SocialIcon name="facebook" />
              </a>
            </li>
            <li>
              <a href="/feed.xml" className={b('icon-btn icon-btn--line')} aria-label="RSS feed">
                <SocialIcon name="rss" />
              </a>
            </li>
          </ul>
        </div>

        <div className={b('site-footer__columns site-footer__columns--nav')}>
          <nav className={b('site-footer__nav')} aria-label="Footer">
            {COLUMNS.map((group) => (
              <div key={group.title} className={b('site-footer__group')}>
                <p className={b('label txt-dim')}>{group.title}</p>
                <ul>
                  {group.links.map(([label, href]) => (
                    <li key={href}>
                      <Link className={b('txt-s site-footer__link')} href={href}>
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className={b('site-footer__bottom')}>
          <p className={b('txt-xs txt-dim')}>
            &copy; {year} &mdash; {NAME}. All rights reserved.
          </p>
          <p className={b('txt-xs txt-dim')}>
            {NAME} is a trading name of {SITE.business.legalName} &middot; ABN {SITE.business.abnDisplay} &middot; {SITE.business.postalAddressInline}
          </p>
          <ul className={b('site-footer__legal')}>
            {LEGAL.map(([label, href]) => (
              <li key={href}>
                <Link className={b('txt-xs txt-dim')} href={href}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
