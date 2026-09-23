import { AFFILIATE_PROGRAMS, AFFILIATE_RETAILERS, GENIUSLINK_VERIFIED_NETWORKS, listOf } from '@/lib/affiliate-programs';

/**
 * The affiliate programmes and the retailers currently monetised through each, for the legal pages. Everything comes
 * from lib/affiliate-programs.ts (programme config + the committed link maps), so the pages update themselves when a
 * programme or retailer is added and the site is redeployed.
 */
export default function AffiliatePrograms() {
  return (
    <ul className="legal-affiliate-programs" data-testid="affiliate-programs">
      {AFFILIATE_PROGRAMS.map((p) => {
        const retailers = AFFILIATE_RETAILERS[p.key];
        const verified = p.key === 'geniuslink' ? retailers.filter((r) => GENIUSLINK_VERIFIED_NETWORKS[r]) : [];
        return (
          <li key={p.key}>
            <strong>
              <a href={p.url} target="_blank" rel="noopener noreferrer">
                {p.name}
              </a>
            </strong>
            {p.operator !== p.name ? ` (operated by ${p.operator})` : ''} — {p.role}.
            {retailers.length > 0 && <> Links to {listOf(retailers)} currently go through {p.name}.</>}
            {verified.length > 0 && (
              <> Programmes behind these links include {listOf(verified.map((r) => GENIUSLINK_VERIFIED_NETWORKS[r]))}.</>
            )}{' '}
            <a href={p.privacyUrl} target="_blank" rel="noopener noreferrer">
              {p.name} privacy policy
            </a>
            .
          </li>
        );
      })}
    </ul>
  );
}
