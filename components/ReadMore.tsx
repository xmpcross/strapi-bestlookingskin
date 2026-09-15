'use client';

import { useEffect, useId, useRef, useState } from 'react';

/**
 * Clamps long content to a fixed height (600px by default) with a fade and a "Read more" / "Read less" text link.
 * The full content is always in the HTML (only its visible height is limited), so crawlers and readers without
 * JavaScript get all of it. Content that fits within the limit shows in full with no link.
 */
export default function ReadMore({ children, maxHeight = 600 }: { children: React.ReactNode; maxHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const id = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /* Re-measure when the content or the column width changes (fonts, images, resizing). */
    const observer = new ResizeObserver(() => setOverflows(el.scrollHeight > maxHeight + 40));
    observer.observe(el);
    return () => observer.disconnect();
  }, [maxHeight]);

  const collapsed = overflows && !expanded;

  return (
    <div className="read-more">
      <div
        id={id}
        ref={ref}
        className={`read-more-content${collapsed ? ' is-collapsed' : ''}`}
        style={collapsed ? { maxHeight } : undefined}
      >
        {children}
      </div>
      {overflows && (
        <button
          type="button"
          className="read-more-toggle"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => {
            if (expanded) ref.current?.closest('.product-accordion-item')?.scrollIntoView({ block: 'start' });
            setExpanded((e) => !e);
          }}
        >
          {expanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  );
}
