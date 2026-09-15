'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Clamps the product description to roughly the height of the Specifications
 * column (right side) so the two columns read at a similar height, with a
 * "View more" / "View less" link to expand. Falls back to a sensible floor
 * height when there is no specs column to match.
 */
export default function CollapsibleDescription({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [maxH, setMaxH] = useState<number | null>(null);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    function measure() {
      const specs = document.querySelector('[data-testid="product-specs"]') as HTMLElement | null;
      const floor = 260;
      const target = Math.max(floor, specs?.offsetHeight ?? 0);
      setMaxH(target);
      const full = ref.current?.scrollHeight ?? 0;
      setOverflows(full > target + 24);
    }
    measure();
    window.addEventListener('resize', measure);
    // Re-measure once layout/fonts settle.
    const t = setTimeout(measure, 300);
    return () => {
      window.removeEventListener('resize', measure);
      clearTimeout(t);
    };
  }, []);

  const clamp = collapsed && overflows && maxH != null;

  return (
    <div>
      <div
        ref={ref}
        className="shop-collapse"
        style={clamp ? { maxHeight: maxH } : undefined}
      >
        {children}
        {clamp && <div className="shop-collapse-fade" />}
      </div>
      {overflows && (
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="shop-more-btn mt-3"
        >
          {collapsed ? 'View more' : 'View less'}
          <span aria-hidden className={`caret ${collapsed ? '' : 'is-flipped'}`}>▾</span>
        </button>
      )}
    </div>
  );
}
