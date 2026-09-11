'use client';

import { useEffect, useState } from 'react';
import type { TocItem } from '@/lib/toc';

/**
 * Left rail: reading time with a scroll-progress bar, then the article's
 * contents.
 *
 * Client-side because both halves track the scroll position — the bar fills as
 * the article is read and the current section is highlighted. The links
 * themselves are plain anchors, so the contents still work with JavaScript off;
 * only the progress and the highlight need the browser.
 *
 * Progress is measured against the article element rather than the document, so
 * a long footer or comment block does not report the piece as half-read when it
 * has actually finished.
 */
export default function ReadingRail({
  minutes,
  toc,
  targetId = 'article-body',
}: {
  minutes?: number | null;
  toc: TocItem[];
  targetId?: string;
}) {
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const onScroll = () => {
      const rect = target.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const seen = -rect.top;
      const pct = total <= 0 ? (rect.bottom <= window.innerHeight ? 100 : 0) : (seen / total) * 100;
      setProgress(Math.max(0, Math.min(100, pct)));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [targetId]);

  useEffect(() => {
    if (!toc.length) return;
    const headings = toc
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveId(visible.target.id);
      },
      /* A band near the top of the viewport: the active item should be the
         heading you are reading under, not whatever is lowest on screen. */
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [toc]);

  if (!toc.length && !minutes) return null;

  return (
    <aside className="lg:sticky lg:top-24" aria-label="Reading progress and contents" data-testid="reading-rail">
      {minutes ? (
        <div className="rounded-xl border border-ink/10 bg-paper p-4 shadow-sm">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="text-ink/55">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {minutes} min read
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-150"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Article read progress"
            />
          </div>
        </div>
      ) : null}

      {toc.length > 0 && (
        <nav className="mt-8" aria-label="Contents">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink/45">Contents</p>
          <ul className="mt-4 space-y-3">
            {toc.map((item) => {
              const active = item.id === activeId;
              return (
                <li key={item.id} className={item.level === 3 ? 'pl-3' : ''}>
                  <a
                    href={`#${item.id}`}
                    className={
                      /* Indented h3 entries at 13px: the indent alone did not
                         separate them from the h2 headings above. */
                      `block leading-snug transition ${item.level === 3 ? 'text-[13px]' : 'text-[14px]'} ` +
                      (active
                        ? 'font-semibold text-primary'
                        : item.level === 2
                          ? 'font-bold text-ink hover:text-primary'
                          : 'text-ink/55 hover:text-primary')
                    }
                    aria-current={active ? 'location' : undefined}
                  >
                    {item.text}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </aside>
  );
}
