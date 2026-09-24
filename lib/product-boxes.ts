import type { CommerceProduct } from '@/lib/strapi';
import { mediaUrl } from '@/lib/strapi';
import { AFFILIATE_LINKS_ENABLED } from '@/lib/site';
import { plainRetailerUrl } from '@/lib/affiliate';
import { SPONSORED_REL, resolveOutbound } from '@/lib/links';

/**
 * Inline product boxes for ::product:<slug>:: markers in a post body.
 *
 * The AI writer (strapi-cms-git/backend/ai-writer-cli, generate-bestlooking-post.js) places a marker on its own
 * paragraph right after the text that discusses a catalogue product. Here each marker becomes a box: photo,
 * brand, name, up to two key features from the product's own specs, and "Check price at X" buttons for the
 * cheapest in-stock offers, sent through the site's affiliate resolver like every other outbound link.
 *
 * No star rating and no price in the box: a rating inside an article reads as the site's own verdict, and a
 * price frozen into a page goes stale. The product page carries both.
 *
 * A marker whose product is unknown, or no longer listed on this storefront, is removed rather than shown as a
 * broken box.
 */
const MARKER = /(?:<p\b[^>]*>\s*)?::product:([a-z0-9-]+)::(?:\s*<\/p>)?/gi;
const EXCLUDED_MERCHANTS = /^(amazon|poshmark|mercari)/i;

export function productSlugsIn(html: string): string[] {
  return [...html.matchAll(MARKER)].map((m) => m[1].toLowerCase());
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function buyLinks(product: CommerceProduct, limit = 2) {
  const seen = new Set<string>();
  return (product.offers ?? [])
    .filter((o) => o.availability !== 'out_of_stock' && o.merchant?.name && !EXCLUDED_MERCHANTS.test(o.merchant?.slug ?? o.merchant?.name ?? ''))
    .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))
    .map((o) => {
      const plain = plainRetailerUrl(o.productUrl);
      if (!plain) return null;
      const resolved = AFFILIATE_LINKS_ENABLED ? resolveOutbound(plain, o.affiliateUrl && o.affiliateUrl !== o.productUrl ? o.affiliateUrl : null) : { url: plain, network: 'direct' as const };
      return { href: resolved.url, merchant: o.merchant!.name as string };
    })
    .filter((l): l is { href: string; merchant: string } => Boolean(l && !seen.has(l.merchant) && seen.add(l.merchant)))
    .slice(0, limit);
}

function boxHtml(p: CommerceProduct): string {
  const href = `/products/${p.slug}`;
  const img = mediaUrl(p.primaryImage ?? null);
  const features = (Array.isArray(p.specs?.keyFeatures) ? p.specs!.keyFeatures : []).filter((f) => typeof f === 'string' && f.trim()).slice(0, 2);
  const links = buyLinks(p);
  return [
    `<aside class="post-product-box" data-product="${esc(p.slug)}">`,
    `<a class="ppb-media" href="${href}">${img ? `<img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy" />` : ''}</a>`,
    '<div class="ppb-body">',
    p.brand ? `<p class="ppb-brand">${esc(p.brand)}</p>` : '',
    `<p class="ppb-name"><a href="${href}">${esc(p.name)}</a></p>`,
    features.length ? `<ul class="ppb-features">${features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : '',
    '<div class="ppb-actions">',
    ...links.map((l) => `<a class="ppb-buy" href="${esc(l.href)}" target="_blank" rel="${SPONSORED_REL}">Check price at ${esc(l.merchant)}</a>`),
    `<a class="ppb-more" href="${href}">Product details</a>`,
    '</div></div></aside>',
  ].join('');
}

/** Replace every marker with its product box (or nothing, for a product this site does not list). */
export function renderProductBoxes(html: string, products: CommerceProduct[]): string {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  return html.replace(MARKER, (_m, slug: string) => {
    const p = bySlug.get(slug.toLowerCase());
    return p ? boxHtml(p) : '';
  });
}
