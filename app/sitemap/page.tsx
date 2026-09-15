import Link from 'next/link';
import type { Metadata } from 'next';
import {
  listAllPostSlugs,
  listAllProductSlugs,
  listCategories,
  listProductCategories,
  type BlsCategory,
  type BlsProductCategory,
} from '@/lib/strapi';
import { SECTIONS, SITE } from '@/lib/site';
import { fmtDate } from '@/lib/format';
import Breadcrumb from '@/components/magzin/Breadcrumb';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Site Map',
  description: `Browse every page on ${SITE.name} — categories, posts, about, contact and the XML feed.`,
  alternates: { canonical: '/sitemap' },
};

type PostSlug = { slug: string; category: string; updatedAt: string };
type ProductSlug = { slug: string; updatedAt: string };

export default async function HtmlSitemapPage() {
  const [posts, products, cmsCats, productCats]: [
    PostSlug[],
    ProductSlug[],
    BlsCategory[],
    BlsProductCategory[],
  ] = await Promise.all([
    listAllPostSlugs().catch(() => [] as PostSlug[]),
    listAllProductSlugs().catch(() => [] as ProductSlug[]),
    listCategories().catch(() => [] as BlsCategory[]),
    listProductCategories().catch(() => [] as BlsProductCategory[]),
  ]);

  // Group posts by their primary category slug for the listing
  const byCat = new Map<string, PostSlug[]>();
  for (const p of posts) {
    if (!byCat.has(p.category)) byCat.set(p.category, []);
    byCat.get(p.category)!.push(p);
  }

  // Use config sections for stable display order; fall back to whatever else
  // came from the CMS or got tagged with an unknown slug.
  const orderedCats = [
    ...SECTIONS.filter((s) => !s.redirectTo).map((s) => ({ slug: s.slug, name: s.title })),
    ...cmsCats
      .filter((c) => !SECTIONS.some((s) => s.slug === c.slug))
      .map((c) => ({ slug: c.slug, name: c.name })),
  ];

  return (
    <div data-testid="sitemap-page">
      <section className="sec-breadcumb">
        <div className="container">
          <Breadcrumb items={[{ label: 'Sitemap' }]} />
          <div className="row align-items-end">
            <div className="col-lg-8 col-12">
              <div className="title">
                <p className="bls-eyebrow mb-3">Everything on BestLooking</p>
                <h1 className="h3 mb-0">Sitemap</h1>
                <p className="bls-page-lead mt-3 mb-0">
                  A human-readable index of every page. For machines see{' '}
                  <Link href="/sitemap.xml" className="bls-link">
                    /sitemap.xml
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-5 pb-70">
        <div className="container">
          {/* Top-level pages */}
          <div className="row g-4">
            <div className="col-lg-3 col-12">
              <h2 className="h5 mb-0">Pages</h2>
            </div>
            <div className="col-lg-9 col-12">
              <ul className="block-tag list-unstyled d-flex flex-wrap gap-2 m-0 p-0">
                <SiteLink href="/">Home</SiteLink>
                <SiteLink href="/about">About us</SiteLink>
                <SiteLink href="/contact">Contact us</SiteLink>
                <SiteLink href="/products">Products</SiteLink>
                <SiteLink href="/brands">Brands</SiteLink>
                <SiteLink href="/search">Search</SiteLink>
                <SiteLink href="/feed.xml">RSS feed</SiteLink>
                <SiteLink href="/sitemap.xml">XML sitemap</SiteLink>
              </ul>
            </div>
          </div>

          <hr className="bls-divider" />

          {/* Product categories + products */}
          <div className="row g-4">
            <div className="col-lg-3 col-12">
              <h2 className="h5 mb-2">Product categories &amp; products</h2>
              <p className="fs-7 mb-0">
                {products.length} products across {productCats.length} product categories.
              </p>
            </div>
            <div className="col-lg-9 col-12">
              {productCats.length > 0 && (
                <div className="mb-5" data-testid="sitemap-product-categories">
                  <GroupHeading href="/products" count={`${productCats.length} categories`}>
                    Product categories
                  </GroupHeading>
                  <ul className="list-unstyled row g-1 m-0 mt-2 p-0">
                    {productCats.map((category) => (
                      <li key={category.slug} className="col-md-6 col-12">
                        <Link href={`/categories/${category.slug}`} className="bls-sitemap-link">
                          <span className="bls-sitemap-title">{category.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {products.length > 0 && (
                <div data-testid="sitemap-products">
                  <GroupHeading href="/products" count={`${products.length} products`}>
                    Products
                  </GroupHeading>
                  <ul className="list-unstyled row g-1 m-0 mt-2 p-0">
                    {products.map((product) => (
                      <li key={product.slug} className="col-md-6 col-12">
                        <Link href={`/products/${product.slug}`} className="bls-sitemap-link">
                          <span className="bls-sitemap-title">{humanizeSlug(product.slug)}</span>
                          <span className="bls-sitemap-date">{fmtDate(product.updatedAt)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <hr className="bls-divider" />

          {/* Categories + posts */}
          <div className="row g-4">
            <div className="col-lg-3 col-12">
              <h2 className="h5 mb-2">Categories &amp; posts</h2>
              <p className="fs-7 mb-0">
                {posts.length} posts across {orderedCats.filter((c) => byCat.get(c.slug)?.length).length} categories.
              </p>
            </div>
            <div className="col-lg-9 col-12">
              {orderedCats.map(({ slug, name }) => {
                const items = byCat.get(slug) ?? [];
                if (items.length === 0) return null;
                return (
                  <div key={slug} className="mb-5" data-testid={`sitemap-cat-${slug}`}>
                    <GroupHeading href={`/${slug}`} count={`${items.length} posts`}>
                      {name}
                    </GroupHeading>
                    <ul className="list-unstyled row g-1 m-0 mt-2 p-0">
                      {items.map((p) => (
                        <li key={p.slug} className="col-md-6 col-12">
                          <Link href={`/${slug}/${p.slug}`} className="bls-sitemap-link">
                            <span className="bls-sitemap-title">{humanizeSlug(p.slug)}</span>
                            <span className="bls-sitemap-date">{fmtDate(p.updatedAt)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SiteLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="tag-item bls-tag">
        {children}
      </Link>
    </li>
  );
}

function GroupHeading({ href, count, children }: { href: string; count: string; children: React.ReactNode }) {
  return (
    <h3 className="h6 mb-0">
      <Link href={href} className="d-inline-flex flex-wrap align-items-baseline gap-2 hover-dark">
        {children}
        <span className="fs-8 fw-medium text-600">{count}</span>
      </Link>
    </h3>
  );
}

function humanizeSlug(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
