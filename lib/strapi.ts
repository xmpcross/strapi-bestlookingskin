import qs from 'qs';
import { PILLAR_SLUGS } from '@/lib/site';

const BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || 'https://cms.fxnstudio.com').replace(/\/$/, '');
// commerce-products is a Strapi pool SHARED with other sites (e.g. nxt.bargains).
// This storefront only shows products tagged for it (filtered via $containsi —
// the JSON-array op Strapi serves reliably; $contains 500s).
const SITE_PRODUCT_TAG = process.env.NEXT_PUBLIC_SITE_PRODUCT_TAG || 'bestlooking-skin';
/** This storefront's commerce-site slug -- the relation products are scoped by. */
const SITE_SLUG = process.env.NEXT_PUBLIC_SITE_SLUG || 'bestlooking-skin';

/**
 * The product categories this storefront is allowed to show.
 *
 * commerce-categories is shared the same way commerce-products is, and it is
 * NOT filtered by the site tag — a category row carries no ownership at all. So
 * an unfiltered read returns all 31 categories in the pool and this skincare
 * site offers to browse Smart Plugs, Raspberry Pi and Robot Vacuums AU.
 *
 * Excluded on purpose:
 *   - smart-*, video-doorbells, raspberry-pi        → nxtsmart.homes
 *   - the "… AU" categories (lighting, energy-solar,
 *     climate-comfort, robot-vacuums, hubs-platforms,
 *     security-cameras, entertainment-audio)        → nxtsmarthome.com.au
 *   - smart-phones, laptops, tablets, smartwatches,
 *     headphones                                    → nxt.bargains
 *
 * Kept in code rather than read from the commerce-site row because that row
 * (id 23) carries `enabledCategories: ["skincare", "beauty"]`, and neither of
 * those is a real category slug — nothing would match and every listing would
 * fail closed. Move this to the CMS once that row holds the slugs below.
 */
export const CATEGORY_SLUGS = [
  'facial-cleansers',
  'facial-serums',
  'anti-aging',
  'toners-and-astringents',
  'moisturisers',
  'exfoliators-and-scrubs',
  /* Ingestible hyaluronic acid supplements -- capsules and powders -- not the
     topical serums, which sit under facial-serums. */
  'hyaluronic-acid',
] as const;
// Reads on /api/bls-* are configured as public in Strapi. Skip the
// Authorization header when the env token is missing OR a known stale
// value, so a rotated token doesn't 401 every fetch and silently empty
// the page.
const RAW_TOKEN = process.env.STRAPI_API_TOKEN || '';
const TOKEN = RAW_TOKEN.startsWith('e7e531759e393ac2') ? '' : RAW_TOKEN;

export type StrapiImage = { url: string; alternativeText?: string; width?: number; height?: number; /** KB */ size?: number } | null;

export type BlsPostType =
  | 'product-comparison'
  | 'product-review'
  | 'product-roundup'
  | 'how-to-guide'
  | 'informative'
  | 'top-rated'
  | 'pillar'
  | 'other';

export type BlsCategory = {
  id: number;
  documentId?: string;
  name: string;
  slug: string;
  description?: string;
  order?: number;
  icon?: string;
  legacyWpId?: number;
  parent?: { id: number; name: string; slug: string } | null;
  children?: { id: number; name: string; slug: string }[];
};

export type BlsPost = {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  postType?: BlsPostType;
  amazonAffiliateTag?: string;
  sourceUrl?: string;
  legacyWpId?: number;
  readingTimeMinutes?: number;
  /** Release date -- see the scheduled-publishing block above `withPublishedGate`. */
  showFrom?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  publishedAt: string;
  updatedAt: string;
  coverImage?: StrapiImage;
  ogImage?: StrapiImage;
  gallery?: NonNullable<StrapiImage>[];
  categories?: BlsCategory[];
  author?: BlsAuthor | null;
};

/** Post byline. Bio drives the author card under each article (E-E-A-T). */
export type BlsAuthor = {
  id: number;
  documentId?: string;
  name: string;
  slug: string;
  bio?: string;
  avatarUrl?: string;
};

type ListResponse<T> = {
  data: T[];
  meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } };
};

/* ------------------------------------------- scoped commerce access point */

/**
 * The commerce collections are a pool SHARED with every other storefront on
 * this CMS, and they carry uneven ownership: a product has a site tag, a
 * category has none, a brand has neither tag nor relation. Three separate leaks
 * came from the same mistake -- a query written without the scope its
 * collection happens to need, in a file where every neighbouring query had one.
 *
 * So scope stops being something each caller remembers. `commerceFetch` is the
 * only way into these collections, and it applies the rule for the collection
 * being read. A caller cannot express an unscoped commerce query through it,
 * and `scripts/check-commerce-scope.mjs` fails the build if anyone reaches past
 * it to `strapiFetch` with a commerce path.
 */
type CommerceCollection =
  | 'commerce-products'
  | 'commerce-categories'
  | 'commerce-offers'
  | 'commerce-reviews';

function scopeFor(collection: CommerceCollection): Record<string, unknown> {
  switch (collection) {
    /* Products belong to a site by relation. This replaced a $containsi match
       on the `tags` JSON array: substring matching on free text, where a wrong
       tag returns an empty catalogue instead of an error. All 637 products in
       the pool were backfilled from their tag, and the relation reproduces the
       tag counts exactly (219 / 271 / 147). */
    case 'commerce-products':
      /*
       * `productStatus` decides whether a product is listable, and it is
       * enforced here rather than per-call so no listing can forget it.
       *
       * It is what keeps single-offer products out of the grids. A product with
       * one offer is not a price comparison -- it is one merchant's price with
       * nothing to check it against -- but it is still worth keeping to write
       * about, so those rows sit at productStatus 'draft' rather than being
       * deleted. sync-product-listability.mjs in nxt-sourcing maintains the
       * flag from the live offer count.
       *
       * Doing it in the query rather than after the fetch keeps
       * meta.pagination honest; filtering in JS silently broke the page counts
       * on /products.
       */
      return { site: { slug: { $eq: SITE_SLUG } }, productStatus: { $eq: 'active' } };
    /*
     * Categories are NOT scoped by their `sites` relation, deliberately.
     *
     * That relation records which sites have products in a category, which is
     * broader than which categories a storefront means to show. For this site
     * it returns nine: the six skincare ones plus antioxidants,
     * brain-and-cognitive and hair-skin-and-nails -- stale assignments holding
     * zero bestlooking products. Scoping by it would put three empty, off-brand
     * categories back in the nav, which is the leak this module exists to stop.
     *
     * So the allowlist stays until the relation is curated to mean "this
     * storefront's categories" rather than "categories something of ours landed
     * in". Move to `sites.slug.$eq` once that is true.
     */
    case 'commerce-categories':
      return { slug: { $in: [...CATEGORY_SLUGS] } };
    /* Offers and reviews are scoped through the product they hang off. */
    case 'commerce-offers':
    case 'commerce-reviews':
      return { product: { site: { slug: { $eq: SITE_SLUG } } } };
  }
}

/** Merge the collection's scope into caller filters without letting the caller drop it. */
function withScope(collection: CommerceCollection, params?: Record<string, unknown>) {
  const callerFilters = (params?.filters ?? {}) as Record<string, unknown>;
  const scope = scopeFor(collection);
  const overlap = Object.keys(scope).filter((k) => k in callerFilters);
  /* An overlapping key would silently replace the scope with the caller's own
     condition, which is exactly the failure this module exists to prevent. */
  const filters = overlap.length
    ? { $and: [scope, callerFilters] }
    : { ...scope, ...callerFilters };
  return { ...params, filters };
}

async function commerceFetch<T>(
  collection: CommerceCollection,
  params?: Record<string, unknown>,
  revalidate = 60,
): Promise<T> {
  return strapiFetch<T>(collection, withScope(collection, params), revalidate);
}

async function strapiFetch<T>(path: string, params?: Record<string, unknown>, revalidate = 60): Promise<T> {
  const query = params ? '?' + qs.stringify(params, { encodeValuesOnly: true }) : '';
  const url = `${BASE}/api/${path}${query}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    next: { revalidate },
  });
  if (!res.ok) {
    throw new Error(`Strapi ${res.status} on ${url}: ${await res.text().catch(() => '')}`);
  }
  return res.json();
}

/* ─── Scheduled publishing ─────────────────────────────────────────────────
 *
 * `showFrom` is a datetime field on BLS · Post. A post whose `showFrom` is in
 * the future is queued: written, saved and Published in Strapi, but invisible
 * here until that moment passes. A post with `showFrom` empty behaves exactly
 * as it always has, which is why adding the field did not hide the existing
 * corpus.
 *
 * Why not Strapi's own `publishedAt`: it is a system field, not editable in the
 * admin, and timed publishing is a paid Strapi feature. `showFrom` is a plain
 * field this site owns and reads.
 *
 * Why the gate lives at the query layer and not in the page components: the
 * sitemap and the RSS feed read through these same functions. A queued post
 * cannot leak out of a channel someone forgot about -- which is the whole
 * point, since a URL Google reaches early is a URL Google has already dated.
 *
 * The cutoff is floored to the minute rather than taken to the second. The
 * query string is the Next.js fetch cache key, so a cutoff that changed on
 * every request would make every listing uncacheable and put the full load on
 * Strapi. Flooring to the minute matches the 60s revalidate these fetches
 * already use, so a queued post goes live within about a minute of its time.
 *
 * Set SHOW_SCHEDULED_POSTS=1 (server-side only -- never in a NEXT_PUBLIC_ var)
 * in a preview deployment to see the queue. Leave it unset in production.
 */
const SHOW_SCHEDULED = process.env.SHOW_SCHEDULED_POSTS === '1';

/** Now, floored to the minute, as an ISO string. */
export function publishedCutoff(): string {
  const now = Date.now();
  return new Date(now - (now % 60_000)).toISOString();
}

/**
 * Add the scheduled-publishing gate to a post filter.
 *
 * Merged into `$and` rather than assigned as a top-level `$or`, because several
 * of these queries already build their own top-level `$or` (search terms, cover
 * image presence) and an assignment would silently discard it.
 */
function withPublishedGate(filters: Record<string, unknown>): Record<string, unknown> {
  if (SHOW_SCHEDULED) return filters;
  const gate = {
    $or: [
      /* No release date set: an ordinary post, visible as always. */
      { showFrom: { $null: true } },
      { showFrom: { $lte: publishedCutoff() } },
    ],
  };
  const existing = Array.isArray(filters.$and) ? filters.$and : [];
  return { ...filters, $and: [...existing, gate] };
}

/**
 * The date the post became public: its release date where one was set,
 * otherwise Strapi's own publish timestamp.
 *
 * Applied when a post is read, so the byline, the Article structured data, the
 * RSS `pubDate` and the sitemap all agree. Without it a cluster queued across
 * six weeks would go live one post at a time but show the same date on every
 * one -- the day they were all typed into the CMS.
 */
function withReleaseDate<T extends { publishedAt: string; showFrom?: string }>(post: T): T {
  return post.showFrom ? { ...post, publishedAt: post.showFrom } : post;
}

// Local mirror of Strapi's `/uploads/*` tree, populated by
// `scripts/migrate-cms-images.mjs`. Frontend always serves the local copy
// so a slow/down CMS host never blocks page loads.
const LOCAL_UPLOADS = '/cms-uploads';

/** Media is served straight from Strapi. (The previous `/cms-uploads` local
 *  mirror only contained images downloaded by migrate-cms-images.mjs, so
 *  dynamically-imported product images 404'd; and an fs existence-check can't
 *  run in client-reachable code. Returning the absolute Strapi URL always
 *  loads, old or new.) Non-Strapi URLs (e.g. an Amazon CDN) pass through. */
function toLocalUploadUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('/uploads/')) return `${BASE}${url}`;
  return url;
}

export function mediaUrl(img: StrapiImage): string | null {
  if (!img?.url) return null;
  if (img.url.startsWith('/cms-uploads/') || img.url.startsWith('/assets/')) return img.url;
  const absolute = img.url.startsWith('http') ? img.url : `${BASE}${img.url}`;
  return toLocalUploadUrl(absolute);
}

/** Rewrite every `<img src="...cms.fxnstudio.com/uploads/...">` (and the
 *  relative `/uploads/...` form) inside raw HTML so post bodies pull the
 *  locally cached image instead of round-tripping through the CMS host. */
function rewriteContentImages(html: string | undefined): string {
  if (!html) return '';
  return html
    .replace(
      new RegExp(`(<img\\b[^>]*?\\bsrc=["'])${BASE}/uploads/`, 'gi'),
      `$1${LOCAL_UPLOADS}/`,
    )
    .replace(
      /(<img\b[^>]*?\bsrc=["'])\/uploads\//gi,
      `$1${LOCAL_UPLOADS}/`,
    );
}

/** Replace double-encoded / literal en-dashes with a plain hyphen, across
 *  titles and body copy. Covers the numeric entity (`&#8211;`), the named
 *  entity (`&ndash;`), and the raw en-dash character (U+2013). */
function cleanDashes(s: string): string {
  return s ? s.replace(/&#8211;|&ndash;|–/g, '-') : s;
}

/** Custom featured cover image overrides for posts. */
export const POST_COVER_OVERRIDES: Record<string, StrapiImage> = {
  'best-skin-care-routine-guide': {
    url: '/cms-uploads/best_skin_care_routine_guide_cover.jpg',
    alternativeText: 'Five-step skincare routine laid out on a marble counter: cleanse, tone and prep, treat, moisturise, protect',
    width: 1200,
    height: 896,
    size: 644,
  },
  'best-skin-care-routine-by-skin-type': {
    url: '/cms-uploads/best_skin_care_routine_by_skin_type_cover.jpg',
    alternativeText: 'Cleanser, serums, sunscreen, barrier cream and toner arranged on a stone tray in morning light',
    width: 1200,
    height: 896,
    size: 694,
  },
  'top-6-must-have-products-nourishing-dry-skin': {
    url: '/cms-uploads/top_6_must_have_products_nourishing_dry_skin_cover.jpg',
    alternativeText: 'Top 6 Must-Have Products for Nourishing Dry Skin',
    width: 1200,
    height: 896,
    size: 150,
  },
  'top-7-oil-cleansers-radiant-skin': {
    url: '/cms-uploads/top_7_oil_cleansers_radiant_skin_cover.jpg',
    alternativeText: 'Top 7 Oil Cleansers for Radiant Skin',
    width: 1200,
    height: 896,
    size: 150,
  },
  'top-7-effective-face-masks-acne-prone-skin': {
    url: '/cms-uploads/top_7_effective_face_masks_acne_prone_skin_cover.jpg',
    alternativeText: 'Top 7 Effective Face Masks for Acne-Prone Skin',
    width: 1200,
    height: 896,
    size: 150,
  },
  'nighttime-skincare-essentials-glowing-skin': {
    url: '/cms-uploads/nighttime_skincare_essentials_glowing_skin_cover.jpg',
    alternativeText: 'Top 7 Nighttime Skincare Essentials for Glowing Skin',
    width: 1200,
    height: 896,
    size: 150,
  },
  'top-6-hydrating-eye-creams-try-today': {
    url: '/cms-uploads/top_6_hydrating_eye_creams_try_today_cover.jpg',
    alternativeText: 'Top 6 Hydrating Eye Creams You Need to Try Today!',
    width: 1200,
    height: 896,
    size: 150,
  },
  '7-best-sensitive-skin-care-products-2024': {
    url: '/cms-uploads/7_best_sensitive_skin_care_products_2024_cover.jpg',
    alternativeText: '7 Best Sensitive Skin Care Products for 2024',
    width: 1200,
    height: 896,
    size: 150,
  },
  'top-7-acne-fighting-products': {
    url: '/cms-uploads/top_7_acne_fighting_products_cover.jpg',
    alternativeText: 'Top 7 Acne-Fighting Products',
    width: 1200,
    height: 896,
    size: 150,
  },
  '6-best-products-clear-radiant-skin-2024': {
    url: '/cms-uploads/6_best_products_clear_radiant_skin_2024_cover.jpg',
    alternativeText: '6 Best Products for Clear, Radiant Skin in 2024',
    width: 1200,
    height: 896,
    size: 150,
  },
  'top-7-hydrating-skincare-glowing-skin': {
    url: '/cms-uploads/top_7_hydrating_skincare_glowing_skin_cover.jpg',
    alternativeText: 'Top 7 Hydrating Skincare Products for Glowing Skin',
    width: 1200,
    height: 896,
    size: 150,
  },
  'top-7-toners-for-oily-skin-a-comprehensive-roundup-to-combat-excess-oil': {
    url: '/cms-uploads/top_7_toners_for_oily_skin_cover.jpg',
    alternativeText: 'Top 7 Toners for Oily Skin: A Comprehensive Roundup to Combat Excess Oil',
    width: 1200,
    height: 896,
    size: 150,
  },
  'top-8-hyaluronic-acid-face-moisturizers-revealed': {
    url: '/cms-uploads/top_8_hyaluronic_acid_face_moisturizers_cover.jpg',
    alternativeText: 'Top 8 Hyaluronic Acid Face Moisturizers Revealed!',
    width: 1200,
    height: 896,
    size: 150,
  },
  'how-to-use-gentle-face-wash-for-sensitive-skin': {
    url: '/cms-uploads/how_to_use_gentle_face_wash_sensitive_skin_cover.jpg',
    alternativeText: 'Cetaphil Gentle Skin Cleanser, CeraVe Hydrating Facial Cleanser and Neutrogena Ultra Gentle Daily Cleanser on a shelf',
    width: 1280,
    height: 720,
    size: 47,
  },
  'cerave-hydrating-facial-cleanser-16-oz-deep-hydration': {
    url: '/cms-uploads/cerave_hydrating_facial_cleanser_16_oz_cover.jpg',
    alternativeText: 'CeraVe Hydrating Facial Cleanser 16 oz bottle',
    width: 1280,
    height: 720,
    size: 29,
  },
  'top-7-face-oil-cleansers-you-need-to-try': {
    url: '/cms-uploads/top_7_face_oil_cleansers_cover.jpg',
    alternativeText: "Palmer's Skin Therapy Cleansing Oil, DHC Deep Cleansing Oil and CeraVe Hydrating Foaming Oil Cleanser",
    width: 1280,
    height: 720,
    size: 41,
  },
  'review-la-roche-posay-toleriane-hydrating-face-cleanser': {
    url: '/cms-uploads/review_la_roche_posay_toleriane_hydrating_cleanser_cover.jpg',
    alternativeText: 'La Roche-Posay Toleriane Hydrating Gentle Cleanser bottle, front and back',
    width: 1280,
    height: 720,
    size: 29,
  },
  'serums-cerave-vs-truskin': {
    url: '/cms-uploads/serums_cerave_vs_truskin_cover.jpg',
    alternativeText: 'CeraVe Skin Renewing Vitamin C Serum vs TruSkin Vitamin C Facial Serum',
    width: 1280,
    height: 720,
    size: 70,
  },
  'top-6-exfoliating-face-scrubs-your-path-to-radiant-skin': {
    url: '/cms-uploads/top_6_exfoliating_face_scrubs_cover.jpg',
    alternativeText: 'Top 6 Exfoliating Face Scrubs: Your Path to Radiant Skin',
    width: 1200,
    height: 896,
    size: 150,
  },
  'budget-friendly-skin-care-routine': {
    url: '/cms-uploads/budget_friendly_skin_care_routine_cover.jpg',
    alternativeText: 'Budget-Friendly Skin Care Routine: Essential Cleanser, Moisturizer and Daily Sunscreen',
    width: 1200,
    height: 900,
    size: 150,
  },
  'how-to-customize-your-face-oil-blend': {
    url: '/cms-uploads/how_to_customize_your_face_oil_blend_cover.jpg',
    alternativeText: 'How to Customize Your Face Oil Blend: Custom carrier and essential oils',
    width: 1200,
    height: 900,
    size: 150,
  },
  'holistic-beauty-routines-improve-skin-health': {
    url: '/cms-uploads/holistic_beauty_routines_improve_skin_health_cover.jpg',
    alternativeText: 'Can holistic beauty routines improve skin health? Jade gua sha, balm and botanical oil',
    width: 1200,
    height: 900,
    size: 150,
  },
  'top-face-oil-dermaplaning': {
    url: '/cms-uploads/top_face_oil_dermaplaning_cover.jpg',
    alternativeText: "What's the Top Face Oil to Use with Dermaplaning? Precision dermaplaning blade and squalane oil",
    width: 1200,
    height: 900,
    size: 150,
  },
  '5-myths-facial-oils-debunked': {
    url: '/cms-uploads/5_myths_facial_oils_debunked_cover.jpg',
    alternativeText: '5 Myths About Facial Oils, Debunked: Balancing, hydrating and clarifying facial oils',
    width: 1200,
    height: 900,
    size: 150,
  },
  'incorporating-retinol-skincare-routine': {
    url: '/cms-uploads/incorporating_retinol_skincare_routine_cover.jpg',
    alternativeText: 'Incorporating Retinol into Your Skincare Routine: Amber dropper bottle, gentle night cream, and barrier moisturizer',
    width: 1200,
    height: 896,
    size: 150,
  },
  'best-gentle-skincare-routine': {
    url: '/cms-uploads/best_gentle_skincare_routine_cover.jpg',
    alternativeText: 'What is the Best Gentle Skincare Routine? Calming milky cleanser, ceramide barrier moisturizer, and mineral sunscreen',
    width: 1200,
    height: 896,
    size: 150,
  },
  'hydrating-skincare-mistakes-avoid-healthy-glowing-skin': {
    url: '/cms-uploads/hydrating_skincare_mistakes_avoid_healthy_glowing_skin_cover.jpg',
    alternativeText: 'Hydrating Skincare Mistakes to Avoid for Healthy, Glowing Skin: Hyaluronic acid serum, hydrating mist, and barrier cream',
    width: 1200,
    height: 896,
    size: 150,
  },
  'best-facial-skincare-tool': {
    url: '/cms-uploads/best_facial_skincare_tool_cover.jpg',
    alternativeText: 'What is the Best Facial Skincare Tool? Rose quartz gua sha, jade roller, and LED microcurrent beauty tool with nourishing oil',
    width: 1200,
    height: 896,
    size: 150,
  },
  'compare-bio-oil-body-serum-thayers-milky-face-toner': {
    url: '/cms-uploads/compare_bio_oil_body_serum_tha_vs_23d17d3137.jpg',
    alternativeText: 'Comparing Bio-Oil Body Serum and Thayers Milky Face Toner: Product comparison and routine guide',
    width: 1280,
    height: 832,
    size: 45,
  },
};

/** Apply content + media rewrites to a single post. Idempotent. */
function localizePost<T extends BlsPost>(post: T): T {
  const overrideCover = POST_COVER_OVERRIDES[post.slug];
  return {
    ...withReleaseDate(post),
    title: cleanDashes(post.title),
    excerpt: post.excerpt ? cleanDashes(post.excerpt) : post.excerpt,
    content: cleanDashes(rewriteContentImages(post.content)),
    coverImage: overrideCover ?? post.coverImage,
    ogImage: overrideCover ?? post.ogImage ?? overrideCover,
  };
}

const POST_POPULATE = ['coverImage', 'ogImage', 'categories', 'gallery', 'author'];

export async function listPosts(
  opts: {
    page?: number;
    pageSize?: number;
    category?: string;
    postType?: BlsPostType;
    q?: string;
    author?: string;
    /**
     * Body and nothing else: for callers that read `content` but render no card.
     *
     * The default populate carries coverImage, ogImage, gallery and author for
     * every row. /faqs walks the whole library to lift Q&A pairs out of article
     * bodies and uses none of them, so it was pulling four relations per post
     * across ~200 posts for nothing.
     */
    lean?: boolean;
  } = {},
) {
  const filters: Record<string, unknown> = {};
  if (opts.category) filters.categories = { slug: { $eqi: opts.category } };
  if (opts.postType) filters.postType = { $eq: opts.postType };
  if (opts.author) filters.author = { slug: { $eqi: opts.author } };
  if (opts.q?.trim()) {
    const q = opts.q.trim();
    filters.$or = [
      { title: { $containsi: q } },
      { excerpt: { $containsi: q } },
      { content: { $containsi: q } },
      { categories: { name: { $containsi: q } } },
    ];
  }

  const res = await strapiFetch<ListResponse<BlsPost>>('bls-posts', {
    sort: ['publishedAt:desc'],
    ...(opts.lean
      ? {
          /* `publishedAt` and `showFrom` are not optional here even though nothing
             renders them: withReleaseDate and the scheduled-publishing gate both
             read them. */
          fields: ['title', 'slug', 'content', 'excerpt', 'publishedAt', 'showFrom'],
          populate: { categories: { fields: ['name', 'slug'] } },
        }
      : { populate: POST_POPULATE }),
    pagination: { page: opts.page ?? 1, pageSize: opts.pageSize ?? 12 },
    filters: withPublishedGate(filters),
  });
  return { ...res, data: res.data.map(localizePost) };
}

/**
 * Card-sized posts: everything a listing card shows, without the body. The full list query carries every
 * post's HTML (pages of 5-10 MB that Next cannot cache), which listings never render.
 */
export type BlsPostSummary = Omit<BlsPost, 'content' | 'gallery' | 'ogImage'>;
export async function listPostSummaries(
  opts: {
    page?: number;
    pageSize?: number;
    category?: string;
    categories?: string[];
    postType?: BlsPostType;
    authored?: boolean;
    withCover?: boolean;
    exclude?: string[];
    /** Only pillar pages: post type `pillar`, or a slug in PILLAR_SLUGS. */
    pillar?: boolean;
  } = {},
) {
  const filters: Record<string, unknown> = {};
  if (opts.pillar) filters.$and = [{ $or: [{ postType: { $eq: 'pillar' } }, { slug: { $in: [...PILLAR_SLUGS] } }] }];
  if (opts.category) filters.categories = { slug: { $eqi: opts.category } };
  if (opts.postType) filters.postType = { $eq: opts.postType };
  if (opts.categories?.length) filters.categories = { slug: { $in: opts.categories } };
  /* Tier A posts are the ones with a named author (see CLAUDE.md): the listing lead should be one of them. */
  if (opts.authored) filters.author = { id: { $notNull: true } };
  if (opts.exclude?.length) filters.slug = { $notIn: opts.exclude };
  /* A post counts as having a cover when the CMS has one or it has a local override, so the CMS still does the
     filtering and a page of `pageSize` results stays full. */
  if (opts.withCover) {
    const overrideSlugs = Object.keys(POST_COVER_OVERRIDES);
    filters.$or = [{ coverImage: { id: { $notNull: true } } }, ...(overrideSlugs.length ? [{ slug: { $in: overrideSlugs } }] : [])];
  }
  const res = await strapiFetch<ListResponse<BlsPostSummary>>('bls-posts', {
    sort: ['publishedAt:desc'],
    fields: ['title', 'slug', 'excerpt', 'publishedAt', 'showFrom', 'updatedAt', 'readingTimeMinutes', 'postType', 'seoDescription'],
    populate: {
      coverImage: { fields: ['url', 'alternativeText', 'width', 'height', 'size'] },
      categories: { fields: ['name', 'slug'] },
      author: { fields: ['name', 'slug', 'avatarUrl'] },
    },
    pagination: { page: opts.page ?? 1, pageSize: opts.pageSize ?? 12 },
    filters: withPublishedGate(filters),
  });
  const data = res.data.map((p) => ({
    ...withReleaseDate(p),
    title: cleanDashes(p.title),
    excerpt: p.excerpt ? cleanDashes(p.excerpt) : p.excerpt,
    coverImage: POST_COVER_OVERRIDES[p.slug] ?? p.coverImage,
  }));
  return { ...res, data };
}

export async function getPost(slug: string): Promise<BlsPost | null> {
  const res = await strapiFetch<ListResponse<BlsPost>>('bls-posts', {
    /* Gated too, so a queued post 404s on a direct hit rather than being merely
       absent from listings -- otherwise the URL is live for anyone who guesses
       or is sent it, and Googlebot dates it from that first visit. */
    filters: withPublishedGate({ slug: { $eq: slug } }),
    populate: POST_POPULATE,
    pagination: { pageSize: 1 },
  });
  const post = res.data?.[0];
  return post ? localizePost(post) : null;
}

export async function getAuthor(slug: string): Promise<BlsAuthor | null> {
  const res = await strapiFetch<ListResponse<BlsAuthor>>('bls-authors', {
    filters: { slug: { $eqi: slug } },
    pagination: { pageSize: 1 },
  });
  return res.data?.[0] ?? null;
}

export async function listAuthors(): Promise<BlsAuthor[]> {
  const res = await strapiFetch<ListResponse<BlsAuthor>>('bls-authors', {
    sort: ['name:asc'],
    pagination: { pageSize: 50 },
  });
  return res.data;
}

/**
 * The posts either side of this one, by publish date within its category.
 *
 * Fetched as one ordered page and walked, rather than two $lt/$gt queries: the
 * category holds a handful of posts, and one request that cannot disagree with
 * itself beats two that can when several share a timestamp -- which they do
 * here, since a batch was published together.
 */
export async function getAdjacentPosts(
  category: string,
  slug: string,
): Promise<{ prev: BlsPost | null; next: BlsPost | null }> {
  try {
    const res = await strapiFetch<ListResponse<BlsPost>>('bls-posts', {
      filters: withPublishedGate({ categories: { slug: { $eqi: category } } }),
      fields: ['title', 'slug', 'publishedAt', 'showFrom'],
      populate: ['coverImage', 'categories'],
      sort: ['publishedAt:desc', 'slug:asc'],
      pagination: { pageSize: 100 },
    });
    const rows = res.data ?? [];
    const i = rows.findIndex((p) => p.slug === slug);
    if (i === -1) return { prev: null, next: null };
    return { prev: rows[i + 1] ?? null, next: rows[i - 1] ?? null };
  } catch {
    return { prev: null, next: null };
  }
}

export async function listCategories(): Promise<BlsCategory[]> {
  const res = await strapiFetch<ListResponse<BlsCategory>>('bls-categories', {
    sort: ['order:asc', 'name:asc'],
    populate: ['parent', 'children'],
    pagination: { pageSize: 100 },
  });
  return res.data;
}

export async function getCategory(slug: string): Promise<BlsCategory | null> {
  const res = await strapiFetch<ListResponse<BlsCategory>>('bls-categories', {
    filters: { slug: { $eqi: slug } },
    populate: ['parent', 'children'],
    pagination: { pageSize: 1 },
  });
  return res.data?.[0] ?? null;
}

// =====================================================================
// PRODUCTS — separate from posts. Products are individual SKUs that can be
// embedded in posts and searched independently.
// =====================================================================

export type BlsProductCategory = {
  id: number;
  documentId?: string;
  name: string;
  slug: string;
  description?: string;
  order?: number;
  icon?: string;
  image?: StrapiImage;
  parent?: { id: number; name: string; slug: string } | null;
  children?: { id: number; name: string; slug: string }[];
};

export type BlsProductBrand = {
  id: number;
  documentId?: string;
  name: string;
  slug: string;
  description?: string;
  websiteUrl?: string;
  logo?: StrapiImage;
  order?: number;
};

export type BlsProduct = {
  id: number;
  documentId?: string;
  name: string;
  slug: string;
  brand?: string;
  brandRef?: BlsProductBrand | null;
  shortDescription?: string;
  description?: string;
  keyFeatures?: string[];
  primaryImage?: StrapiImage;
  gallery?: NonNullable<StrapiImage>[];
  asin?: string;
  skuOrModel?: string;
  skinTypes?: string[];
  ingredients?: string;
  rating?: number;
  ratingCount?: number;
  primaryAffiliateUrl?: string;
  sourceUrl?: string;
  sourceMerchant?: string;
  currentPrice?: number;
  originalPrice?: number;
  currency?: string;
  lastPriceSyncAt?: string;
  available?: boolean;
  walmartPrice?: number;
  walmartUrl?: string;
  walmartLastSyncAt?: string;
  ebayPrice?: number;
  ebayUrl?: string;
  ebayLastSyncAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  publishedAt: string;
  updatedAt: string;
  categories?: BlsProductCategory[];
  // Full marketplace offers (one per merchant) — rendered as the price list.
  offers?: CommerceOffer[];
  // Raw specs blob (spread through from the commerce product) — used by the
  // Specifications tab for the technicalSpecs key/value table.
  specs?: {
    keyFeatures?: string[];
    skinTypes?: string[];
    ingredients?: string;
    technicalSpecs?: Record<string, string | number>;
  };
};

type CommerceMerchant = {
  id: number;
  documentId?: string;
  name: string;
  slug: string;
  logo?: StrapiImage;
};

export type CommerceOffer = {
  id: number;
  documentId?: string;
  title?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  productUrl?: string;
  affiliateUrl?: string;
  availability?: 'in_stock' | 'out_of_stock' | 'preorder' | 'unknown';
  merchantSku?: string;
  source?: string;
  lastCheckedAt?: string;
  status?: string;
  merchant?: CommerceMerchant | null;
};

export type CommerceProduct = Omit<
  BlsProduct,
  | 'brandRef'
  | 'categories'
  | 'keyFeatures'
  | 'skuOrModel'
  | 'skinTypes'
  | 'ingredients'
  | 'primaryAffiliateUrl'
  | 'sourceUrl'
  | 'sourceMerchant'
  | 'currentPrice'
  | 'originalPrice'
  | 'currency'
  | 'lastPriceSyncAt'
  | 'available'
  | 'walmartPrice'
  | 'walmartUrl'
  | 'walmartLastSyncAt'
  | 'ebayPrice'
  | 'ebayUrl'
  | 'ebayLastSyncAt'
  | 'seoTitle'
  | 'seoDescription'
  | 'seoKeywords'
> & {
  brandRef?: BlsProductBrand | null;
  categories?: BlsProductCategory[];
  specs?: {
    keyFeatures?: string[];
    skinTypes?: string[];
    ingredients?: string;
    technicalSpecs?: Record<string, string | number>;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    sourceUrl?: string;
    primaryAffiliateUrl?: string;
  };
  mpn?: string;
  sku?: string;
  offers?: CommerceOffer[];
};

const PRODUCT_POPULATE = {
  primaryImage: true,
  gallery: true,
  categories: { populate: ['parent', 'children', 'image'] },
  brandRef: { populate: ['logo'] },
  offers: { populate: { merchant: { populate: ['logo'] } } },
};

function merchantSlug(offer?: CommerceOffer): string {
  return offer?.merchant?.slug || '';
}

function normalizeCommerceProduct(product: CommerceProduct): BlsProduct {
  const offers = product.offers ?? [];
  const availableOffers = offers.filter((offer) => offer.status !== 'expired' && offer.availability !== 'out_of_stock');
  const pricedOffers = availableOffers.filter((offer) => offer.price !== undefined);
  const bestOffer = [...pricedOffers].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))[0] ?? availableOffers[0];
  const amazonOffer = offers.find((offer) => merchantSlug(offer).startsWith('amazon')) ?? bestOffer;
  const walmartOffer = offers.find((offer) => merchantSlug(offer).startsWith('walmart'));
  const ebayOffer = offers.find((offer) => merchantSlug(offer).startsWith('ebay'));
  const lastPriceSyncAt = offers
    .map((offer) => offer.lastCheckedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  return {
    ...product,
    brand: product.brandRef?.name || product.brand,
    keyFeatures: product.specs?.keyFeatures ?? [],
    skuOrModel: product.mpn || product.sku,
    skinTypes: product.specs?.skinTypes ?? [],
    ingredients: product.specs?.ingredients,
    primaryAffiliateUrl: amazonOffer?.affiliateUrl || amazonOffer?.productUrl || product.specs?.primaryAffiliateUrl,
    sourceUrl: amazonOffer?.productUrl || product.specs?.sourceUrl,
    sourceMerchant: merchantSlug(amazonOffer) || undefined,
    currentPrice: amazonOffer?.price ?? bestOffer?.price,
    originalPrice: amazonOffer?.originalPrice ?? bestOffer?.originalPrice,
    currency: amazonOffer?.currency ?? bestOffer?.currency ?? 'USD',
    lastPriceSyncAt,
    available: bestOffer ? bestOffer.availability !== 'out_of_stock' : undefined,
    walmartPrice: walmartOffer?.price,
    walmartUrl: walmartOffer?.affiliateUrl || walmartOffer?.productUrl,
    walmartLastSyncAt: walmartOffer?.lastCheckedAt,
    ebayPrice: ebayOffer?.price,
    ebayUrl: ebayOffer?.affiliateUrl || ebayOffer?.productUrl,
    ebayLastSyncAt: ebayOffer?.lastCheckedAt,
    seoTitle: product.specs?.seoTitle,
    seoDescription: product.specs?.seoDescription,
    seoKeywords: product.specs?.seoKeywords,
  };
}

export async function listProducts(
  opts: {
    page?: number;
    pageSize?: number;
    category?: string;
    brand?: string;
    skinType?: string;
    minPrice?: number;
    maxPrice?: number;
    q?: string;
    sort?: 'newest' | 'price-asc' | 'price-desc' | 'rating-desc';
    /* Only products with an imported rating (a descending rating sort puts unrated rows first in Postgres). */
    rated?: boolean;
  } = {},
) {
  const filters: Record<string, unknown> = {};
  if (opts.category) filters.categories = { slug: { $eqi: opts.category } };
  if (opts.rated) filters.rating = { $notNull: true };
  const andFilters: Record<string, unknown>[] = [];
  if (opts.brand) {
    andFilters.push({ $or: [
      { brand: { $eqi: opts.brand } },
      { brandRef: { slug: { $eqi: opts.brand } } },
      { brandRef: { name: { $eqi: opts.brand } } },
    ] });
  }
  if (opts.q?.trim()) {
    const q = opts.q.trim();
    andFilters.push({ $or: [
      { name: { $containsi: q } },
      { brand: { $containsi: q } },
      { shortDescription: { $containsi: q } },
      { description: { $containsi: q } },
      { categories: { name: { $containsi: q } } },
      { brandRef: { name: { $containsi: q } } },
    ] });
  }
  if (andFilters.length > 0) filters.$and = andFilters;

  const sortMap = {
    'newest':      ['publishedAt:desc'],
    'price-asc':   ['publishedAt:desc'],
    'price-desc':  ['publishedAt:desc'],
    'rating-desc': ['rating:desc', 'ratingCount:desc'],
  };

  const res = await commerceFetch<ListResponse<CommerceProduct>>('commerce-products', {
    sort: sortMap[opts.sort ?? 'newest'],
    populate: PRODUCT_POPULATE,
    pagination: { page: opts.page ?? 1, pageSize: opts.pageSize ?? 24 },
    filters,
  });
  let data = res.data.map(normalizeCommerceProduct);

  if (opts.skinType) {
    data = data.filter((product) => product.skinTypes?.some((skinType) => skinType.toLowerCase() === opts.skinType?.toLowerCase()));
  }
  if (opts.minPrice !== undefined) data = data.filter((product) => (product.currentPrice ?? Infinity) >= opts.minPrice!);
  if (opts.maxPrice !== undefined) data = data.filter((product) => (product.currentPrice ?? 0) <= opts.maxPrice!);
  if (opts.sort === 'price-asc') data = [...data].sort((a, b) => (a.currentPrice ?? Infinity) - (b.currentPrice ?? Infinity));
  if (opts.sort === 'price-desc') data = [...data].sort((a, b) => (b.currentPrice ?? 0) - (a.currentPrice ?? 0));

  return { ...res, data };
}

export async function getProduct(slug: string): Promise<BlsProduct | null> {
  const res = await commerceFetch<ListResponse<CommerceProduct>>('commerce-products', {
    filters: { slug: { $eq: slug } },
    populate: PRODUCT_POPULATE,
    pagination: { pageSize: 1 },
  });
  return res.data?.[0] ? normalizeCommerceProduct(res.data[0]) : null;
}

export type PricePoint = { date: string; price: number; currency?: string };

/** Price-history points for a product, oldest → newest, from
 *  commerce-price-snapshots. Used by the product page's Price History tab. */
export async function getPriceHistory(productDocumentId: string): Promise<PricePoint[]> {
  if (!productDocumentId) return [];
  try {
    const res = await strapiFetch<ListResponse<{ price?: number; currency?: string; checkedAt?: string }>>(
      'commerce-price-snapshots',
      {
        filters: { product: { documentId: { $eq: productDocumentId } } },
        fields: ['price', 'currency', 'checkedAt'],
        sort: ['checkedAt:asc'],
        pagination: { pageSize: 365 },
      },
    );
    return (res.data ?? [])
      .map((s) => ({ date: s.checkedAt ?? '', price: Number(s.price), currency: s.currency }))
      .filter((p) => p.date && Number.isFinite(p.price));
  } catch {
    return [];
  }
}

export type ProductReview = {
  id: number;
  documentId?: string;
  authorName: string;
  rating: number;
  title?: string;
  body: string;
  createdAt: string;
};

/** Approved first-party reviews for a product, newest first, from
 *  commerce-reviews. Only reviewStatus === 'approved' are returned. */
export async function listProductReviews(productDocumentId: string): Promise<ProductReview[]> {
  if (!productDocumentId) return [];
  try {
    const res = await strapiFetch<ListResponse<ProductReview & { reviewStatus?: string }>>(
      'commerce-reviews',
      {
        filters: {
          product: { documentId: { $eq: productDocumentId } },
          reviewStatus: { $eq: 'approved' },
        },
        fields: ['authorName', 'rating', 'title', 'body', 'createdAt'],
        sort: ['createdAt:desc'],
        pagination: { pageSize: 50 },
      },
      0,
    );
    return res.data ?? [];
  } catch {
    return [];
  }
}

export async function listProductCategories(): Promise<BlsProductCategory[]> {
  const res = await commerceFetch<ListResponse<BlsProductCategory>>('commerce-categories', {
    sort: ['order:asc', 'name:asc'],
    populate: ['parent', 'children', 'image'],
    pagination: { pageSize: CATEGORY_SLUGS.length },
  });
  return res.data;
}

/**
 * Product categories with how many of this site's products sit in each.
 *
 * One count query per category rather than a groupBy, because Strapi's REST
 * layer has no aggregate -- six cheap requests, cached by the same revalidate as
 * everything else. Goes through commerceFetch, so the site scope is applied and
 * the counts match what the category pages actually list.
 */
export async function listProductCategoryCounts(): Promise<
  { slug: string; name: string; count: number }[]
> {
  const cats = await listProductCategories();
  const counted = await Promise.all(
    cats.map(async (c) => {
      try {
        const res = await commerceFetch<ListResponse<{ id: number }>>('commerce-products', {
          filters: { categories: { slug: { $eqi: c.slug } } },
          fields: ['id'],
          pagination: { page: 1, pageSize: 1 },
        });
        return { slug: c.slug, name: c.name, count: res.meta?.pagination?.total ?? 0 };
      } catch {
        return { slug: c.slug, name: c.name, count: 0 };
      }
    }),
  );
  return counted.filter((c) => c.count > 0);
}

/**
 * Products to show inside an article, chosen from the post's own category.
 *
 * Mapped from the editorial hub to the commerce category, because the two use
 * different words for the same shelf -- the site writes about "moisturizers"
 * and stocks "moisturisers", "serums" against "facial-serums". No DataForSEO
 * call: every one of these categories already holds 33 to 43 products.
 *
 * Returns nothing for a hub with no obvious shelf (routines, ingredients,
 * dupes). A "related products" block under an explainer about how niacinamide
 * works, stocked with whatever happened to be nearby, is an advert wearing a
 * recommendation's clothes.
 */
const HUB_TO_COMMERCE: Record<string, string> = {
  serums: 'facial-serums',
  moisturizers: 'moisturisers',
  cleansers: 'facial-cleansers',
  exfoliants: 'exfoliators-and-scrubs',
  'anti-aging': 'anti-aging',
  'eye-cream': 'anti-aging',
  'sensitive-skin': 'moisturisers',
  acne: 'facial-cleansers',
  hyperpigmentation: 'facial-serums',
  sunscreen: 'moisturisers',
};

export async function listProductsForHub(hub: string, limit = 3): Promise<CommerceProduct[]> {
  const slug = HUB_TO_COMMERCE[hub];
  if (!slug) return [];
  try {
    const res = await commerceFetch<ListResponse<CommerceProduct>>('commerce-products', {
      filters: { categories: { slug: { $eqi: slug } } },
      populate: PRODUCT_POPULATE,
      sort: ['rating:desc', 'ratingCount:desc'],
      pagination: { page: 1, pageSize: limit },
    });
    return res.data ?? [];
  } catch {
    return [];
  }
}

/**
 * Products named in the post's own title, falling back to its category.
 *
 * "CeraVe Moisturizing Cream vs Vanicream" should show those two products, not
 * three arbitrary moisturisers. Matching is on the brand names this site
 * actually stocks rather than on free text: a title carries words like "Cream"
 * and "Skin" that would match half the catalogue, while a brand is a proper
 * noun that either appears or does not.
 *
 * Brands are matched longest-first so "Beauty of Joseon" wins over "Beauty",
 * and on word boundaries so "Olay" does not match inside another word. For each
 * brand found, the best-rated product from the post's own category is preferred,
 * because a moisturiser comparison should surface that brand's moisturiser and
 * not its cleanser.
 *
 * Falls back to the category selection when the title names fewer than two
 * stocked brands, which is most posts.
 */
export async function listProductsForPost(
  title: string,
  hub: string,
  limit = 3,
): Promise<CommerceProduct[]> {
  try {
    const stocked = await listLegacyProductBrands();
    const named = stocked
      .map((b) => b.name.trim())
      .filter((b) => b.length > 2)
      .sort((a, b) => b.length - a.length)
      .filter((b) => new RegExp(`(^|[^a-z0-9])${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i').test(title));

    /* One named brand is enough: a review post names a single product, and
       showing it beside two from the same shelf beats showing three unrelated
       ones. Only a title naming nothing falls straight through. */
    if (named.length === 0) return listProductsForHub(hub, limit);

    const commerceSlug = HUB_TO_COMMERCE[hub];
    const picked: CommerceProduct[] = [];
    const seen = new Set<string>();

    for (const brand of named.slice(0, limit)) {
      /* Same category first, then anywhere -- a brand named in the title is
         worth showing even if it has nothing on this particular shelf. */
      for (const filters of [
        commerceSlug
          ? { brand: { $eqi: brand }, categories: { slug: { $eqi: commerceSlug } } }
          : null,
        { brand: { $eqi: brand } },
      ]) {
        if (!filters) continue;
        const res = await commerceFetch<ListResponse<CommerceProduct>>('commerce-products', {
          filters,
          populate: PRODUCT_POPULATE,
          sort: ['rating:desc', 'ratingCount:desc'],
          pagination: { page: 1, pageSize: 1 },
        }).catch(() => null);
        const hit = res?.data?.[0];
        if (hit && !seen.has(hit.slug)) { seen.add(hit.slug); picked.push(hit); break; }
      }
    }

    if (picked.length === 0) return listProductsForHub(hub, limit);
    if (picked.length < limit) {
      /* Top up from the category, skipping anything already shown. */
      for (const extra of await listProductsForHub(hub, limit + picked.length)) {
        if (picked.length >= limit) break;
        if (!seen.has(extra.slug)) { seen.add(extra.slug); picked.push(extra); }
      }
    }
    return picked.slice(0, limit);
  } catch {
    return listProductsForHub(hub, limit);
  }
}

export async function listProductBrands(): Promise<BlsProductBrand[]> {
  /*
   * commerce-brands is shared across every storefront on this CMS and, like
   * commerce-categories, a brand row carries no site ownership at all -- no
   * tag, no relation. Reading it unfiltered put all 76 brands in the pool into
   * this skincare site's brand filter: Acer, Anker, Apple, Garmin, Reolink,
   * Samsung, CanaKit.
   *
   * The fallback below already had the right idea and was fixed for exactly
   * this, but it only runs when commerce-brands is unreachable -- which it
   * never is -- so the fix never executed. So derive the allowed set from this
   * site's own tagged products first, then keep the catalogue rows for those
   * brands (they carry the logo and slug the derived rows lack).
   */
  const own = await listLegacyProductBrands();
  const stocked = new Set(own.map((b) => b.name.trim().toLowerCase()));
  if (stocked.size === 0) return [];

  try {
    // commerce-scope-exempt: commerce-brands carries no tag and no relation,
    // so there is no server-side scope to apply. It is scoped instead by
    // intersecting with the brands this site's own products actually use,
    // immediately below. Do not copy this exemption to another collection.
    const res = await strapiFetch<ListResponse<BlsProductBrand>>('commerce-brands', {
      sort: ['order:asc', 'name:asc'],
      populate: ['logo'],
      pagination: { pageSize: 200 },
    });
    const matched = res.data.filter((b) => stocked.has(b.name.trim().toLowerCase()));
    const covered = new Set(matched.map((b) => b.name.trim().toLowerCase()));
    // A brand this site stocks but the catalogue has no row for still belongs
    // in the filter, so fall back to the product-derived entry for those.
    return [...matched, ...own.filter((b) => !covered.has(b.name.trim().toLowerCase()))]
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return own;
  }
}

async function listLegacyProductBrands(): Promise<BlsProductBrand[]> {
  const brands = new Set<string>();
  let page = 1;

  while (true) {
    const res = await commerceFetch<ListResponse<Pick<BlsProduct, 'brand'>>>('commerce-products', {
      fields: ['brand'],
      sort: ['brand:asc'],
      pagination: { page, pageSize: 100 },
    });

    for (const product of res.data) {
      const brand = product.brand?.trim();
      if (brand) brands.add(brand);
    }

    const pageCount = res.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) break;
    page++;
  }

  return Array.from(brands)
    .sort((a, b) => a.localeCompare(b))
    .map((name, index) => ({
      id: index + 1,
      name,
      slug: name,
    }));
}

export async function getProductCategory(slug: string): Promise<BlsProductCategory | null> {
  // A category outside this site's scope must 404 rather than render. The row
  // exists in the shared pool, so without this check /categories/smart-plugs
  // resolves and this skincare site serves a Smart Plugs page.
  if (!(CATEGORY_SLUGS as readonly string[]).includes(slug.toLowerCase())) return null;
  const res = await commerceFetch<ListResponse<BlsProductCategory>>('commerce-categories', {
    filters: { slug: { $eqi: slug } },
    populate: ['parent', 'children', 'image'],
    pagination: { pageSize: 1 },
  });
  return res.data?.[0] ?? null;
}


// =====================================================================

// Slug→category lookup for sitemap, etc.
export async function listAllPostSlugs(): Promise<{ slug: string; category: string; updatedAt: string }[]> {
  const all: { slug: string; category: string; updatedAt: string }[] = [];
  let page = 1;
  while (true) {
    const res = await strapiFetch<ListResponse<BlsPost>>('bls-posts', {
      fields: ['slug', 'updatedAt'],
      populate: { categories: { fields: ['slug'] } },
      sort: ['publishedAt:desc'],
      pagination: { page, pageSize: 100 },
      /* The sitemap is the one channel that must never run ahead: a queued URL
         listed here is a URL Google crawls today and dates today. */
      filters: withPublishedGate({}),
    });
    for (const p of res.data) {
      const cat = p.categories?.[0]?.slug ?? 'uncategorized';
      all.push({ slug: p.slug, category: cat, updatedAt: p.updatedAt });
    }
    const pageCount = res.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) break;
    page++;
  }
  return all;
}

export async function listAllProductSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  const all: { slug: string; updatedAt: string }[] = [];
  let page = 1;
  while (true) {
    const res = await commerceFetch<ListResponse<BlsProduct>>('commerce-products', {
      fields: ['slug', 'updatedAt'],
      sort: ['publishedAt:desc'],
      pagination: { page, pageSize: 100 },
    });
    for (const p of res.data) {
      all.push({ slug: p.slug, updatedAt: p.updatedAt });
    }
    const pageCount = res.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) break;
    page++;
  }
  return all;
}
