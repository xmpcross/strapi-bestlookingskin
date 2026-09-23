import type { BlsPostType } from '@/lib/strapi';
export const SITE = {
  name: 'BestLooking.Skin',
  tagline: 'Your trusted partner on the journey to radiant, healthy skin.',
  description:
    'Honest skincare reviews, side-by-side product comparisons, best-of roundups and how-to guides for the products people are actually shopping for.',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bestlooking.skin').replace(/\/$/, ''),
  /* Social card shown when a page has no image of its own. Without this, the 120
     legacy posts shared to Facebook, X or WhatsApp rendered as a bare link with
     no picture, and their twitter:card silently downgraded to `summary`.
     1200x630 — the size every platform crops from. */
  ogImage: '/og-default.jpg',
  /* The business behind the site: shown in the footer, on /about and /contact, in the legal pages, and as the
     publisher in structured data. BestLooking.Skin is the trading name; FXN Holdings is the business. */
  business: {
    legalName: 'FXN Holdings',
    tradingName: 'BestLooking.Skin',
    abn: '53274423748',
    /* ABNs are written 2-3-3-3. */
    abnDisplay: '53 274 423 748',
    postalAddress: ['FXN Holdings', 'PO Box 500', 'WEST PERTH WA 6872'],
    postalAddressInline: 'PO Box 500, WEST PERTH WA 6872',
    postalAddressSchema: {
      '@type': 'PostalAddress',
      postOfficeBoxNumber: '500',
      addressLocality: 'West Perth',
      addressRegion: 'WA',
      postalCode: '6872',
      addressCountry: 'AU',
    },
  },
  social: {
    facebook: 'https://www.facebook.com/1bestlookingskin/',
    /* X and WhatsApp removed for now. The WhatsApp entry was wa.me/15551234567 --
       a placeholder number, which would have sent anyone who tapped it to a
       stranger or nowhere. Re-add either with a real destination. */
  },
};

/**
 * Affiliate programs are switched off (Sep 2026): the site earns from Google AdSense instead. While false:
 * - catalogue offers drop their affiliateUrl, so every retailer link is the plain product page (lib/strapi.ts);
 * - post and pillar content has Amazon and affiliate-network links unwrapped to plain text, "Buy now" buttons,
 *   Amazon-hosted images and the old Content Egg price boxes removed, at render time (lib/affiliate.ts) -- the
 *   stored content in Strapi is untouched, so turning this back on restores it;
 * - the "we may earn a commission" notes are hidden.
 */
export const AFFILIATE_LINKS_ENABLED = false;

/**
 * Google AdSense, placed manually (Auto ads are off in the AdSense account). The loader script is in
 * app/layout.tsx; each placement is an <AdSlot kind=... /> (components/AdSlot.tsx) that renders nothing until its
 * slot id is filled in here. Create the four units in AdSense (Ads > By ad unit) and paste their data-ad-slot ids:
 *   inArticle  In-article ad        post and pillar bodies, between sections
 *   display    Display ad, responsive  sidebars and between home/archive blocks
 *   multiplex  Multiplex ad        end of posts and pillars
 * Slot ids are public (they appear in the page), so they live in code rather than .env.
 */
export const ADSENSE = {
  client: 'ca-pub-2867376862905050',
  slots: {
    inArticle: '',
    display: '',
    multiplex: '',
  },
};

/** Schema.org publisher: the trading name as the brand, with the business's legal name, ABN and postal address. */
export const publisherJsonLd = () => ({
  '@type': 'Organization',
  name: SITE.name,
  legalName: SITE.business.legalName,
  url: SITE.url,
  taxID: SITE.business.abn,
  address: SITE.business.postalAddressSchema,
});

// Section slugs match the source WP categories on bestlooking.skin so URLs stay
// 1:1 with the migrated content (preserves SEO).
export type SectionKey =
  | 'product-comparisons'
  | 'product-reviews'
  | 'top-rated-products'
  | 'how-to-guides'
  | 'informative-articles'
  | 'articles';

export type Section = {
  slug: SectionKey;
  title: string;
  short: string;
  subtitle: string;
  blurb: string;
  /** Search result title (the site name is appended); defaults to `title`. */
  seoTitle?: string;
  /** Meta description, 150-160 characters; defaults to the blurb, clipped. */
  metaDescription?: string;
  /** The archive lists every post rather than its own category (the "All Articles" page). */
  allPosts?: boolean;
  /** Format archives list posts by their post type, whatever topic hub they sit in. */
  postType?: BlsPostType;
  /** Retired archive: its URL permanently redirects here and it is linked from nowhere on the site. */
  redirectTo?: string;
};

/**
 * Pillar pages ("complete guides") render with the pillar template. The CMS post type `pillar` is the switch; slugs
 * listed here get the template too, for pillars published before that option existed in Strapi.
 */
export const PILLAR_SLUGS = new Set<string>(['best-skin-care-routine-guide']);

/**
 * Home page top section: the pillar guides lead, then featured posts fill the remaining tiles. List post slugs
 * here to choose the featured posts by hand, in order. While it is empty they are picked automatically: the newest
 * guides with a named author and a cover, at most one per topic, so the row is not four posts from one hub.
 */
export const FEATURED_POST_SLUGS: string[] = [];

/** Sections still shown on the site (menus, topic lists, sitemaps): not retired, not the All Articles listing. */
export const isListedSection = (s: Section) => !s.redirectTo && !s.allPosts;

export const SECTIONS: Section[] = [
  {
    slug: 'product-comparisons',
    postType: 'product-comparison',
    /* Retired 15 Sep 2026: its posts moved into the topic hubs. */
    redirectTo: '/articles',
    title: 'Product Comparisons',
    short: 'Comparisons',
    subtitle: 'Two formulas, head to head — pick the one that wins for your skin.',
    blurb:
      'Side-by-side skincare product comparisons that cut through the marketing. Each guide weighs cleansers, serums, moisturisers and sunscreens on the things that matter — ingredient profile, price per ounce and skin-type fit — so you can pick the right formula before you spend.',
  },
  {
    slug: 'product-reviews',
    postType: 'product-review',
    /* Retired 15 Sep 2026: its posts moved into the topic hubs. */
    redirectTo: '/articles',
    title: 'Product Reviews',
    short: 'Reviews',
    subtitle: 'Tested in real routines. Honest verdicts. No sponsored gushing.',
    blurb:
      'Honest, hands-on skincare product reviews from BestLooking.Skin. We test cleansers, serums, moisturisers and masks the way readers actually use them — daily, over weeks — and report what works, what flops and whether the price tag is justified.',
  },
  {
    slug: 'top-rated-products',
    postType: 'top-rated',
    /* Retired 15 Sep 2026: its posts moved into the topic hubs. */
    redirectTo: '/articles',
    title: 'Top-Rated Products',
    short: 'Top Rated',
    subtitle: 'Ranked roundups of the best skincare products for every skin type and concern.',
    blurb:
      'Looking for the best skincare products for your skin type? Our top-rated roundups rank six to eight picks per concern, from acne-fighting treatments, toners for oily skin and nourishing products for dry skin to hydrating eye creams, mineral sunscreens, oil cleansers and face masks. Every pick gets a score out of 10, a short verdict and the pros and cons worth knowing before you buy.',
    seoTitle: 'Best Skincare Products, Ranked by Concern',
    metaDescription:
      'The best skincare products for acne, dry, oily and sensitive skin, ranked. Top-rated eye creams, sunscreens, cleansers and toners with scores, pros and cons.',
  },
  {
    slug: 'how-to-guides',
    postType: 'how-to-guide',
    /* Retired 15 Sep 2026: its posts moved into the topic hubs. */
    redirectTo: '/articles',
    title: 'How-to Guides',
    short: 'How-to',
    subtitle: 'Step-by-step routines that build better skin from the basics up.',
    blurb:
      'Step-by-step skincare guides that turn good products into a routine that actually works. Layering rules, troubleshooting tips and clear instructions for introducing actives like retinol, vitamin C and AHAs without a flare-up.',
  },
  {
    slug: 'informative-articles',
    /* The old "Informative Articles" category. Its posts moved into the topic hubs (Sep 2026) and the URL became
       the All Articles listing; that listing moved to /articles on 23 Sep 2026 so no link on the site carries the
       old category's name. */
    redirectTo: '/articles',
    title: 'Informative Articles',
    short: 'Informative',
    subtitle: 'Moved to All Articles.',
    blurb: 'Moved to All Articles.',
  },
  {
    slug: 'articles',
    title: 'All Articles',
    short: 'All',
    subtitle: 'Every guide, review and explainer, newest first.',
    blurb:
      'Browse every article on BestLooking.Skin in one place, from ingredient explainers and routine guides to product reviews, comparisons and top-rated roundups. Use the topic filter to narrow the list to the skin concerns and product types you care about.',
    seoTitle: 'All Skincare Articles and Guides',
    metaDescription:
      'Every skincare article on BestLooking.Skin in one place: ingredient explainers, routines, product reviews, comparisons and top-rated roundups, newest first.',
    allPosts: true,
  },
];
