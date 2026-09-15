'use client';

import { useState } from 'react';

const LIMIT = 12;

/**
 * Right-hand column of the product page (Xtra-theme style): a "Specifications"
 * label/value table and an optional "Pros and cons" list with green plus-circle
 * icons. The spec table is clamped to the first {LIMIT} rows with a
 * "View more" / "View less" toggle when longer. Spec values may carry <wbr>
 * word-break hints.
 */
export default function ProductSpecs({
  specs,
  pros = [],
}: {
  specs: Array<[string, string]>;
  pros?: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  if (!specs.length && !pros.length) return null;

  const hasMore = specs.length > LIMIT;
  const shown = expanded || !hasMore ? specs : specs.slice(0, LIMIT);

  return (
    <div data-testid="product-specs">
      {specs.length > 0 && (
        <div>
          <h2 className="h5 mb-3">Specifications</h2>
          <table className="shop-spec-table">
            <tbody>
              {shown.map(([label, value]) => (
                <tr key={label}>
                  <th scope="row">
                    {label}:
                  </th>
                  <td dangerouslySetInnerHTML={{ __html: value }} />
                </tr>
              ))}
            </tbody>
          </table>
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              className="shop-more-btn mt-3"
            >
              {expanded ? 'View less' : `View more (${specs.length - LIMIT})`}
              <span aria-hidden className={`caret ${expanded ? 'is-flipped' : ''}`}>▾</span>
            </button>
          )}
        </div>
      )}

      {pros.length > 0 && (
        <div className={specs.length > 0 ? 'mt-5' : ''}>
          <h3 className="h5 mb-3">Pros and cons</h3>
          <ul className="shop-checks list-unstyled ps-0 m-0">
            {pros.map((p) => (
              <li key={p}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="shop-check-ok">
                  <circle cx="12" cy="12" r="11" fill="currentColor" />
                  <path d="M12 7v10M7 12h10" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
