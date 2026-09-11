import Link from 'next/link';
import { SITE, SECTIONS } from '@/lib/site';
import { listCategories, type BlsCategory } from '@/lib/strapi';

const CONTACT_EMAIL = 'hello@bestlooking.skin';

/**
 * Footer in the Sandbox template's layout: a lead block on the left, three link
 * columns, then a rule with the copyright and socials beneath.
 *
 * The template's own content is placeholder -- "trusted by over 5000+ clients",
 * "Moonshine St. 14/05, Light City, London", "info@email.com",
 * "00 (123) 456 78 90". None of it is carried over: a fake postal address and
 * phone number on a live affiliate site is exactly the kind of detail an ad
 * network or a reader checks. The columns carry real destinations and the only
 * contact shown is the address that actually receives mail.
 */
export default async function Footer() {
  const year = new Date().getFullYear();
  const postCategories = await listCategories().catch(() =>
    SECTIONS.map((section, index) => ({
      id: index,
      name: section.title,
      slug: section.slug,
    })) as BlsCategory[],
  );
  const sectionSlugs = new Set<string>(SECTIONS.map((s) => s.slug));
  const topics = postCategories.filter((c) => !sectionSlugs.has(c.slug)).slice(0, 5);

  /* #cacaca on #343f52 is 6.47:1 -- the demo's own link colour and comfortably
     readable. The demo also uses #818a91 for muted copy, which lands at 3.02:1
     there, so body text here stays lighter than the demo rather than shipping
     something that fails on a dark ground. */
  const linkClass = 'text-[#cacaca] transition hover:text-white';

  return (
    <footer className="mt-16 text-white" style={{ backgroundColor: 'var(--sb-footer-bg)' }} data-testid="site-footer">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_1fr_1fr_1.1fr]">

          {/* Lead block */}
          <div className="max-w-md">
            <h2 className="font-display font-bold !text-[28px] leading-tight text-white">
              Skincare worth your money
            </h2>
            <p className="mt-5 text-[15px] leading-7 text-[#cacaca]">
              Honest reviews, clear ingredient explainers and side-by-side comparisons,
              so you know what a formula does before it earns a place in your routine.
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-flex items-center rounded-full bg-[#a07cc5] px-6 py-3 text-[15px] font-bold text-white transition hover:brightness-110"
            >
              Get in touch
            </Link>
          </div>

          {/* Need Help? */}
          <div>
            <h3 className="font-display !text-[17px] font-bold text-white">Need Help?</h3>
            <ul className="mt-5 space-y-3 text-[15px]">
              <li><Link href="/contact" className={linkClass}>Contact Us</Link></li>
              <li><Link href="/sitemap" className={linkClass}>Site Map</Link></li>
              <li><Link href="/legal/terms" className={linkClass}>Terms of Use</Link></li>
              <li><Link href="/legal/privacy" className={linkClass}>Privacy Policy</Link></li>
              <li><Link href="/legal/cookies" className={linkClass}>Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Learn More */}
          <div>
            <h3 className="font-display !text-[17px] font-bold text-white">Learn More</h3>
            <ul className="mt-5 space-y-3 text-[15px]">
              <li><Link href="/about" className={linkClass}>Our Story</Link></li>
              <li><Link href="/products" className={linkClass}>Products</Link></li>
              <li><Link href="/brands" className={linkClass}>Popular Brands</Link></li>
              <li><Link href="/informative-articles" className={linkClass}>All Articles</Link></li>
              {topics.slice(0, 2).map((c) => (
                <li key={c.slug}><Link href={`/${c.slug}`} className={linkClass}>{c.name}</Link></li>
              ))}
            </ul>
          </div>

          {/* Get in Touch — email only. No invented address or phone. */}
          <div>
            <h3 className="font-display !text-[17px] font-bold text-white">Get in Touch</h3>
            <p className="mt-5 text-[15px] leading-7 text-[#cacaca]">
              Questions, corrections or a product we should look at — we read everything.
            </p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="mt-3 inline-block text-[15px] text-white underline-offset-4 hover:underline">
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <div aria-hidden className="mt-14 h-px w-full bg-white/20" />

        <div className="mt-8 flex flex-col-reverse items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#cacaca]/80">© {year} {SITE.name}. All rights reserved.</p>
    <div className="flex items-center" data-testid="social-links">
                  <a
                    href={SITE.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${SITE.name} on Facebook`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:text-white mr-4 last:mr-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99h-2.5V12h2.5V9.83c0-2.47 1.47-3.84 3.73-3.84 1.08 0 2.21.19 2.21.19v2.43h-1.25c-1.23 0-1.61.76-1.61 1.55V12h2.74l-.44 2.89h-2.3v6.99A10 10 0 0 0 22 12Z" />
                    </svg>
                  </a>
                  <a
                    href="/feed.xml"
                    aria-label={`${SITE.name} RSS feed`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:text-white mr-4 last:mr-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
                      <path d="M4 4v3a13 13 0 0 1 13 13h3A16 16 0 0 0 4 4Zm0 6v3a7 7 0 0 1 7 7h3a10 10 0 0 0-10-10Zm2.25 7.25a1.75 1.75 0 1 0 .001 3.501A1.75 1.75 0 0 0 6.25 17.25Z" />
                    </svg>
                  </a>
                </div>
        </div>
      </div>
    </footer>
  );
}
