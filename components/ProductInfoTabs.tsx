'use client';

import { useId, useState } from 'react';

export type ProductInfoTab = { key: string; label: string; content: React.ReactNode };

/**
 * Product page tabs (Description / Specifications / Additional Info). Every panel is rendered into the HTML, so
 * crawlers and readers without JavaScript still get all of it; the inactive ones are only hidden. Arrow keys move
 * between tabs, as the WAI-ARIA tabs pattern expects.
 */
export default function ProductInfoTabs({ tabs }: { tabs: ProductInfoTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const id = useId();
  if (!tabs.length) return null;

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = tabs[(index + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    setActive(next.key);
    document.getElementById(`${id}-tab-${next.key}`)?.focus();
  };

  return (
    <div className="product-info-tabs" data-testid="product-info-tabs">
      <div className="shop-tabs" role="tablist" aria-label="Product information">
        {tabs.map((t, i) => (
          <button
            key={t.key}
            id={`${id}-tab-${t.key}`}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            aria-controls={`${id}-panel-${t.key}`}
            tabIndex={active === t.key ? 0 : -1}
            onClick={() => setActive(t.key)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div
          key={t.key}
          id={`${id}-panel-${t.key}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${t.key}`}
          hidden={active !== t.key}
          className="product-info-panel"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
