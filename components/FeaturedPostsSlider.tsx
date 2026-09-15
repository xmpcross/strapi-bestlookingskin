'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

export type FeaturedPost = { href: string; title: string; image: string; imageAlt: string; author: string | null; date: string };

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

/**
 * Post sidebar "Featured Posts": one image card at a time (title and byline over the cover), auto-sliding. With
 * showText off it is a plain cover slider (home page sidebar); the link still names the guide for screen readers.
 * Autoplay pauses on hover and is off for readers who ask for reduced motion; they can still swipe or use the dots.
 */
export default function FeaturedPostsSlider({ posts, showText = true, className = '' }: { posts: FeaturedPost[]; showText?: boolean; className?: string }) {
  const reducedMotion = useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(reducedMotionQuery);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
  const items = posts.slice(0, 3);
  if (!items.length) return null;

  return (
    <Swiper
      className={`featured-posts-swiper ${className}`.trim()}
      modules={[Autoplay, Pagination, A11y]}
      slidesPerView={1}
      spaceBetween={12}
      loop={items.length > 1}
      autoplay={!reducedMotion && items.length > 1 ? { delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
      pagination={{ clickable: true }}
    >
      {items.map((p) => (
        <SwiperSlide key={p.href}>
          <Link href={p.href} className={`featured-post-card${showText ? '' : ' is-image-only'}`} aria-label={showText ? undefined : p.title}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt={showText ? p.imageAlt : ''} loading="lazy" />
            {showText && (
              <span className="featured-post-body">
                <span className="featured-post-title">{p.title}</span>
                <span className="featured-post-meta">{p.author ? `${p.author} on ${p.date}` : p.date}</span>
              </span>
            )}
          </Link>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
