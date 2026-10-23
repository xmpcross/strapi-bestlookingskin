'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { b } from '@/lib/blush';
import { Icon } from './Icon';

/**
 * A heading with prev/next buttons over a horizontally scrolling, snapping row. Used for the "Latest guides"
 * rail and the "Latest products" slider; `trackClass` picks the track's look (`rail__track` or
 * `pslider__track`), and each child is one slide.
 */
export default function ScrollRow({
  title,
  id,
  href,
  linkLabel,
  trackClass,
  wrapperClass,
  children,
}: {
  title: string;
  id: string;
  href?: string;
  linkLabel?: string;
  trackClass: string;
  wrapperClass: string;
  children: React.ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const sync = () => {
      setAtStart(el.scrollLeft <= 0);
      setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 1);
    };
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      el.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  /* One page is the visible width less a card, so the card on the edge is fully in view afterwards. */
  const page = (direction: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.85, 240), behavior: 'smooth' });
  };

  return (
    <div className={b(wrapperClass)}>
      <div className={b('section-head section-head--flush')}>
        <div className={b('section-head__bar')}>
          <h2 className={b('section-head__name')} id={id}>
            {title}
          </h2>
          <div className={b('rail-nav')}>
            {href && linkLabel && (
              <Link className={b('section-link')} href={href}>
                {linkLabel}
                <Icon name="arrow-right" size={14} />
              </Link>
            )}
            <button type="button" className={b('rail-nav__btn')} onClick={() => page(-1)} disabled={atStart} aria-label="Scroll back">
              <Icon name="arrow-left" size={18} />
            </button>
            <button type="button" className={b('rail-nav__btn')} onClick={() => page(1)} disabled={atEnd} aria-label="Scroll forward">
              <Icon name="arrow-right" size={18} />
            </button>
          </div>
        </div>
      </div>
      <div ref={track} className={b(trackClass)}>
        {children}
      </div>
    </div>
  );
}
