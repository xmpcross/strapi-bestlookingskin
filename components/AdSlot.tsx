'use client';

import { useEffect, useRef } from 'react';
import { ADSENSE } from '@/lib/site';

export type AdKind = keyof typeof ADSENSE.slots;

/* Per-kind <ins> attributes, as AdSense generates them for each unit type. */
const FORMAT: Record<AdKind, Record<string, string>> = {
  inArticle: { 'data-ad-layout': 'in-article', 'data-ad-format': 'fluid' },
  display: { 'data-ad-format': 'auto', 'data-full-width-responsive': 'true' },
  multiplex: { 'data-ad-format': 'autorelaxed' },
};

/**
 * One manually placed AdSense unit (Auto ads are off). Renders nothing until ADSENSE.slots[kind] has a slot id,
 * so placements can ship before the units exist. The loader script is in app/layout.tsx; this only asks it to fill
 * this <ins>. A unit AdSense leaves unfilled collapses (see .ad-slot in app/magzin.css).
 */
export default function AdSlot({ kind, className = '' }: { kind: AdKind; className?: string }) {
  const slot = ADSENSE.slots[kind];
  const pushed = useRef(false);

  useEffect(() => {
    if (!slot || pushed.current) return;
    pushed.current = true;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {
      /* Blocked by an ad blocker or already filled: nothing to do. */
    }
  }, [slot]);

  if (!slot) return null;
  return (
    <aside className={`ad-slot ad-slot-${kind} ${className}`.trim()} aria-label="Advertisement">
      <span className="ad-slot-label">Advertisement</span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', textAlign: kind === 'inArticle' ? 'center' : undefined }}
        data-ad-client={ADSENSE.client}
        data-ad-slot={slot}
        {...FORMAT[kind]}
      />
    </aside>
  );
}
