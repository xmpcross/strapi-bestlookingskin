import Link from 'next/link';
import { listPosts, listProducts, type BlsPost, type BlsProduct } from '@/lib/strapi';
import { SECTIONS, SITE } from '@/lib/site';
import PostCard from '@/components/PostCard';
import ArticlesCarousel from '@/components/ArticlesCarousel';
import ProductsCarousel from '@/components/ProductsCarousel';
import AdsenseUnit from '@/components/AdsenseUnit';
import ToolsCarousel, { type ToolCard } from '@/components/ToolsCarousel';

export const revalidate = 60;

/* Homepage modeled on https://bestlooking.skin/ — same flow:
   1. Hero (welcome banner + tagline + intro)
   2. Product Selection Tools (4 cards: How-to / Top-Rated / Informative / Comparisons)
   3. Category Showcase (Moisturizer / Reviews / Serum / Eye Cream)
   4. Welcome intro
   5. Latest Arrivals (recent products carousel)
   6. Skincare-type sections (Moisturizer / Serum / Eye Cream / Anti-Aging) — show
      posts whose title or content mentions the term, since we don't yet have a
      product-type taxonomy
   7. Product Reviews — feature + grid pulled from reviews category
   8. Our Commitment (mission blurb)
   9. Articles (latest editorial)
   10. Articles                                                                  */

const SKINCARE_TYPES: { label: string; query: string }[] = [
  { label: 'Moisturizer', query: 'moisturizer' },
  { label: 'Serum',       query: 'serum' },
  { label: 'Eye Cream',   query: 'eye cream' },
  { label: 'Anti-Aging',  query: 'anti-aging' },
];

const TOOLS: ToolCard[] = [
  { title: 'How-To Guides',         href: '/how-to-guides',           blurb: 'Step-by-step routines and layering rules.',     emoji: '📖' },
  { title: 'Top-Rated Products',    href: '/top-rated-products',      blurb: 'The standouts across cleansers, serums, SPF.',  emoji: '⭐' },
  { title: 'Product Reviews',       href: '/product-reviews',         blurb: 'Clear product verdicts, details and routine fit.', emoji: '🔎', isNew: true },
  { title: 'Informative Articles',  href: '/informative-articles',    blurb: 'Ingredients, skin types, the science behind it.', emoji: '🧪' },
  { title: 'Comparisons',           href: '/product-comparisons',     blurb: 'Side-by-side breakdowns to pick a routine.',    emoji: '⚖️' },
];

// Hero mosaic — visual tiles built from the curated /public showcase imagery.
// Replaces the former article cards; each tile links into the matching category.
const HERO_IMAGES: { label: string; href: string; img: string }[] = [
  { label: 'Moisturizers', href: '/categories/moisturisers',    img: '/showcase-moisturizer.jpg' },
  { label: 'Serums',       href: '/categories/facial-serums',   img: '/showcase-serum.jpg' },
  { label: 'Eye Care',     href: '/categories/facial-cleansers', img: '/showcase-eyecream.jpg' },
  { label: 'Reviews',      href: '/product-reviews',            img: '/showcase-reviews.jpg' },
];

const SHOWCASE: { label: string; href: string; img: string }[] = [
  {
    label: 'Moisturizer',
    href: '/categories/moisturisers',
    img: '/showcase-moisturizer.jpg',
  },
  {
    label: 'Anti-Aging',
    href: '/categories/anti-aging',
    img: '/showcase-reviews.jpg',
  },
  {
    label: 'Serum',
    href: '/categories/facial-serums',
    img: '/showcase-serum.jpg',
  },
  {
    label: 'Eye Cream',
    href: '/categories/facial-cleansers',
    img: '/showcase-eyecream.jpg',
  },
];

function randomizeProducts(products: BlsProduct[], limit: number) {
  const shuffled = [...products];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, limit);
}

export default async function HomePage() {
  // Fetch all editorial sections in parallel
  const perSection = await Promise.all(
    SECTIONS.map((s) =>
      listPosts({ category: s.slug, pageSize: 8 })
        .then((r) => r.data)
        .catch(() => [] as BlsPost[]),
    ),
  );
  const bySection: Record<string, BlsPost[]> = Object.fromEntries(
    SECTIONS.map((s, i) => [s.slug, perSection[i]]),
  );

  // Skincare-type sections — driven by full-text search of post bodies
  const perSkincareType = await Promise.all(
    SKINCARE_TYPES.map((t) =>
      listPosts({ q: t.query, pageSize: 4 })
        .then((r) => r.data)
        .catch(() => [] as BlsPost[]),
    ),
  );

  // Latest Arrivals — random products from a larger eligible pool.
  const latestProducts = await listProducts({ sort: 'newest', pageSize: 60 })
    .then((r) => randomizeProducts(r.data, 10))
    .catch(() => [] as BlsProduct[]);

  // Facial Serums section — products in the bls-product-category 'facial-serums'
  const facialSerumProducts = await listProducts({ category: 'facial-serums', sort: 'newest', pageSize: 10 })
    .then((r) => r.data)
    .catch(() => [] as BlsProduct[]);

  const reviews = bySection['product-reviews'] ?? [];
  const articles = bySection['informative-articles'] ?? [];

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div data-testid="home-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <Hero />
      <WelcomeIntro />
      <section className="bg-white py-8 sm:py-10" data-testid="home-ad">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <AdsenseUnit slot="3958661572" className="mx-auto" />
        </div>
      </section>
      <LatestArrivals products={latestProducts} />
      <CategoryShowcase />
      <ProductSelectionTools />
      {reviews.length > 0 && <ProductReviews posts={reviews.slice(0, 5)} />}
      <CommitmentBlock />
      {/* Facial Serums product carousel (replaces former Moisturizer / Serum
          / Eye Cream post sections). Pulls from the bls-product-category
          'facial-serums' — create that category in Strapi or via the importer
          (BLS_PRODUCT_CATEGORY=facial-serums) to populate it. */}
      <FacialSerumsSection products={facialSerumProducts} />
      <FirstStepSection />
      {articles.length > 0 && <ArticlesGrid posts={articles.slice(0, 5)} />}
    </div>
  );
}

/* ---------- HERO ---------- */

function Hero() {
  return (
    <section className="bg-[#fbfbf8]" data-testid="home-hero">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:py-16 lg:grid-cols-[0.88fr_1.12fr] lg:items-stretch lg:py-20">
        <div className="flex min-h-[520px] flex-col justify-between border-y border-ink/10 py-8 lg:py-10">
          <div>
            <p className="font-inter text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Research-first skincare
            </p>
            <h1 className="mt-5 max-w-3xl font-display text-ink">
              Find products that make sense for your skin.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-ink/70 sm:text-lg">
              Independent product research, ingredient explainers and comparison guides for building
              a routine without the guesswork.
            </p>
          </div>

          <div className="grid gap-3 pt-8 sm:grid-cols-3">
            {[
              ['100+', 'product notes'],
              ['5', 'editorial paths'],
              ['60 sec', 'quick compare'],
            ].map(([value, label]) => (
              <div key={label} className="border-l border-ink/10 pl-4">
                <p className="text-2xl font-semibold leading-none text-ink">{value}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <HeroMosaic />
      </div>
    </section>
  );
}

/* Hero image mosaic — a tall featured tile beside two stacked tiles, with a
   full-width banner strip below. Pure imagery (no article data); each tile
   deep-links into the matching category. */
function HeroMosaic() {
  const [moisturizer, serum, eyeCream, reviews] = HERO_IMAGES;

  return (
    <div className="grid min-h-[520px] gap-4">
      <div className="grid flex-1 gap-4 sm:grid-cols-[1.25fr_0.75fr]">
        <HeroImageTile tile={moisturizer} className="min-h-[300px] sm:min-h-[400px]" featured />
        <div className="grid gap-4">
          <HeroImageTile tile={serum} className="min-h-[160px] sm:min-h-[192px]" />
          <HeroImageTile tile={eyeCream} className="min-h-[160px] sm:min-h-[192px]" />
        </div>
      </div>
      <HeroImageTile tile={reviews} className="min-h-[140px] sm:min-h-[152px]" wide />
    </div>
  );
}

function HeroImageTile({
  tile,
  className,
  featured = false,
  wide = false,
}: {
  tile: (typeof HERO_IMAGES)[number];
  className: string;
  featured?: boolean;
  wide?: boolean;
}) {
  return (
    <Link
      href={tile.href}
      className={`group relative block overflow-hidden ${className}`}
      data-testid={`hero-image-${tile.label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={tile.img}
        alt={tile.label}
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
      />
      <span className="absolute inset-0 bg-ink/25 transition group-hover:bg-ink/15" aria-hidden />
      <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/70 to-transparent" aria-hidden />
      <span
        className={`absolute left-5 right-5 flex items-end justify-between gap-3 ${wide ? 'bottom-4' : 'bottom-5'}`}
      >
        <span
          className={`font-display font-bold leading-none text-white ${featured ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'}`}
        >
          {tile.label}
        </span>
        <span
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-base text-ink transition group-hover:translate-x-1 sm:inline-flex"
          aria-hidden
        >
          →
        </span>
      </span>
    </Link>
  );
}

/* ---------- PRODUCT SELECTION TOOLS — 4 large cards ---------- */

function ProductSelectionTools() {
  return (
    <section className="bg-white py-14 sm:py-16" data-testid="selection-tools">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Editorial paths"
          title="Choose how you want to shop."
          subtitle="Jump into reviews, comparisons, top-rated lists or practical routine advice."
        />
        <ToolsCarousel tools={TOOLS} />
      </div>
    </section>
  );
}

/* ---------- CATEGORY SHOWCASE ---------- */

function CategoryShowcase() {
  const [moisturizer, reviewsTile, serum, eyeCream] = SHOWCASE;

  return (
    <section className="bg-white py-16 sm:py-20" data-testid="category-showcase">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-inter text-xs font-semibold uppercase tracking-[0.28em] text-primary">Routine finder</p>
            <h3 className="mt-3 font-display font-extrabold tracking-tight text-ink">Start where your skin needs help.</h3>
          </div>
          <p className="max-w-md text-sm font-normal leading-7 text-ink/65">
            Visual shortcuts for the categories readers compare most often.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-[1.02fr_0.98fr] md:items-stretch">
          <ShowcaseTile tile={moisturizer} className="min-h-[440px] md:min-h-[620px]" featured />
          <div className="grid gap-4 sm:grid-cols-2">
            <ShowcaseTile tile={reviewsTile} className="min-h-[250px] sm:col-span-2 md:min-h-[300px]" />
            <ShowcaseTile tile={serum} className="min-h-[250px] md:min-h-[300px]" />
            <ShowcaseTile tile={eyeCream} className="min-h-[250px] md:min-h-[300px]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ShowcaseTile({
  tile,
  className,
  featured = false,
}: {
  tile: (typeof SHOWCASE)[number];
  className: string;
  featured?: boolean;
}) {
  return (
    <Link
      href={tile.href}
      className={`group relative block overflow-hidden rounded-3xl ${className}`}
      data-testid={`showcase-${tile.label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={tile.img}
        alt={tile.label}
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
      />
      <span className="absolute inset-0 bg-ink/34 transition group-hover:bg-ink/25" aria-hidden />
      <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" aria-hidden />
      <span className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 sm:bottom-8 sm:left-8 sm:right-8">
        <span className={`${featured ? 'text-4xl' : 'text-2xl'} font-display font-bold leading-none text-white`}>
          {tile.label}
        </span>
        <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-lg text-ink transition group-hover:translate-x-1 sm:inline-flex" aria-hidden>
          →
        </span>
      </span>
    </Link>
  );
}

/* ---------- WELCOME INTRO (mission block, copy from bestlooking.skin) ---------- */

function WelcomeIntro() {
  return (
    <section className="bg-white py-20 sm:py-28" data-testid="welcome-intro">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-display font-bold tracking-tight text-ink">Welcome to bestlooking.skin</h2>
          <p className="welcome-lead mt-7">
            Honest reviews, real ingredient talk and routines that actually fit your skin.
          </p>
        </div>
        <div className="space-y-6 border-l border-ink/10 pl-6 text-base font-normal leading-8 text-ink/72 sm:pl-10 sm:text-lg sm:leading-9">
          <p>
            BestLooking.Skin is built for people who want skincare advice that feels clear,
            practical and easy to act on. We bring together product research, ingredient notes,
            comparisons and reviews so you can understand what a formula does before it earns a
            place in your routine.
          </p>
          <p>
            Every skin journey is different. That is why we look beyond hype and focus on the
            details that matter: skin type, texture, ingredients, value and how products work
            together. Whether you are building your first routine or refining an existing one, our
            goal is to help you choose with confidence.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------- LATEST ARRIVALS ---------- */

function LatestArrivals({ products }: { products: BlsProduct[] }) {
  if (products.length === 0) {
    return (
      <section className="bg-paper py-16 sm:py-20" data-testid="latest-arrivals-empty">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="Just in"
            title="Recently Added"
            subtitle="Fresh products will appear here once they're added to the catalog."
            viewAll="/products"
          />
        </div>
      </section>
    );
  }
  return (
    <section className="bg-paper py-16 sm:py-20" data-testid="latest-arrivals">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Just in"
          title="Recently Added"
          subtitle="Recently added products for comparing texture, actives, price and routine fit."
          viewAll="/products"
        />
        <div className="mt-10 rounded px-4 py-6 sm:px-6">
          <ProductsCarousel products={products} />
        </div>
      </div>
    </section>
  );
}

/* ---------- COMMITMENT BLOCK (editorial copy from bestlooking.skin) ---------- */

function CommitmentBlock() {
  const commitments = [
    {
      title: 'Clear product guidance',
      text: 'We translate product claims, ingredient lists and routine advice into practical notes you can use before you buy.',
    },
    {
      title: 'Inclusive skin education',
      text: 'Our guides are written for every level, from first routines to focused treatments, with care for different skin needs and budgets.',
    },
    {
      title: 'Current, useful picks',
      text: 'We keep recommendations, reviews and top-rated lists refreshed so the content stays relevant as formulas and products change.',
    },
  ];

  return (
    <section className="bg-paper py-16 text-ink sm:py-20" data-testid="commitment-block">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Promise</p>
            <h3 className="mt-4 max-w-xl text-ink">
              Useful advice before anything else.
            </h3>
          </div>
          <div className="max-w-2xl">
            <p className="text-base leading-8 text-ink/70 sm:text-lg sm:leading-9">
              The platform is built to help you compare formulas, understand ingredients and
              choose routines with more confidence. We focus on useful reviews, practical education
              and product discovery that respects your skin, your budget and your time.
            </p>
            <div className="mt-8 divide-y divide-ink/12 border-y border-ink/12">
              {commitments.map((item) => (
                <details key={item.title} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 [&::-webkit-details-marker]:hidden">
                    <h6 className="text-lg font-semibold text-ink">{item.title}</h6>
                    <span
                      aria-hidden
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-ink/15 text-lg leading-none text-primary transition group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-ink/70">{item.text}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- FACIAL SERUMS — products carousel ---------- */

function FacialSerumsSection({ products }: { products: BlsProduct[] }) {
  return (
    <section className="bg-white py-16 sm:py-20" data-testid="facial-serums">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Editor's pick"
          title="Facial Serums"
          subtitle="Targeted treatments — vitamin C, hyaluronic, retinol and more."
          viewAll="/categories/facial-serums"
        />
        {products.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-ink/15 px-6 py-12 text-center text-sm text-ink/55">
            No products in the <strong>Facial Serums</strong> product category yet — create the
            category in Strapi (Commerce · Category) or run the Apify importer with{' '}
            <code className="rounded bg-muted px-1.5 py-0.5">BLS_PRODUCT_CATEGORY=facial-serums</code>.
          </div>
        ) : (
          <div className="mt-10 border-t border-ink/10 pt-8">
            <ProductsCarousel products={products} thumbBg="bg-[#f5f7fd]" />
          </div>
        )}
      </div>
    </section>
  );
}


/* ---------- SKINCARE-TYPE SECTIONS ---------- */

function SkincareTypeSection({
  label,
  query,
  posts,
  alt,
}: {
  label: string;
  query: string;
  posts: BlsPost[];
  alt?: boolean;
}) {
  return (
    <section
      className={alt ? 'bg-muted py-14' : 'bg-paper py-14'}
      data-testid={`skincare-type-${query}`}
    >
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Shop the category"
          title={label}
          subtitle={`Latest editorial covering ${label.toLowerCase()} — picks, comparisons and how-to.`}
          viewAll={`/search?q=${encodeURIComponent(query)}`}
        />
        {posts.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-ink/15 px-6 py-12 text-center text-sm text-ink/55">
            No posts mention {label} yet — check back after content is imported.
          </div>
        ) : (
          <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {posts.slice(0, 4).map((p) => (
              <PostCard key={p.id} post={p} variant="tile" thumbBg="bg-white" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- PRODUCT REVIEWS — feature + 4-up ---------- */

function ProductReviews({ posts }: { posts: BlsPost[] }) {
  const [feature, ...rest] = posts;
  return (
    <section className="bg-white py-16" data-testid="product-reviews">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Hands-on"
          title="Product Reviews"
          subtitle="Honest takes on the products people are actually shopping for."
          viewAll="/product-reviews"
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <PostCard post={feature} variant="feature" thumbBg="bg-white" />
          <div className="grid gap-6 sm:grid-cols-2">
            {rest.slice(0, 4).map((p) => (
              <PostCard key={p.id} post={p} variant="tile" thumbBg="bg-white" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- FIRST STEP TO GREAT SKIN — editorial closer ---------- */

function FirstStepSection() {
  return (
    <section className="bg-white py-20 sm:py-24" data-testid="first-step">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <p className="font-inter text-xs font-semibold uppercase tracking-[0.28em] text-primary">Next step</p>
          <h3 className="mt-4 font-display font-extrabold tracking-tight text-ink">Steps, to Great Skin</h3>
        </div>
        <div className="space-y-6 border-l border-ink/10 pl-6 text-base font-normal leading-8 text-ink/72 sm:pl-10 sm:text-lg sm:leading-9">
          <p>
            Start with one clear skin goal, then build from there. Browse cleansers, serums,
            moisturisers and targeted treatments by category so you can compare products without
            feeling pulled in every direction at once.
          </p>
          <p>
            Use our reviews, comparisons and top-rated picks to understand what each formula does,
            who it may suit and how it can fit into a simple routine. Better skin choices begin
            with better information.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------- ARTICLES ---------- */

function ArticlesGrid({ posts }: { posts: BlsPost[] }) {
  return (
    <section className="bg-paper py-16 sm:py-20" data-testid="articles">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Read more"
          title="Articles"
          subtitle="Background reading — ingredients, skin types and the science behind the bottle."
          viewAll="/informative-articles"
        />
        <div className="mt-10 rounded-[1.75rem] px-4 py-6 sm:px-6">
          <ArticlesCarousel posts={posts} />
        </div>
      </div>
    </section>
  );
}

/* ---------- shared section header ---------- */

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  viewAll,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  viewAll?: string;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="font-inter text-xs font-semibold uppercase tracking-[0.28em] text-[#e33333]">{eyebrow}</p>
        <h3 className="mt-3 font-display font-extrabold tracking-tight text-ink">{title}</h3>
        <p className="mt-3 max-w-2xl text-sm font-normal leading-7 text-ink/65 sm:text-base">{subtitle}</p>
      </div>
      {viewAll && (
        <Link
          href={viewAll}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-ink/15 bg-white/70 px-4 py-2 font-inter text-xs font-semibold uppercase tracking-[0.2em] text-ink transition hover:border-primary hover:text-primary"
        >
          See all
          <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  );
}
