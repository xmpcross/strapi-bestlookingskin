/**
 * Render-time switch-off for affiliate links in post content (see AFFILIATE_LINKS_ENABLED in lib/site.ts).
 *
 * The imported WordPress posts still carry Amazon Associates links (tags unitradeco-20 and nxtvitality-20), Amazon
 * product images and Content Egg price boxes. With affiliates off, this runs over every post body before it is
 * rendered; the content stored in Strapi is not changed.
 *
 * - "Buy now" style buttons that point at a retailer or network are removed outright (their text means nothing
 *   without the link);
 * - every other link to Amazon or an affiliate network is unwrapped: its text stays, the link goes;
 * - images hosted by Amazon are removed (they may only be shown by an active Associate);
 * - Content Egg prices, stock lines and "Amazon price updated" disclaimers are removed.
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
      return BUY_BUTTON.test(textOf(inner)) ? '' : inner;
    })
    .replace(AMAZON_IMAGE, '')
    .replace(/<div class="[^"]*\bcegg-price-disclaimer\b[^"]*">\s*<small>[\s\S]*?<\/small>\s*<\/div>/gi, '')
    .replace(/<(div|span|del|s)\s+class="[^"]*\bcegg-(?:old-)?price\b[^"]*">(?:\s|<br\s*\/?>|&nbsp;)*[^<]*<\/\1>/gi, '')
    .replace(/<div class="[^"]*\bcegg-stock-status\b[^"]*">[\s\S]*?<\/div>/gi, '')
    .replace(/Amazon price updated:[^<]*/gi, '');
}
