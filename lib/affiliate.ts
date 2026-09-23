/**
 * Render-time switch-off for affiliate links in post content (see AFFILIATE_LINKS_ENABLED in lib/site.ts).
 *
 * The imported WordPress posts still carry Amazon Associates links (tags unitradeco-20 and nxtvitality-20), Amazon
 * product images and Content Egg price boxes. With affiliates off, this runs over every post body before it is
 * rendered; the content stored in Strapi is not changed.
 *
 * - "Buy now" style buttons that point at a retailer or network are removed outright (their text means nothing
 *   without the link), as are links whose text is just their own tagged URL;
 * - every other link to Amazon or an affiliate network is unwrapped: its text stays, the link goes;
 * - images hosted by Amazon are removed (they may only be shown by an active Associate);
 * - Content Egg prices, stock lines and "Amazon price updated" disclaimers are removed;
 * - the Content Egg review markup (JSON-LD Product blocks with an Amazon ASIN or image and a self-assigned score)
 *   is removed.
 * Idempotent.
 */
const AFFILIATE_HREF = new RegExp(
  '^(?:https?:)?//(?:[a-z0-9-]+\\.)*(?:' +
    [
      'amazon\\.[a-z.]+',
      'amzn\\.(?:to|eu|asia)',
      'geni\\.us',
      'goto\\.walmart\\.com',
      'linksynergy\\.com',
      'shareasale\\.com',
      'awin1\\.com',
      'anrdoezrs\\.net',
      'dpbolvw\\.net',
      'jdoqocy\\.com',
      'kqzyfj\\.com',
      'tkqlhce\\.com',
      'skimresources\\.com',
      'viglink\\.com',
      'pxf\\.io',
      'sjv\\.io',
      'takeads\\.com',
    ].join('|') +
    ')(?:[/:?#]|$)',
  'i',
);
/* eBay links are only affiliate links when they carry a Partner Network campaign. */
const EBAY_AFFILIATE = /^(?:https?:)?\/\/(?:[a-z0-9-]+\.)*ebay\.[a-z.]+\/.*[?&](?:campid|mkcid|mkevt)=/i;
const BUY_BUTTON = /^\s*(?:buy(?: it)? now|buy on amazon|shop now|check (?:the )?(?:latest )?price|view (?:on amazon|deal|price)|see (?:on amazon|price)|get it on amazon)\s*$/i;
const AMAZON_IMAGE = /<(?:img|source)\b[^>]*\b(?:src|srcset)=["'][^"']*(?:media-amazon\.com|images-amazon\.com|ssl-images-amazon\.com)[^"']*["'][^>]*>/gi;

const isAffiliate = (href: string) => AFFILIATE_HREF.test(href) || EBAY_AFFILIATE.test(href);
const textOf = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

export function stripAffiliateLinks(html: string): string {
  if (!html) return html;
  return html
    .replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (whole, attrs: string, inner: string) => {
      const href = attrs.match(/\bhref=["']([^"']*)["']/i)?.[1]?.replace(/&amp;/g, '&') ?? '';
      if (!href || !isAffiliate(href)) return whole;
      /* A button, or a link whose text is just its own (tagged) URL: drop it; otherwise keep the text. */
      const text = textOf(inner);
      return BUY_BUTTON.test(text) || /^(?:https?:)?\/\//i.test(text) ? '' : inner;
    })
    .replace(AMAZON_IMAGE, '')
    .replace(/<div class="[^"]*\bcegg-price-disclaimer\b[^"]*">\s*<small>[\s\S]*?<\/small>\s*<\/div>/gi, '')
    .replace(/<(div|span|del|s)\s+class="[^"]*\bcegg-(?:old-)?price\b[^"]*">(?:\s|<br\s*\/?>|&nbsp;)*[^<]*<\/\1>/gi, '')
    .replace(/<div class="[^"]*\bcegg-stock-status\b[^"]*">[\s\S]*?<\/div>/gi, '')
    .replace(/Amazon price updated:[^<]*/gi, '')
    .replace(/<script\b[^>]*application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi, (block) =>
      /"asin"|amazon\.com|media-amazon/i.test(block) ? '' : block,
    );
}

/**
 * A retailer link with the affiliate wrapper taken off, or undefined when it is nothing but an affiliate link.
 * Some offers store the affiliate redirect as their product URL: Walmart's goto.walmart.com carries the real
 * product page in its `u` parameter, and eBay Partner Network links are the product page plus campaign params.
 */
export function plainRetailerUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (/(^|\.)goto\.walmart\.com$/i.test(u.hostname)) return u.searchParams.get('u') || undefined;
    if (/(^|\.)ebay\.[a-z.]+$/i.test(u.hostname)) {
      for (const p of ['campid', 'mkcid', 'mkevt', 'mkrid', 'toolid', 'customid', 'siteid']) u.searchParams.delete(p);
      return u.toString();
    }
  } catch {
    return url;
  }
  return isAffiliate(url) ? undefined : url;
}
