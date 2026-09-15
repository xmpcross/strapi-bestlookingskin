'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';

export type TopicOption = { slug: string; label: string; count?: number };

/**
 * "Browse Topics" as a dropdown with checkboxes. The current archive's topic is always included; ticking others
 * and pressing "Show posts" reloads the archive with `?topics=a,b` so the grid lists posts from every selected topic.
 * Esc or a click outside closes the panel.
 */
export default function TopicMultiSelect({
  basePath,
  current,
  options,
  selected,
}: {
  basePath: string;
  current: string;
  options: TopicOption[];
  selected: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>(selected);
  const wrapRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug]));
  const apply = () => {
    const extra = picked.filter((s) => s !== current);
    setOpen(false);
    router.push(extra.length ? `${basePath}?topics=${extra.map(encodeURIComponent).join(',')}` : basePath);
  };
  const extraCount = picked.filter((s) => s !== current).length;

  return (
    <div className="topic-select" ref={wrapRef}>
      <button type="button" className="topic-select-button" aria-haspopup="true" aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => setOpen((o) => !o)}>
        <span>{extraCount ? `${extraCount + 1} topics selected` : 'Select topics'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={open ? 'is-flipped' : ''}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div id={`${id}-panel`} className="topic-select-panel" hidden={!open}>
        <ul className="list-unstyled m-0 p-0">
          {options.map((o) => {
            const isCurrent = o.slug === current;
            return (
              <li key={o.slug}>
                <label className={`topic-select-option${isCurrent ? ' is-current' : ''}`}>
                  <input type="checkbox" checked={isCurrent || picked.includes(o.slug)} disabled={isCurrent} onChange={() => toggle(o.slug)} />
                  <span className="topic-select-label">{o.label}</span>
                  {typeof o.count === 'number' && <span className="topic-select-count">{o.count}</span>}
                </label>
              </li>
            );
          })}
        </ul>
        <div className="topic-select-actions">
          <button type="button" className="topic-select-clear" onClick={() => setPicked([current])}>
            Clear
          </button>
          <button type="button" className="btn btn-dark shop-btn shop-btn-sm shop-btn-square" onClick={apply}>
            Show posts
          </button>
        </div>
      </div>
    </div>
  );
}
