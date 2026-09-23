import { SITE } from '@/lib/site';

/**
 * The business behind the site, as shown on every legal page. One component so the four pages never disagree; the
 * values come from SITE.business (lib/site.ts), which the footer, /about, /contact and structured data also use.
 */
export default function LegalBusinessDetails() {
  const b = SITE.business;
  return (
    <div className="legal-business-details" data-testid="legal-business-details">
      <p className="mb-3">
        <strong>{b.legalName}</strong>
        <br />
        Trading Name: {b.tradingName}
        <br />
        {b.residency}
        <br />
        ABN {b.abnDisplay}.
      </p>
      <p className="mb-3">
        Mailing address:
        {b.postalAddress.map((line, i, all) => (
          <span key={line}>
            <br />
            {line}
            {i < all.length - 1 ? ',' : ''}
          </span>
        ))}
      </p>
      <p className="mb-0">
        Email: <a href={`mailto:${b.email}`}>{b.email}</a>
      </p>
    </div>
  );
}
