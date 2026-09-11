'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { SidebarRow } from '@/components/ArticleSidebar';

/**
 * "Popular" carousel for the article sidebar.
 *
 * Shows one post at a time: category badge, cover image, the title as stacked
 * highlight bars over the image, and the publish date beneath.
 *
 * The reference design also carried a byline and a comment count. Neither is
 * rendered, because neither exists: bls-post.author is null on every post in
 * this collection and the content type has no comments relation. Inventing
 * "by Nicole Reed · 2 comments" would put fabricated attribution on a live
 * affiliate site. Add the fields in Strapi and they can be shown for real.
 */
export default function PopularCarousel({ rows }: { rows: SidebarRow[] }) {
  const items = rows.filter((r) => r.img).slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  /* Auto-advance, paused on hover and on keyboard focus so it cannot slide out
     from under someone reading or tabbing through it. Cleared on unmount. */
  useEffect(() => {
    if (count < 2 || paused) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => window.clearInterval(id);
  }, [count, paused]);

  if (items.length === 0) return null;

  const current = items[Math.min(index, items.length - 1)];
  const go = (delta: number) => setIndex((i) => (i + delta + items.length) % items.length);

  return (
    <div
      data-testid="sidebar-popular-carousel"
      className="lg:sticky lg:top-24"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <h3 className="flex items-center gap-3 !text-[14px] font-bold uppercase tracking-widest text-ink">
        Popular
        <span aria-hidden className="h-px w-10 bg-ink/20" />
      </h3>

      <div className="mt-4 overflow-hidden rounded border border-ink/10 bg-paper shadow-sm">
        <div className="group relative">
          <Link href={current.href} className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.img as string}
              alt={current.title}
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
            />
            {/* Light dark tint across the whole image, plus a stronger foot so the
                title stays readable over a busy photograph. */}
            <span aria-hidden className="absolute inset-0 bg-ink/35" />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />

            {current.category && (
              <span className="absolute left-3 top-3 rounded bg-white/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink backdrop-blur-sm">
                {current.category}
              </span>
            )}

            {/*
              Title sits directly on the image: no highlight bars. The stacked
              dark boxes the reference used made the text hard to read once real
              covers went behind them, so legibility comes from the gradient
              below plus a text shadow instead.
            */}
            <span className="absolute inset-x-3 bottom-3 block">
              <span
                className="pc-title font-display text-[17px] font-bold leading-[1.35] text-white"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,.55), 0 0 14px rgba(0,0,0,.35)' }}
              >
                {current.title}
              </span>
            </span>
          </Link>

          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous popular post"
                className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/70 text-ink opacity-0 transition hover:bg-white focus-visible:opacity-100 group-hover:opacity-100"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next popular post"
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/70 text-ink opacity-0 transition hover:bg-white focus-visible:opacity-100 group-hover:opacity-100"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          )}
        </div>

        <p className="px-3 py-3 text-[13px] text-ink/55">{current.date}</p>
      </div>

      {items.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {items.map((item, i) => (
            <button
              key={item.href}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show popular post ${i + 1}`}
              aria-current={i === index}
              className={
                i === index
                  ? 'h-1.5 w-6 rounded-full bg-ink transition-all'
                  : 'h-1.5 w-1.5 rounded-full bg-ink/25 transition-all hover:bg-ink/40'
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
