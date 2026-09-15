'use client';

import { useEffect, useState } from 'react';

export type Chapter = { id: string; text: string };

/**
 * Sticky "In this guide" navigation beside a pillar page: numbered chapters, the one in view highlighted, and a thin
 * bar showing how far through the guide the reader is. Links are plain anchors, so it works without JavaScript; the
 * script only adds the highlight and the progress bar.
 */
export default function ChapterNav({ chapters, faqId }: { chapters: Chapter[]; faqId?: string | null }) {
  const [active, setActive] = useState<string | null>(chapters[0]?.id ?? null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const ids = [...chapters.map((c) => c.id), ...(faqId ? [faqId] : [])];
    const onScroll = () => {
      const offset = window.innerHeight * 0.3;
      let current: string | null = ids[0] ?? null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top - offset <= 0) current = id;
      }
      setActive(current);
      const body = document.getElementById('pillar-body');
      if (body) {
        const rect = body.getBoundingClientRect();
        const total = rect.height - window.innerHeight * 0.5;
        setProgress(total <= 0 ? 1 : Math.max(0, Math.min(1, (-rect.top + window.innerHeight * 0.3) / total)));
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [chapters, faqId]);

  return (
    <nav className="pillar-nav" aria-label="In this guide">
      <p className="pillar-nav-title">In this guide</p>
      <div className="pillar-nav-progress" aria-hidden>
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
      <ol className="pillar-nav-list">
        {chapters.map((c, i) => (
          <li key={c.id}>
            <a href={`#${c.id}`} className={active === c.id ? 'is-active' : undefined} aria-current={active === c.id ? 'true' : undefined}>
              <span className="pillar-nav-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="pillar-nav-text">{c.text}</span>
            </a>
          </li>
        ))}
        {faqId && (
          <li>
            <a href={`#${faqId}`} className={active === faqId ? 'is-active' : undefined}>
              <span className="pillar-nav-num">?</span>
              <span className="pillar-nav-text">FAQs</span>
            </a>
          </li>
        )}
      </ol>
    </nav>
  );
}
