import type { Metadata } from 'next';
import Link from 'next/link';
import LegalBusinessDetails from '@/components/LegalBusinessDetails';
import AffiliatePrograms from '@/components/AffiliatePrograms';
import { ADVERTISING_PARTNERS, listOf } from '@/lib/affiliate-programs';
import LegalArticle from '@/components/LegalArticle';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Affiliate Disclosure',
  description: `How ${SITE.name} makes money, and what that does and does not influence.`,
  alternates: { canonical: '/legal/disclosure' },
};

const MODIFIED = '2026-09-24';

/**
 * Affiliate disclosure.
 *
 * Written because the notice at the top of every article links to it, and a
 * "read our full disclosure" link pointing at a 404 -- or at Terms, which only
 * mentions "affiliates" in the corporate sense -- is worse than no link.
 *
 * Deliberately limited to what is verifiably true of this site today. The
 * affiliate programmes and the retailers behind them are not typed here: they are
 * rendered from lib/affiliate-programs.ts (config + the committed link maps), so
 * this page updates itself when a programme or retailer is added.
 */
export default function Page() {
  return (
    <LegalArticle pageKey="disclosure" title="Affiliate Disclosure" modified={MODIFIED}>
      <p>
        {SITE.name} is free to read. We pay for it with affiliate commissions and advertising,
        and this page explains exactly how that works so you can judge what you read here.
      </p>

      <h3>1. Affiliate links</h3>
      <p>
        Many of the product links on this site are affiliate links. If you follow one and buy
        something, the retailer may pay us a commission. <strong>You pay the same price either
        way</strong> — the commission comes out of the retailer&rsquo;s margin, not out of your
        pocket, and nothing is added to your total.
      </p>
      <p>We currently earn affiliate commissions through:</p>
      <AffiliatePrograms />
      <p>
        Where a page lists several retailers, some of those links earn us a commission and some do not. Links to
        retailers are marked <code>rel=&quot;sponsored&quot;</code> for search engines. We do not currently take
        part in the Amazon Associates programme, and we do not link to Amazon.
      </p>

      <h3>2. What it does not affect</h3>
      <p>
        A commission never decides what we recommend, how we rank a product, or what we say about
        it. We are not paid by brands to review their products, we do not accept payment for a
        favourable write-up, and a product earning us nothing can and does beat one that would.
      </p>

      <h3>3. Prices and availability</h3>
      <p>
        Prices and stock shown on this site are gathered automatically and can change at any time.
        Always check the price on the retailer&rsquo;s own page before buying — that figure, not
        ours, is the one you will be charged.
      </p>

      <h3>4. Advertising</h3>
      <p>
        We also carry display advertising through {listOf(ADVERTISING_PARTNERS.map((a) => a.name))}. Advertisers
        have no say in our editorial content and no advance sight of it. How advertising cookies work is covered in our{' '}
        <Link href="/legal/cookies">Cookie Policy</Link>.
      </p>

      <h3>5. Questions</h3>
      <p>
        If something on this site looks like it was written for a commission rather than for you,
        tell us: <a href="mailto:contact@bestlooking.skin">contact@bestlooking.skin</a>. Corrections are
        welcome and we act on them.
      </p>

      <h3>6. Who we are</h3>
      <LegalBusinessDetails />
    </LegalArticle>
  );
}
