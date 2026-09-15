import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProduct, listProducts, getPriceHistory, listProductReviews, mediaUrl, type BlsProduct, listProductCategoryCounts } from '@/lib/strapi';
import { SITE } from '@/lib/site';
import ProductCard from '@/components/ProductCard';
import PriceAlertForm from '@/components/PriceAlertForm';
import PriceHistoryChart from '@/components/PriceHistoryChart';
import ReviewForm from '@/components/ReviewForm';
import ReviewList from '@/components/ReviewList';
import PriceBadges from '@/components/PriceBadges';
import ProductInfoAccordion from '@/components/ProductInfoAccordion';
import SidebarTitle from '@/components/magzin/SidebarTitle';
import CategoryListWidget from '@/components/magzin/CategoryListWidget';
import { productAttributes, productLead } from '@/lib/product-attributes';
import Breadcrumb from '@/components/magzin/Breadcrumb';

/*
 * Right sidebar on the product page (col-lg-4 beside the tabs).
 *
 * It shows topic browsing and the latest guides. Product specifications now live in the Specifications tab
 * (lib/product-attributes.ts reads both the flat sourcing attributes and the iHerb `technicalSpecs`).
 */
const SHOW_PRODUCT_SIDEBAR = true;

export const revalidate = 60;
export const dynamicParams = true;

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug).catch(() => null);
  if (!p) return { title: 'Not found' };

  const cover = mediaUrl(p.primaryImage ?? null);
  const description = p.seoDescription || p.shortDescription || `${p.brand ?? ''} ${p.name}`.trim();

  return {
    title: p.seoTitle || p.name,
    description,
    keywords: p.seoKeywords,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      type: 'website',
      title: p.seoTitle || p.name,
      description,
      url: `${SITE.url}/products/${p.slug}`,
      images: cover ? [{ url: cover }] : undefined,
    },
    twitter: {
      card: cover ? 'summary_large_image' : 'summary',
      title: p.seoTitle || p.name,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = await getProduct(slug).catch(() => null);
  if (!product) notFound();

  // Related: same category, exclude self
  const relatedRes = product.categories?.[0]
    ? await listProducts({ category: product.categories[0].slug, pageSize: 6 }).catch(() => null)
    : null;
  const related = (relatedRes?.data ?? []).filter((p) => p.id !== product.id).slice(0, 5);

  // Sidebar topic list: this site's categories with live product counts.
  const topicRows = await listProductCategoryCounts().catch(() => []);
  // Catalogue total for the sidebar's "All products" row (the same scoped count the /products listing uses).
  const productTotal = await listProducts({ pageSize: 1 })
    .then((r) => r.meta.pagination.total)
    .catch(() => null);

  // Price-history points (from commerce-price-snapshots) for the Price History tab.
  const priceHistory = await getPriceHistory(product.documentId ?? '');
  const productReviews = await listProductReviews(product.documentId ?? '');

  // Rating summary shown under the product title — prefer first-party reviews,
  // falling back to the imported aggregate rating.
  const fpCount = productReviews.length;
  const fpAvg = fpCount ? productReviews.reduce((s, r) => s + r.rating, 0) / fpCount : 0;
  const ratingValue = fpCount ? fpAvg : (product.rating ?? 0);
  const ratingCount = fpCount || product.ratingCount || 0;
  const ratingIsReviews = fpCount > 0;

  // Attribute rows for the Specifications and Additional Info tabs, and the lead under the title.
  const attributes = productAttributes(product.specs as Record<string, unknown> | undefined);
  const lead = productLead(product.shortDescription, product.description);

  // Sidebar "Featured Products": the best-rated products in the catalogue, leaving out this product and the ones
  // already in the "More in {category}" row. The CMS has no featured flag. Ratings are weighted by how many there
  // are (a Bayesian average pulled towards 4.0 by 20 phantom ratings), so a 5.0 from four ratings does not
  // outrank a 4.9 from fifteen thousand.
  const shownIds = new Set([product.id, ...related.map((r) => r.id)]);
  const weightedRating = (p: BlsProduct) => ((p.rating ?? 0) * (p.ratingCount ?? 0) + 4 * 20) / ((p.ratingCount ?? 0) + 20);
  const featuredProducts = await listProducts({ sort: 'rating-desc', rated: true, pageSize: 100 })
    .then((r) =>
      r.data
        .filter((p) => !shownIds.has(p.id))
        .sort((a, b) => weightedRating(b) - weightedRating(a))
        .slice(0, 5),
    )
    .catch(() => [] as BlsProduct[]);

  const cover = mediaUrl(product.primaryImage ?? null);
  const galleryImgs = (product.gallery ?? []).slice(0, 6);
  const cat = product.categories?.[0];

  const hasDiscount =
    product.originalPrice && product.currentPrice && product.originalPrice > product.currentPrice;

  // Build the offer-panel rows from the FULL offers relation (one row per
  // marketplace offer), so every merchant the product has shows up — not just
  // Amazon/Walmart/eBay. Falls back to the legacy flat fields only when a
  // product has no offers relation.
  type OfferRow = { merchant: string; price?: number; url: string; available: boolean; logoUrl?: string | null };
  const offerRows: OfferRow[] = (product.offers ?? [])
    .map((offer) => ({
      merchant: merchantLabel(offer.merchant?.slug) || offer.merchant?.name || 'Store',
      price: typeof offer.price === 'number' ? offer.price : undefined,
      url: offer.affiliateUrl || offer.productUrl || '',
      available: offer.availability !== 'out_of_stock' && offer.status !== 'expired',
      logoUrl: offer.merchant?.logo ? mediaUrl(offer.merchant.logo) : undefined,
    }))
    .filter((row) => row.url);

  if (offerRows.length === 0) {
    if (product.primaryAffiliateUrl) {
      offerRows.push({
        merchant: merchantLabel(product.sourceMerchant) || 'Amazon.com',
        price: product.currentPrice,
        url: product.primaryAffiliateUrl,
        available: product.available !== false,
      });
    }
    if (product.walmartUrl) {
      offerRows.push({
        merchant: 'Walmart.com',
        price: product.walmartPrice,
        url: product.walmartUrl,
        available: true,
      });
    }
    if (product.ebayUrl) {
      offerRows.push({
        merchant: 'eBay',
        price: product.ebayPrice,
        url: product.ebayUrl,
        available: true,
      });
    }
  }
  // Cheapest available offer first.
  offerRows.sort((a, b) => {
    if (a.available !== b.available) return a.available ? -1 : 1;
    return (a.price ?? Infinity) - (b.price ?? Infinity);
  });
  // "Best deal" = lowest-priced available offer
  const bestOffer = offerRows
    .filter((r) => r.available && r.price !== undefined)
    .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))[0];

  // ---- Product JSON-LD (schema.org) for rich results ----
  const imageList = [cover, ...galleryImgs.map((g) => mediaUrl(g))].filter(Boolean) as string[];
  const plainDescription =
    product.shortDescription ||
    (product.description
      ? product.description.replace(/[#*_`>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000)
      : undefined);
  const currency = product.currency || 'USD';
  const pricedOffers = offerRows.filter((r) => r.price !== undefined);

  const offersLd =
    pricedOffers.length > 0
      ? {
          '@type': 'AggregateOffer',
          priceCurrency: currency,
          lowPrice: Math.min(...pricedOffers.map((r) => r.price as number)),
          highPrice: Math.max(...pricedOffers.map((r) => r.price as number)),
          offerCount: pricedOffers.length,
          offers: pricedOffers.slice(0, 20).map((r) => ({
            '@type': 'Offer',
            price: r.price,
            priceCurrency: currency,
            availability: r.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: r.url,
            seller: { '@type': 'Organization', name: r.merchant },
          })),
        }
      : product.currentPrice
        ? {
            '@type': 'Offer',
            price: product.currentPrice,
            priceCurrency: currency,
            availability: product.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: product.primaryAffiliateUrl || `${SITE.url}/products/${product.slug}`,
          }
        : undefined;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: imageList.length ? imageList : undefined,
    description: plainDescription,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    sku: product.skuOrModel || undefined,
    offers: offersLd,
    aggregateRating:
      ratingValue > 0 && ratingCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(Math.min(5, ratingValue).toFixed(1)),
            bestRating: 5,
            ...(ratingIsReviews ? { reviewCount: ratingCount } : { ratingCount }),
          }
        : undefined,
    ...(productReviews.length > 0
      ? {
          review: productReviews.slice(0, 20).map((r) => ({
            '@type': 'Review',
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
            author: { '@type': 'Person', name: r.authorName },
            ...(r.title ? { name: r.title } : {}),
            ...(r.body ? { reviewBody: r.body } : {}),
            ...(r.createdAt ? { datePublished: r.createdAt.slice(0, 10) } : {}),
          })),
        }
      : {}),
  };

  return (
    <article className="pb-70 product-page" data-testid={`product-${product.slug}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <div className="container">
        <Breadcrumb
          items={[
            { label: 'Products', href: '/products' },
            ...(cat ? [{ label: cat.name, href: `/categories/${cat.slug}` }] : []),
            { label: product.name },
          ]}
        />

        {/* ─── Top section: gallery left, title + buying panel right ─── */}
        <div className="row g-5">
          {/* Image column */}
          <div className="col-lg-5 col-12">
            <div className="shop-hero-img">
              {hasDiscount && (
                <span className="shop-hero-badge">
                  -{Math.round((1 - product.currentPrice! / product.originalPrice!) * 100)}%
                </span>
              )}
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt={product.name} fetchPriority="high" />
              ) : (
                <span className="shop-thumb-empty" aria-hidden />
              )}
            </div>
            {galleryImgs.length > 0 && (
              <div className="row g-2 mt-1">
                {galleryImgs.map((g, i) => {
                  const u = mediaUrl(g);
                  if (!u) return null;
                  return (
                    <div key={i} className="col-3">
                      <div className="shop-gallery-img">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u} alt={`${product.name} ${i + 1}`} loading="lazy" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right side — full-width title row, then 2-col below (description / offers panel) */}
          <div className="col-lg-7 col-12">
            {product.brand && <p className="shop-eyebrow mb-2">{product.brand}</p>}
            <h1 className="h4 mb-0">{product.name}</h1>

            {/* Rating summary under the product title */}
            {ratingValue > 0 && (
              <div className="d-flex flex-wrap align-items-center gap-2 mt-3" data-testid="product-rating-summary">
                <span className="fs-7" style={{ lineHeight: 1 }} aria-hidden>
                  <span className="shop-star-on">{'★'.repeat(Math.round(ratingValue))}</span>
                  <span className="shop-star-off">{'★'.repeat(Math.max(0, 5 - Math.round(ratingValue)))}</span>
                </span>
                <span className="fs-7 fw-semi-bold text-dark">{ratingValue.toFixed(1)}</span>
                {ratingCount > 0 && (
                  <span className="fs-7 text-600">
                    ({ratingCount} {ratingIsReviews ? (ratingCount === 1 ? 'review' : 'reviews') : 'ratings'})
                  </span>
                )}
              </div>
            )}

            {/* Social share icons under product title */}
            <div className="shop-share d-flex align-items-center gap-2 mt-3" data-testid="product-share">
              <ShareLink label="Share on Facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${SITE.url}/products/${product.slug}`)}`} tone="is-facebook">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99h-2.5V12h2.5V9.83c0-2.47 1.47-3.84 3.73-3.84 1.08 0 2.21.19 2.21.19v2.43h-1.25c-1.23 0-1.61.76-1.61 1.55V12h2.74l-.44 2.89h-2.3v6.99A10 10 0 0 0 22 12Z" /></svg>
              </ShareLink>
              <ShareLink label="Share on X" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${SITE.url}/products/${product.slug}`)}&text=${encodeURIComponent(product.name)}`} tone="is-x">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18.244 2H21.5l-7.55 8.63L22.75 22h-6.96l-5.45-7.13L4.04 22H.78l8.08-9.23L1.25 2h7.13l4.93 6.52L18.244 2Zm-1.22 18h1.93L7.06 4H5.04l11.984 16Z" /></svg>
              </ShareLink>
              <ShareLink label="Pin on Pinterest" href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(`${SITE.url}/products/${product.slug}`)}&description=${encodeURIComponent(product.name)}${cover ? `&media=${encodeURIComponent(cover)}` : ''}`} tone="is-pinterest">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 0a12 12 0 0 0-4.37 23.18c-.1-.93-.2-2.36.04-3.38.21-.91 1.4-5.79 1.4-5.79s-.36-.72-.36-1.78c0-1.67 1-2.91 2.18-2.91 1.03 0 1.53.78 1.53 1.71 0 1.04-.66 2.6-1 4.05-.29 1.21.61 2.2 1.8 2.2 2.16 0 3.83-2.28 3.83-5.58 0-2.92-2.1-4.96-5.1-4.96-3.47 0-5.51 2.6-5.51 5.29 0 1.05.4 2.17.91 2.78.1.12.11.23.08.36-.09.36-.28 1.16-.32 1.32-.05.21-.17.26-.39.16-1.45-.68-2.36-2.79-2.36-4.5 0-3.66 2.66-7.02 7.67-7.02 4.03 0 7.16 2.87 7.16 6.7 0 4-2.52 7.21-6.02 7.21-1.18 0-2.28-.61-2.66-1.34l-.72 2.75c-.26 1-.96 2.26-1.43 3.03A12 12 0 1 0 12 0z" /></svg>
              </ShareLink>
              <ShareLink label="Share by email" href={`mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(`${SITE.url}/products/${product.slug}`)}`} tone="is-email">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
              </ShareLink>
            </div>

            {/* Two columns under the title: price and buy panel in the middle, retailer offer list on the right. */}
            <div className="row g-4 mt-3">
              {/* Price + BUY */}
              <div className="col-xl-6 col-12">
                {/* Key features, else the short description. With neither, nothing renders: the empty state
                    used to print an editor instruction ("add them in Strapi") on the live page. */}
                {product.keyFeatures && product.keyFeatures.length > 0 ? (
                  <>
                    <p className="shop-eyebrow mb-0">Key Features</p>
                    <ul className="shop-bullets">
                      {product.keyFeatures.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </>
                ) : null}

                {/* Short description directly above the price: the product's own, else the description's opening. */}
                {lead && <p className="shop-lead fs-7 mb-0">{lead}</p>}

                {product.currentPrice !== undefined && (
                  <div className="d-flex flex-wrap align-items-baseline gap-3 mt-4">
                    {hasDiscount && (
                      <span className="fs-6 shop-was">
                        {formatPrice(product.originalPrice!, product.currency)}
                      </span>
                    )}
                    <span className="shop-price-lg">
                      {formatPrice(product.currentPrice, product.currency)}
                    </span>
                  </div>
                )}

                <PriceBadges history={priceHistory} current={bestOffer?.price ?? product.currentPrice} />

                {bestOffer && (
                  <p className="d-flex flex-wrap align-items-center gap-2 fs-7 mt-4 mb-0">
                    <span className="text-600">Best deal at:</span>
                    <MerchantLogo merchant={bestOffer.merchant} logoUrl={bestOffer.logoUrl} />
                    <span className="fw-medium text-dark">{bestOffer.merchant}</span>
                  </p>
                )}

                {(product.documentId || bestOffer?.url) && (
                  <PriceAlertForm
                    productDocumentId={product.documentId}
                    currency={product.currency || 'USD'}
                    currentPrice={bestOffer?.price}
                    buyHref={bestOffer?.url}
                  />
                )}

                <p className="fs-8 text-500 mt-3 mb-0">
                  <strong>Affiliate disclosure</strong>
                  <span className="shop-tip">
                    <button type="button" aria-label="Affiliate disclosure details">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                      </svg>
                    </button>
                    <span role="tooltip" className="shop-tip-bubble">
                      {SITE.name} earns a commission when you buy through links on this page, at no extra cost to you. Prices and availability subject to change.
                    </span>
                  </span>
                </p>
              </div>

              {/* Offers panel (right column) — first 9 prices, with a "view more" toggle for the
                  rest (pure-CSS checkbox toggle so this stays a server component). */}
              <div className="col-xl-6 col-12">
                {offerRows.length > 0 ? (
                  <div className="offer-list">
                    <div className="offer-rows">
                      {offerRows.slice(0, 9).map((row, i) => (
                        <OfferRow
                          key={i}
                          merchant={row.merchant}
                          logoUrl={row.logoUrl}
                          price={row.price}
                          currency={product.currency}
                          url={row.url}
                          outOfStock={!row.available}
                        />
                      ))}
                    </div>
                    {offerRows.length > 9 && (
                      <>
                        <input id="more-offers" type="checkbox" className="offer-toggle visually-hidden" />
                        <div className="offer-more">
                          {offerRows.slice(9).map((row, i) => (
                            <OfferRow
                              key={i + 9}
                              merchant={row.merchant}
                              logoUrl={row.logoUrl}
                              price={row.price}
                              currency={product.currency}
                              url={row.url}
                              outOfStock={!row.available}
                            />
                          ))}
                        </div>
                        <label htmlFor="more-offers" className="offer-show-more">
                          View {offerRows.length - 9} more {offerRows.length - 9 === 1 ? 'price' : 'prices'}
                        </label>
                        <label htmlFor="more-offers" className="offer-show-less">
                          Show fewer
                        </label>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="fs-7 text-600 mb-0">
                    No retailer prices are listed for this product right now.
                  </p>
                )}

                {product.lastPriceSyncAt && (
                  <p className="fs-8 text-600 mt-2 mb-0">
                    Last price update was:{' '}
                    {new Date(product.lastPriceSyncAt).toLocaleString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                    })}
                  </p>
                )}

                {/* Price comparison bar chart — directly under the
                    "Last price update" line for at-a-glance merchant comparison.
                    Renders whenever at least one offer has a price; with a single
                    offer this is a one-bar reference. */}
                {/* Price comparison chart hidden per request. To restore, change
                    `false` back to
                    `offerRows.filter((r) => r.price !== undefined).length >= 1`. */}
                {false && (
                  <div className="mt-4" data-testid="price-comparison">
                    <p className="shop-eyebrow mb-0">Price comparison</p>
                    <div className="mt-2">
                      <PriceComparisonChart
                        rows={offerRows.filter((r) => r.price !== undefined)}
                        currency={product?.currency}
                      />
                    </div>
                  </div>
                )}

                {/* Wishlist + share */}
                <div className="d-none align-items-center justify-content-end mt-4">
                  <button
                    type="button"
                    className="d-inline-flex align-items-center gap-2 fs-7 text-600 border-0 bg-transparent"
                    aria-label="Add to wishlist"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    Add to wishlist
                  </button>
                </div>

              </div>{/* offers col */}
            </div>{/* 2-col wrapper */}
          </div>{/* right side */}
        </div>{/* top section */}

        {/* Lower section: descriptions etc. + sidebar. The g-5 gutter stands in for the old ~5% spacer column. */}
        <div className="row g-5 mt-0" data-testid="product-detail-columns">
          <div className={SHOW_PRODUCT_SIDEBAR ? 'col-lg-8 col-12' : 'col-12'}>
            {/* Skin types tags (key features moved up next to the title/prices). */}
            {product.skinTypes && product.skinTypes.length > 0 && (
              <div className="mb-5">
                <p className="shop-eyebrow mb-0">Skin types</p>
                <ul className="list-unstyled ps-0 d-flex flex-wrap gap-2 mt-3 mb-0">
                  {product.skinTypes.map((s) => (
                    <li key={s} className="shop-pill text-capitalize">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Description / Specifications / Additional Info / Reviews as an accordion (Description open). The description
                shows in full (no "View more" clamp); a section with nothing sourced for this product is left out. */}
            <ProductInfoAccordion
              sections={[
                ...(product.description
                  ? [{ key: 'description', label: 'Description', content: <div data-testid="product-description"><ProductDescription markdown={product.description} /></div> }]
                  : []),
                ...(attributes.specifications.length
                  ? [{ key: 'specifications', label: 'Specifications', content: <AttributeTable rows={attributes.specifications} testId="product-specifications" /> }]
                  : []),
                ...(attributes.additional.length
                  ? [{ key: 'additional', label: 'Additional Info', content: <AttributeTable rows={attributes.additional} testId="product-additional-info" /> }]
                  : []),
                ...(productReviews.length > 0 || product.documentId
                  ? [
                      {
                        key: 'reviews',
                        label: productReviews.length ? `Reviews (${productReviews.length})` : 'Reviews',
                        content: (
                          <div data-testid="product-reviews">
                            {/* Rating summary beside the review cards, then the write-a-review form. */}
                            <div className="row g-4 align-items-start">
                              {productReviews.length > 0 && (
                                <div className="col-md-4 col-12">
                                  <div className="review-summary text-center p-4">
                                    <p className="score mb-0">{ratingValue.toFixed(1)}</p>
                                    <span className="shop-stars fs-5 mt-3" aria-hidden>
                                      <span className="shop-star-off">★★★★★</span>
                                      <span className="shop-star-fill shop-star-on" style={{ width: `${(Math.min(5, ratingValue) / 5) * 100}%` }}>
                                        ★★★★★
                                      </span>
                                    </span>
                                    <p className="fs-7 text-600 mt-3 mb-0">
                                      Based on {ratingCount} {ratingCount === 1 ? 'review' : 'reviews'}
                                    </p>
                                  </div>
                                </div>
                              )}
                              <div className={productReviews.length > 0 ? 'col-md-8 col-12' : 'col-12'}>
                                <ReviewList reviews={productReviews} />
                              </div>
                            </div>
                            {product.documentId && (
                              <div className="product-review-form mt-5">
                                <ReviewForm productDocumentId={product.documentId} />
                              </div>
                            )}
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]}
            />

            {product.ingredients && (
              <section className="mt-5">
                <h2 className="h4 mb-3">Ingredients</h2>
                <p className="fs-7 mb-0" style={{ lineHeight: 1.8 }}>{product.ingredients}</p>
              </section>
            )}

          </div>

          {SHOW_PRODUCT_SIDEBAR && (
            /* Right column: Featured Products (the highest-rated products not already on this page), then the
               category list. */
            <aside className="col-lg-4 col-12" aria-label="Product sidebar">
              {featuredProducts.length > 0 && (
                <div className="mb-5" data-testid="featured-products">
                  <SidebarTitle>Featured Products</SidebarTitle>
                  <div className="d-flex flex-column gap-3">
                    {featuredProducts.map((fp) => {
                      const img = mediaUrl(fp.primaryImage ?? null);
                      return (
                        <div className="article card-10 style-1 featured-product-row" key={fp.slug}>
                          <Link href={`/products/${fp.slug}`} className="card-img" tabIndex={-1} aria-hidden>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {img ? <img className="w-100 rounded-8" src={img} alt="" width={96} height={96} loading="lazy" /> : null}
                          </Link>
                          <div className="card-body">
                            <Link href={`/products/${fp.slug}`}>
                              <span className="h6 mb-1 text-truncate-2 product-side-guide-title">{fp.name}</span>
                            </Link>
                            {(fp.rating ?? 0) > 0 && (
                              <span className="d-flex align-items-center gap-1 fs-8 text-600">
                                <span className="shop-star-on" aria-hidden>★</span>
                                {fp.rating!.toFixed(1)}
                                {fp.ratingCount ? <span className="text-500">({fp.ratingCount.toLocaleString('en-US')})</span> : null}
                              </span>
                            )}
                            {fp.currentPrice !== undefined && (
                              <span className="d-block fs-7 fw-semi-bold text-dark mt-1">{formatPrice(fp.currentPrice, fp.currency)}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {topicRows.length > 0 && (
                <div className="mb-5" data-testid="browse-by-category">
                  <CategoryListWidget
                    title="Browse by category"
                    allHref="/products"
                    allLabel="All products"
                    total={productTotal}
                    rows={topicRows}
                    current={cat?.slug}
                  />
                </div>
              )}
            </aside>
          )}
        </div>

        {priceHistory.length > 0 && (
          <section className="mt-5 pt-4" data-testid="price-history">
            <h2 className="h4 mb-3">Price history</h2>
            <p className="fs-6 mb-4">
              See how the price of {product.name} has changed over time. The chart below tracks every
              price we&rsquo;ve recorded, so you can spot the typical range, catch recent drops, and judge
              whether today&rsquo;s price is a genuine deal or worth waiting out before you buy.
            </p>
            <PriceHistoryChart points={priceHistory} />
          </section>
        )}

        {related.length > 0 && (
          <aside className="mt-5 pt-4" data-testid="related-products">
            <h2 className="h4 mb-4">More in {cat?.name ?? 'this category'}</h2>
            {/* 15px between cards, and no card background: the tiles sit on the
                page rather than in boxes. thumbBg is the knob ProductCard already
                exposes for this, so nothing needs overriding with !important. */}
            <div className="row row-cols-lg-5 row-cols-sm-2 row-cols-1 g-3">
              {related.map((r) => (
                <div className="col" key={r.id}>
                  <ProductCard product={r} variant="tile" thumbBg="bg-transparent" />
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </article>
  );
}

function formatPrice(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

const MERCHANT_LABELS: Record<string, string> = {
  amazon: 'Amazon.com',
  'amazon-uk': 'Amazon.co.uk',
  'amazon-au': 'Amazon.com.au',
  ebay: 'eBay',
  walmart: 'Walmart.com',
  target: 'Target',
  sephora: 'Sephora',
  ulta: 'Ulta',
  manufacturer: 'Manufacturer',
  other: 'Visit store',
};

function merchantLabel(slug?: string | null): string {
  if (!slug) return '';
  if (MERCHANT_LABELS[slug]) return MERCHANT_LABELS[slug];
  // Real provider slugs vary (e.g. walmart-affiliate-program, amazon-via-rapidapi).
  if (slug.startsWith('amazon')) return 'Amazon.com';
  if (slug.startsWith('walmart')) return 'Walmart.com';
  if (slug.startsWith('ebay')) return 'eBay';
  if (slug.startsWith('target')) return 'Target';
  // Title-case the slug as a last resort (e.g. "best-buy" -> "Best Buy").
  return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function ShareLink({ href, tone, label, children }: { href: string; tone: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={tone}
    >
      {children}
    </a>
  );
}

// Merchant glyphs sourced from /public/brand/merchants/ (downloaded locally
// so we don't depend on third-party CDNs and avoid CORS).
function MerchantLogo({ merchant, logoUrl, size = 16 }: { merchant: string; logoUrl?: string | null; size?: number }) {
  const m = merchant.toLowerCase();
  // Prefer the merchant's saved logo from Strapi; fall back to local glyphs.
  let src: string | null = logoUrl || null;
  if (!src) {
    if (m.includes('walmart')) src = '/brand/merchants/walmart.png';
    else if (m.includes('ebay')) src = '/brand/merchants/ebay.png';
    else if (m.includes('amazon')) src = '/brand/merchants/amazon.ico';
  }
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${merchant} logo`}
      width={size}
      height={size}
      style={{ width: size, height: size, flexShrink: 0, objectFit: 'contain' }}
    />
  );
}

function OfferRow({
  merchant, price, currency, url, outOfStock, logoUrl,
}: {
  merchant: string;
  price?: number;
  currency?: string;
  url: string;
  outOfStock?: boolean;
  logoUrl?: string | null;
}) {
  return (
    <div className="offer-row">
      <span className="offer-merchant">
        <MerchantLogo merchant={merchant} logoUrl={logoUrl} size={28} />
        {merchant}
      </span>
      <span className="text-end">
        {price !== undefined && (
          <span className="d-block fs-7 fw-semi-bold text-dark">{formatPrice(price, currency)}</span>
        )}
        {outOfStock && (
          <span className="d-block fs-8 shop-discount">out of stock</span>
        )}
      </span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="offer-cta"
      >
        See it
      </a>
    </div>
  );
}

/* Tiny markdown renderer for the product description format we generate
   (### headings + "- " bullets + paragraphs separated by blank lines).
   No external dependency; format is constrained so a hand-rolled parser
   is shorter than wiring up `marked` and safer than dangerouslySetInnerHTML. */
function ProductDescription({ markdown }: { markdown: string }) {
  // Inline emphasis: **bold** and *italic*. Returns a React fragment.
  function inline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let key = 0;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      const tok = m[0];
      if (tok.startsWith('**')) {
        parts.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
      } else {
        parts.push(<em key={key++}>{tok.slice(1, -1)}</em>);
      }
      last = m.index + tok.length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  }

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i += 1; continue; }
    if (line.startsWith('### ')) {
      blocks.push(
        <h4 key={key++}>
          {inline(line.slice(4).trim())}
        </h4>,
      );
      i += 1;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push(
        <h2 key={key++}>
          {inline(line.slice(3).trim())}
        </h2>,
      );
      i += 1;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ul key={key++}>
          {items.map((it, idx) => <li key={idx}>{inline(it)}</li>)}
        </ul>,
      );
      continue;
    }
    // Paragraph: collect consecutive non-blank, non-special lines.
    const para: string[] = [];
    while (
      i < lines.length
      && lines[i].trim()
      && !lines[i].startsWith('### ')
      && !lines[i].startsWith('## ')
      && !/^\s*[-*]\s+/.test(lines[i])
    ) {
      para.push(lines[i]);
      i += 1;
    }
    blocks.push(<p key={key++}>{inline(para.join(' '))}</p>);
  }
  /* Spacing and heading sizes for these blocks live in .shop-desc (app/magzin-shop.css). */
  return <div className="shop-desc">{blocks}</div>;
}

/* Price comparison bar chart — pure SVG-free CSS implementation. Each row
   shows merchant logo + a bar whose width is proportional to its price
   relative to the most expensive offer. The cheapest available row gets
   a "Best deal" badge. */
function PriceComparisonChart({
  rows,
  currency,
}: {
  rows: { merchant: string; price?: number; available: boolean }[];
  currency?: string;
}) {
  const prices = rows.map((r) => r.price as number);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...rows.filter((r) => r.available).map((r) => r.price as number));
  return (
    <div
      className="price-compare"
      data-testid="price-comparison-chart"
    >
      <ul className="list-unstyled ps-0 m-0 d-flex flex-column gap-3">
        {rows.map((r, i) => {
          const pct = maxPrice > 0 ? ((r.price as number) / maxPrice) * 100 : 0;
          const isBest = r.available && r.price === minPrice;
          return (
            <li key={i} className="price-compare-row">
              <span className="d-flex align-items-center gap-2 fs-7 fw-medium text-700" style={{ minWidth: 0 }}>
                <MerchantLogo merchant={r.merchant} />
                <span className="text-truncate-1">{r.merchant.replace(/\.com$/, '')}</span>
              </span>
              <span className="price-compare-track">
                <span
                  className={`price-compare-bar ${isBest ? 'is-best' : ''}`}
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="d-flex align-items-center justify-content-end gap-2 fs-7 text-end">
                <span className="fw-semi-bold text-dark">{formatPrice(r.price as number, currency)}</span>
                {isBest && (
                  <span className="shop-pill text-uppercase">
                    best
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* Label/value table for the Specifications and Additional Info tabs. */
function AttributeTable({ rows, testId }: { rows: [string, string][]; testId: string }) {
  return (
    <table className="shop-spec-table" data-testid={testId}>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
