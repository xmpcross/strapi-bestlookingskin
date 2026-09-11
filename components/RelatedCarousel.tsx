'use client';

import { useEffect, useState } from 'react';
import type { BlsPost } from '@/lib/strapi';
import PostCard from '@/components/PostCard';

/**
 * Related-posts auto-sliding carousel.
 * One row of 4 (lg) per page; auto-advances every 5s and pauses on hover/focus.
 */
const PER_PAGE = 4;
const INTERVAL_MS = 5000;

export default function RelatedCarousel({ posts }: { posts: BlsPost[] }) {
  const pageCount = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (pageCount < 2 || paused) return;
    const id = setInterval(() => setPage((p) => (p + 1) % pageCount), INTERVAL_MS);
    return () => clearInterval(id);
  }, [pageCount, paused]);

  return (
    <div
      className="relative"
      data-testid="related-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${page * 100}%)` }}
          aria-live="polite"
        >
          {Array.from({ length: pageCount }).map((_, i) => {
            const slice = posts.slice(i * PER_PAGE, (i + 1) * PER_PAGE);
            return (
              <div
                key={i}
                className="grid w-full shrink-0 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
                aria-hidden={i !== page}
              >
                {slice.map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    variant="tile"
                    /* Editorial covers: fill the frame at 8px, with no
                       letterboxing masquerading as padding. */
                    fit="cover"
                    thumbRadius="rounded-lg"
                    thumbBg="bg-transparent"
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {pageCount > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2" role="tablist" aria-label="Related slides">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === page}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setPage(i)}
              className={
                i === page
                  ? 'h-2 w-8 rounded-full bg-primary transition-all'
                  : 'h-2 w-2 rounded-full bg-ink/20 transition-all hover:bg-ink/40'
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
