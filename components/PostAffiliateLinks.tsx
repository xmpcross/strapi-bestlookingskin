import Link from 'next/link';
import type { CommerceProduct } from '@/lib/strapi';
import { AFFILIATE_LINKS_ENABLED } from '@/lib/site';
import { plainRetailerUrl } from '@/lib/affiliate';
import { SPONSORED_REL, resolveOutbound } from '@/lib/links';

/**
 * End-of-article "Affiliate links" block (text links to retailers) and the post's tags.
 *
 * Links come from the catalogue offers of the products shown in the article. The block is headed "Affiliate
 * links" and says we may earn a commission, so in `affiliate` mode only offers that carry an affiliate URL are
 * listed: an unwrapped retailer link earns nothing and would make that sentence untrue. `retailer` mode lists
 * the plain retailer links under a heading that says so.
 *
 * Every offer goes through the site's affiliate resolver (lib/links.ts: Geniuslink, then Takeads), so a listed link is
 * the monetised one. Amazon offers are never listed (no active Associates account; see CLAUDE.md), nor the resale
 * marketplaces Poshmark and Mercari, whose listings are second-hand goods rather than the product discussed.
 *
 * Tags are the post's SEO keywords (Tier A posts carry them; Tier B posts have none, so no row renders), each
 * linking to a site search.
 */
const EXCLUDED_MERCHANTS = /^(amazon|poshmark|mercari)/i;

export type AffiliateLinkMode = 'affiliate' | 'retailer';

export function affiliateLinksFor(products: CommerceProduct[], mode: AffiliateLinkMode, limit = 4) {
  const links: { href: string; label: string }[] = [];
  /* Affiliates off (lib/site.ts): no affiliate list, and retailer links use the plain product page. */
  if (!AFFILIATE_LINKS_ENABLED && mode === 'affiliate') return links;
  const seen = new Set<string>();
  for (const product of products) {
    const offers = (product.offers ?? [])
      .filter((o) => o.availability !== 'out_of_stock' && !EXCLUDED_MERCHANTS.test(o.merchant?.slug ?? ''))
      .map((o) => {
        const plain = plainRetailerUrl(o.productUrl);
        const resolved = AFFILIATE_LINKS_ENABLED && plain ? resolveOutbound(plain, o.affiliateUrl && o.affiliateUrl !== o.productUrl ? o.affiliateUrl : null) : null;
        const monetised = resolved && resolved.network !== 'direct' ? resolved.url : undefined;
        return { offer: o, href: mode === 'affiliate' ? monetised : monetised || plain };
      })
      .filter((x): x is { offer: typeof x.offer; href: string } => Boolean(x.href && x.offer.merchant?.name))
      .sort((a, b) => (a.offer.price ?? Infinity) - (b.offer.price ?? Infinity));
    for (const { offer, href } of offers.slice(0, 2)) {
      const key = `${product.slug}|${offer.merchant!.slug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({ href, label: `${product.name} at ${offer.merchant!.name}` });
    }
  }
  return links.slice(0, limit);
}

export function tagsFromKeywords(keywords?: string, limit = 8) {
  const seen = new Set<string>();
  return (keywords ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 1 && !seen.has(k.toLowerCase()) && seen.add(k.toLowerCase()))
    .slice(0, limit);
}

export default function PostAffiliateLinks({
  links,
  mode,
  tags,
}: {
  links: { href: string; label: string }[];
  mode: AffiliateLinkMode;
  tags: string[];
}) {
  if (!links.length && !tags.length) return null;
  return (
    <section className="post-affiliate mt-5" aria-labelledby={links.length ? 'post-affiliate-title' : undefined} data-testid="post-affiliate-links">
      {links.length > 0 && (
        <div className="post-affiliate-links">
          <h3 id="post-affiliate-title" className="post-affiliate-title">
            {mode === 'affiliate' ? 'Affiliate links' : 'Where to buy'}
          </h3>
          <p className="post-affiliate-note">
            {mode === 'affiliate' ? (
              <>
                Some of the links below are affiliate links. If you buy through one we may earn a commission, at no extra cost to you. It never changes what we
                recommend — see our <Link href="/legal/disclosure">affiliate disclosure</Link>.
              </>
            ) : (
              <>These links go to the retailers’ own product pages. Prices and stock are set by each retailer.</>
            )}
          </p>
          <ul className="list-unstyled m-0 p-0">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel={SPONSORED_REL}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {tags.length > 0 && (
        <div className="post-tags">
          <span className="post-tags-label">Tags:</span>
          <ul className="list-unstyled m-0 p-0">
            {tags.map((t) => (
              <li key={t}>
                <Link href={`/search?q=${encodeURIComponent(t)}`} className="post-tag">
                  {t}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
