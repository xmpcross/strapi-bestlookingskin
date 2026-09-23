import type { MetadataRoute } from 'next';
import {
  listAllPostSlugs,
  listAllProductSlugs,
  listAuthors,
  listProductBrands,
  listCategories,
  listProductCategories,
} from '@/lib/strapi';
import { SECTIONS, SITE } from '@/lib/site';
import { isIndexableBrand } from '@/lib/brands';

/* Rebuilt hourly, so new posts and products appear without a deploy. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /* Fixed pages carry a hand-set date: update it here when that page's content changes (never new Date(), which
     made every page look changed on every build). Listing pages take the date of their newest item. */
  const FIXED: Record<string, string> = {
    '/about': '2026-09-24',
    '/contact': '2026-09-24',
    '/legal/terms': '2026-05-02',
    '/legal/privacy': '2026-05-02',
    '/legal/cookies': '2026-05-02',
    '/legal/disclosure': '2026-09-11',
  };

  const [posts, products, cmsCategories, productCategories, authors, brands] = await Promise.all([
    listAllPostSlugs().catch(() => []),
    listAllProductSlugs().catch(() => []),
    listCategories().catch(() => []),
    listProductCategories().catch(() => []),
    listAuthors().catch(() => []),
    listProductBrands().catch(() => []),
  ]);

  const newest = (dates: (string | undefined)[]) => {
    const d = dates.filter(Boolean).sort().at(-1);
    return d ? new Date(d) : undefined;
  };
  const newestPost = newest(posts.map((p) => p.lastModified));
  const newestProduct = newest(products.map((p) => p.lastModified));
  const hubDate = new Map<string, Date | undefined>();
  for (const p of posts) {
    const cur = hubDate.get(p.category);
    const d = new Date(p.lastModified);
    if (!cur || d > cur) hubDate.set(p.category, d);
  }
  const cmsCatSlugs = new Set(cmsCategories.map((c) => c.slug));
  const sectionCatSlugs = SECTIONS.map((s) => s.slug);
  /* Retired archives redirect, so they are not listed. */
  const retired = new Set<string>(SECTIONS.filter((s) => s.redirectTo).map((s) => s.slug));
  const categorySlugs = Array.from(new Set([...cmsCatSlugs, ...sectionCatSlugs])).filter((slug) => !retired.has(slug));

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, lastModified: newestPost, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE.url}/about`, lastModified: new Date(FIXED['/about']), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE.url}/contact`, lastModified: new Date(FIXED['/contact']), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE.url}/topics`, lastModified: newestPost, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE.url}/products`, lastModified: newestProduct, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE.url}/brands`, lastModified: newestProduct, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE.url}/sitemap`, lastModified: newestPost, changeFrequency: 'weekly', priority: 0.3 },
    { url: `${SITE.url}/legal/terms`, lastModified: new Date(FIXED['/legal/terms']), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE.url}/legal/privacy`, lastModified: new Date(FIXED['/legal/privacy']), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE.url}/legal/cookies`, lastModified: new Date(FIXED['/legal/cookies']), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE.url}/legal/disclosure`, lastModified: new Date(FIXED['/legal/disclosure']), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE.url}/categories`, lastModified: newestProduct, changeFrequency: 'weekly', priority: 0.5 },
    /* /faqs is noindexed (a compilation of FAQ sections already on the posts), so it is not listed. */
  ];

  const categoryEntries: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${SITE.url}/${slug}`,
    lastModified: hubDate.get(slug) ?? newestPost,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE.url}/${p.category}/${p.slug}`,
    lastModified: new Date(p.lastModified),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const productCategoryEntries: MetadataRoute.Sitemap = productCategories.map((category) => ({
    url: `${SITE.url}/categories/${encodeURIComponent(category.slug)}`,
    lastModified: newestProduct,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE.url}/products/${product.slug}`,
    lastModified: new Date(product.lastModified),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  /* Author pages: named authors are a trust signal. */
  const authorEntries: MetadataRoute.Sitemap = authors.map((a) => ({
    url: `${SITE.url}/authors/${a.slug}`,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  /* Brand pages, only the indexable ones (3+ products or an intro: lib/brands.ts). */
  const brandEntries: MetadataRoute.Sitemap = brands.filter(isIndexableBrand).map((b) => ({
    url: `${SITE.url}/brands/${b.slug}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [
    ...staticEntries,
    ...authorEntries,
    ...brandEntries,
    ...categoryEntries,
    ...postEntries,
    ...productCategoryEntries,
    ...productEntries,
  ];
}
