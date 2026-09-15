/**
 * Product page information as an accordion (Description / Specifications / Additional Info / Reviews). Built on
 * <details>/<summary>: every section is in the HTML for crawlers and readers without JavaScript, the browser
 * handles the keyboard, and more than one section can be open at once. The first section starts open.
 */
export type ProductInfoSection = { key: string; label: string; content: React.ReactNode };

export default function ProductInfoAccordion({ sections }: { sections: ProductInfoSection[] }) {
  if (!sections.length) return null;
  return (
    <div className="product-accordion" data-testid="product-info-accordion">
      {sections.map((s, i) => (
        <details key={s.key} id={`product-section-${s.key}`} className="product-accordion-item" open={i === 0} data-section={s.key}>
          <summary className="product-accordion-summary">
            <h2 className="product-accordion-title">{s.label}</h2>
            <span className="product-accordion-icon" aria-hidden />
          </summary>
          <div className="product-accordion-panel">{s.content}</div>
        </details>
      ))}
    </div>
  );
}
