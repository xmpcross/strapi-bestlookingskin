import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/*
 * Outbound retailer links: which monetised URL a plain retailer page goes out on.
 *
 *   1. A link that already carries network tracking (Geniuslink, Impact, Awin, eBay EPN…) is used as it is.
 *      Re-wrapping it would break attribution.
 *   2. Geniuslink, for the merchants whose programmes are connected in the Geniuslink account (Walmart, eBay,
 *      Target, Best Buy, Newegg): data/geniuslink-links.json, built by scripts/fetch-geniuslink-links.mjs.
 *   3. Takeads, for every other retailer ("non-partner"): data/takeads-links.json, built by
 *      scripts/fetch-takeads-links.mjs. Only when TAKEADS_ENABLED=true.
 *   4. The plain retailer URL. Unmonetised beats broken.
 *
 * Both maps are lookups keyed by the plain retailer URL, never a network call, so rendering a page does not wait
 * on a third party. They are re-read when the file changes, so a refreshed map is live without a rebuild.
 * Amazon is never sent to either: this site has no active Associates account (see CLAUDE.md).
 */

export type LinkNetwork = 'network' | 'geniuslink' | 'takeads' | 'direct';

/**
 * rel for every retailer / affiliate link (Google: paid links carry rel="sponsored"). The one place this value is
 * set: offers, buy buttons, "Available from" links, brand stores that go out on an affiliate link, and retailer links
 * inside post bodies all use it. Social share and citation links do not.
 */
export const SPONSORED_REL = 'sponsored nofollow noopener';

/* Retailers: links to these are commercial whether or not they are monetised yet, so they carry SPONSORED_REL. */
const RETAILER_HOST = /(^|\.)(walmart|ebay|target|sephora|ulta|mercari|poshmark|iherb|amazon|kohls|cvs|walgreens|dermstore|nordstrom|macys|samsclub|bestbuy|newegg|costco|skinstore|yesstyle|stylevana|lookfantastic|cultbeauty|boots|superdrug|sokoglam|olive(young|youngglobal)|revolve|jcpenney|zulily|vitacost|luckyvitamin|swansonvitamins)\.[a-z.]+$/i;
export const isRetailerUrl = (url: string) => {
  try {
    return RETAILER_HOST.test(new URL(url).hostname);
  } catch {
    return false;
  }
};

/** rel for an outbound link: sponsored for retailers and anything that went out on an affiliate link. */
export const outboundRel = (url: string, network: LinkNetwork = 'direct') =>
  network !== 'direct' || isRetailerUrl(url) ? SPONSORED_REL : 'noopener noreferrer';

type LinkMap = { links: Record<string, string>; checkedAt?: string | null };
const cache: Record<string, { mtime: number; map: LinkMap }> = {};

function loadMap(file: string): Record<string, string> {
  const p = join(process.cwd(), 'data', file);
  try {
    if (!existsSync(p)) return {};
    const mtime = statSync(p).mtimeMs;
    if (cache[file]?.mtime !== mtime) cache[file] = { mtime, map: JSON.parse(readFileSync(p, 'utf8')) as LinkMap };
    return cache[file].map.links ?? {};
  } catch {
    return {};
  }
}

const ALREADY_TRACKED = [
  'geni.us',
  'tatrck.com',
  'goto.walmart.com',
  'goto.target.com',
  'linksynergy.com',
  'prf.hn',
  'imp.i',
  'ebay.com/ulk',
  'awin1.com',
  'tradedoubler.com',
  'admitad.com',
  'go.redirectingat.com',
  'go.skimresources.com',
];

const isAmazon = (url: string) => {
  try {
    return /(^|\.)amazon\.[a-z.]+$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
};

/** The monetised URL for a plain retailer URL (and the tracking link already stored on the offer, if any). */
export function resolveOutbound(destination: string, affiliateUrl?: string | null): { url: string; network: LinkNetwork } {
  if (affiliateUrl && /^https?:\/\//.test(affiliateUrl) && affiliateUrl !== destination) {
    return { url: affiliateUrl, network: 'network' };
  }
  if (!destination || !/^https?:\/\//.test(destination) || isAmazon(destination)) return { url: destination, network: 'direct' };
  if (ALREADY_TRACKED.some((h) => destination.includes(h))) return { url: destination, network: 'network' };

  const genius = loadMap('geniuslink-links.json')[destination];
  if (genius && genius !== destination) return { url: genius, network: 'geniuslink' };

  if (process.env.TAKEADS_ENABLED === 'true') {
    const takeads = loadMap('takeads-links.json')[destination];
    if (takeads && takeads !== destination) return { url: takeads, network: 'takeads' };
  }
  return { url: destination, network: 'direct' };
}

/* Hosts never monetised in post content: our own pages, and the medical and reference sources we cite. */
const NEVER_MONETISE = /(^|\.)(bestlooking\.skin|cms\.fxnstudio\.com|aad\.org|nhs\.uk|nih\.gov|ncbi\.nlm\.nih\.gov|pubmed\.ncbi\.nlm\.nih\.gov|clevelandclinic\.org|mayoclinic\.org|fda\.gov|who\.int|wikipedia\.org|doi\.org|sciencedirect\.com|springer\.com|wiley\.com|jamanetwork\.com|nature\.com)$/i;

/**
 * Rewrite outbound links in post / pillar HTML through resolveOutbound: a retailer link found in the Geniuslink
 * or Takeads map goes out on its monetised URL with rel="sponsored nofollow noopener". Citations and internal links
 * are left alone. Runs after stripAffiliateLinks, so the legacy Amazon markup is already gone. Idempotent.
 */
export function monetizeContentLinks(html: string | undefined): string | undefined {
  if (!html) return html;
  return html.replace(/<a\b([^>]*?)\bhref=(["'])(https?:\/\/[^"']+)\2([^>]*)>/gi, (tag, before: string, q: string, href: string, after: string) => {
    let host = '';
    try {
      host = new URL(href).hostname.replace(/^www\./, '');
    } catch {
      return tag;
    }
    if (NEVER_MONETISE.test(host)) return tag;
    const { url, network } = resolveOutbound(href);
    /* Unmonetised non-retailer links (a brand's site, a blog) are left exactly as written. */
    if (network === 'direct' && !isRetailerUrl(href)) return tag;
    const attrs = `${before}${after}`.replace(/\s(rel|target)=(["'])[^"']*\2/gi, '');
    return `<a${attrs} href=${q}${url}${q} target="_blank" rel="${SPONSORED_REL}">`;
  });
}
