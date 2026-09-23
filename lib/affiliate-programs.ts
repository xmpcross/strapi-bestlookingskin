import geniuslink from '@/data/geniuslink-links.json';
import takeads from '@/data/takeads-links.json';

/*
 * The affiliate programmes and advertising the site uses, for the legal pages (disclosure, privacy, cookies).
 *
 * One list, so the legal pages cannot drift from what the site does: adding a programme here updates every page that
 * mentions it. The retailers are not typed in either -- they are read from the committed link maps
 * (data/geniuslink-links.json, data/takeads-links.json, see lib/links.ts), so a retailer appears on the disclosure as
 * soon as its links are monetised and the site is redeployed.
 */

export type AffiliateProgram = {
  key: 'geniuslink' | 'takeads';
  name: string;
  operator: string;
  url: string;
  privacyUrl: string;
  /** What the service does, in one clause. */
  role: string;
};

export const AFFILIATE_PROGRAMS: AffiliateProgram[] = [
  {
    key: 'geniuslink',
    name: 'Geniuslink',
    operator: 'Geniuslink',
    url: 'https://geniuslink.com',
    privacyUrl: 'https://geniuslink.com/privacy-policy/',
    role: 'a link-management service that routes our links to retailer affiliate programmes connected to our account',
  },
  {
    key: 'takeads',
    name: 'Takeads',
    operator: 'Mitgo',
    url: 'https://takeads.com',
    privacyUrl: 'https://takeads.com/privacy-policy',
    role: 'an affiliate network that monetises links to the retailers in its catalogue',
  },
];

/** Advertising (not affiliate) partners, for the same pages. */
export const ADVERTISING_PARTNERS = [
  { name: 'Google AdSense', operator: 'Google', privacyUrl: 'https://policies.google.com/technologies/ads' },
];

/* Retailer names for the hosts in the link maps; unknown hosts fall back to their domain. */
const RETAILER_NAMES: Record<string, string> = {
  'walmart.com': 'Walmart',
  'ebay.com': 'eBay',
  'target.com': 'Target',
  'bestbuy.com': 'Best Buy',
  'newegg.com': 'Newegg',
  'sephora.com': 'Sephora',
  'iherb.com': 'iHerb',
  'au.iherb.com': 'iHerb',
  'kohls.com': "Kohl's",
  'cvs.com': 'CVS',
  'walgreens.com': 'Walgreens',
  'ulta.com': 'Ulta Beauty',
  'dermstore.com': 'Dermstore',
  'nordstrom.com': 'Nordstrom',
  'macys.com': "Macy's",
  'samsclub.com': "Sam's Club",
  'skinstore.com': 'SkinStore',
  'costco.com': 'Costco',
  'lookfantastic.com': 'LOOKFANTASTIC',
  'yesstyle.com': 'YesStyle',
  'stylevana.com': 'Stylevana',
  'apple.com': 'Apple',
  'biossance.com': 'Biossance',
  'dermalogica.com': 'Dermalogica',
  'drunkelephant.com': 'Drunk Elephant',
  'elfcosmetics.com': 'e.l.f. Cosmetics',
  'esteelauder.com': 'Estée Lauder',
  'fresh.com': 'Fresh',
  'pixibeauty.com': 'Pixi Beauty',
  'rocskincare.com': 'RoC Skincare',
  'versedskin.com': 'Versed',
};

/** Programmes whose affiliate relationship behind Geniuslink has been confirmed by following a live link. */
export const GENIUSLINK_VERIFIED_NETWORKS: Record<string, string> = {
  Walmart: 'Walmart Affiliate Program (Impact)',
  eBay: 'eBay Partner Network',
};

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
};
const nameFor = (host: string) => RETAILER_NAMES[host] ?? host;

function retailers(map: { links?: Record<string, string> }): string[] {
  const names = new Set<string>();
  for (const [from, to] of Object.entries(map.links ?? {})) if (to && to !== from) names.add(nameFor(hostOf(from)));
  names.delete('');
  return [...names].sort((a, b) => a.localeCompare(b));
}

/** Retailers whose links currently go out through each programme (from the committed link maps). */
export const AFFILIATE_RETAILERS: Record<AffiliateProgram['key'], string[]> = {
  geniuslink: retailers(geniuslink as { links?: Record<string, string> }),
  takeads: retailers(takeads as { links?: Record<string, string> }),
};

/** "A, B and C" */
export const listOf = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
