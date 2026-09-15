'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

/**
 * Product page information: Description and Reviews as accordion sections (<details>, first one open), and the
 * attribute lists (Specifications, Additional Info) as rows that open a side peek, a panel sliding in from the
 * right. Every section's content is in the HTML either way, so crawlers and readers without JavaScript get all of
 * it.
 *
 * The side peek is a modal dialog: Esc, the close button or the backdrop close it, focus moves into it on open and
 * back to the row that opened it on close, and the page behind it does not scroll. Other components (the Highlights
 * tiles) open a peek by dispatching `product-peek` with the section key; a `#product-section-<key>` hash on load
 * opens it too.
 */
export type ProductInfoSection = { key: string; label: string; content: React.ReactNode; peek?: boolean };

export const PRODUCT_PEEK_EVENT = 'product-peek';

export default function ProductInfoAccordion({ sections }: { sections: ProductInfoSection[] }) {
  const [active, setActive] = useState<string | null>(null);
  const id = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const peekSections = sections.filter((s) => s.peek);

  const open = useCallback(
    (key: string) => {
      if (!peekSections.some((s) => s.key === key)) return false;
      returnFocus.current = document.activeElement as HTMLElement | null;
      setActive(key);
      return true;
    },
    [peekSections],
  );
  const close = useCallback(() => {
    setActive(null);
    if (location.hash.startsWith('#product-section-')) history.replaceState(null, '', location.pathname + location.search);
    returnFocus.current?.focus?.();
  }, []);

  /* Open from other components and from a section hash on load. */
  useEffect(() => {
    const onPeek = (e: Event) => open(String((e as CustomEvent).detail));
    window.addEventListener(PRODUCT_PEEK_EVENT, onPeek);
    const fromHash = location.hash.match(/^#product-section-(.+)$/)?.[1];
    if (fromHash) queueMicrotask(() => open(fromHash));
    return () => window.removeEventListener(PRODUCT_PEEK_EVENT, onPeek);
  }, [open]);

  /* While open: Esc closes, focus starts on the close button, the page behind does not scroll. */
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [active, close]);

  if (!sections.length) return null;
  const activeSection = peekSections.find((s) => s.key === active);

  return (
    <div className="product-accordion" data-testid="product-info-accordion">
      {sections.map((s, i) =>
        s.peek ? (
          <div key={s.key} id={`product-section-${s.key}`} className="product-accordion-item is-peek" data-section={s.key}>
            <button
              type="button"
              className="product-accordion-summary product-peek-trigger"
              aria-haspopup="dialog"
              aria-expanded={active === s.key}
              aria-controls={`${id}-peek`}
              onClick={() => open(s.key)}
            >
              <h2 className="product-accordion-title">{s.label}</h2>
              <svg className="product-peek-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </button>
          </div>
        ) : (
          <details key={s.key} id={`product-section-${s.key}`} className="product-accordion-item" open={i === 0} data-section={s.key}>
            <summary className="product-accordion-summary">
              <h2 className="product-accordion-title">{s.label}</h2>
              <span className="product-accordion-icon" aria-hidden />
            </summary>
            <div className="product-accordion-panel">{s.content}</div>
          </details>
        ),
      )}

      {peekSections.length > 0 && (
        <>
          <div className={`side-peek-backdrop${active ? ' is-open' : ''}`} onClick={close} aria-hidden />
          <div
            id={`${id}-peek`}
            className={`side-peek${active ? ' is-open' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-peek-title`}
            aria-hidden={!active}
            data-testid="product-side-peek"
          >
            <div className="side-peek-header">
              <h2 id={`${id}-peek-title`} className="side-peek-title">
                {activeSection?.label ?? peekSections[0].label}
              </h2>
              <button ref={closeRef} type="button" className="side-peek-close" onClick={close} aria-label="Close" tabIndex={active ? 0 : -1}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="side-peek-body">
              {peekSections.map((s) => (
                <div key={s.key} hidden={active ? s.key !== active : s.key !== peekSections[0].key}>
                  {s.content}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
