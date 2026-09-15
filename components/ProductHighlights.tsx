'use client';

import Link from 'next/link';
import type { ProductHighlight } from '@/lib/product-attributes';

function Chevron() {
  return (
    <svg className="product-highlight-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/**
 * "Highlights" strip on the product page, above the description: label/value tiles in four columns. The brand tile
 * goes to the brand's page; every other tile opens and scrolls to the accordion section (Specifications or
 * Additional Info) its value comes from. Without JavaScript the tiles still jump to the section by its anchor.
 */
export default function ProductHighlights({ brand, items }: { brand: { name: string; href: string } | null; items: ProductHighlight[] }) {
  if (!brand && !items.length) return null;

  const openSection = (e: React.MouseEvent<HTMLAnchorElement>, section: string) => {
    const el = document.getElementById(`product-section-${section}`) as HTMLDetailsElement | null;
    if (!el) return;
    e.preventDefault();
    el.open = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#product-section-${section}`);
  };

  return (
    <section className="product-highlights" aria-labelledby="product-highlights-title" data-testid="product-highlights">
      <h2 id="product-highlights-title" className="product-highlights-title">
        Highlights
      </h2>
      <ul className="product-highlights-grid list-unstyled m-0 p-0">
        {brand && (
          <li>
            <Link href={brand.href} className="product-highlight">
              <span className="product-highlight-text">
                <span className="product-highlight-label">Brand</span>
                <span className="product-highlight-value">{brand.name}</span>
              </span>
              <Chevron />
            </Link>
          </li>
        )}
        {items.map((h) => (
          <li key={h.label}>
            <a href={`#product-section-${h.section}`} className="product-highlight" onClick={(e) => openSection(e, h.section)}>
              <span className="product-highlight-text">
                <span className="product-highlight-label">{h.label}</span>
                <span className="product-highlight-value">{h.value}</span>
              </span>
              <Chevron />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
