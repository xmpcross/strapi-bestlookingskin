import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Reader for the iHerb flash-deals cache.
 *
 * The file is written by nxt.discount's scripts/fetch-iherb-flash-deals.mjs,
 * which writes a copy into each site that renders it. This site does not fetch
 * anything itself -- one scrape feeds both, and the ZenRows call is the
 * expensive part.
 *
 * PRICES ARE AUD (the source is au.iherb.com). Render them as A$: this site's
 * catalogue prices default to USD, so an unlabelled "$" here would quote a
 * price that is simply wrong.
 */
export type IherbDeal = {
  id: string;
  title: string;
  brand: string | null;
  price: number;
  wasPrice: number;
  percentOff: number;
  currency: 'AUD';
  image: string | null;
  url: string;
  rating: number | null;
  reviewCount: number | null;
  merchant: 'iHerb';
  category: 'Supplements' | 'Beauty';
};

type Cache = { fetchedAt: string; currency: 'AUD'; source: string; deals: IherbDeal[] };

const CACHE = join(process.cwd(), 'data', 'iherb-flash-deals.json');

/**
 * Beauty deals only by default.
 *
 * The scrape also carries supplements, which belong on nxt.discount but not
 * beside a skincare article -- a protein powder under "Today's beauty deals"
 * reads as an untargeted ad. `category` opts into the others deliberately.
 */
export function getIherbDeals(
  { category = 'Beauty', limit = 4 }: { category?: IherbDeal['category'] | 'All'; limit?: number } = {},
): { fetchedAt: string; deals: IherbDeal[] } | null {
  /* A missing or unreadable cache hides the widget; it must never fail a build.
     This site's deploy cannot depend on a scraper in another project's tree. */
  if (!existsSync(CACHE)) return null;
  try {
    const parsed = JSON.parse(readFileSync(CACHE, 'utf8')) as Cache;
    if (!Array.isArray(parsed?.deals)) return null;
    const deals = parsed.deals
      .filter((d) => (category === 'All' ? true : d.category === category))
      .filter((d) => d.url && d.price > 0 && d.wasPrice > d.price)
      .slice(0, limit);
    return deals.length ? { fetchedAt: parsed.fetchedAt, deals } : null;
  } catch {
    return null;
  }
}
