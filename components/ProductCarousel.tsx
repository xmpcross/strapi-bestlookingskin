'use client';

import { Children, useSyncExternalStore } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

/**
 * Auto-sliding row of product cards (product page "More in {category}"). The cards are server-rendered and passed
 * in as children; this only lays them out: 6 per row on wide screens, fewer on narrower ones, 20px apart. Autoplay
 * pauses on hover and is off for readers who ask for reduced motion (swipe and the dots still work).
 */
export default function ProductCarousel({ children, label }: { children: React.ReactNode; label: string }) {
  const reducedMotion = useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(reducedMotionQuery);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
  const slides = Children.toArray(children);
  if (!slides.length) return null;
  const loop = slides.length > 6;

  return (
    <Swiper
      className="product-carousel"
      aria-label={label}
      modules={[Autoplay, Pagination, A11y]}
      spaceBetween={20}
      slidesPerView={2}
      breakpoints={{ 576: { slidesPerView: 3 }, 768: { slidesPerView: 4 }, 1200: { slidesPerView: 6 } }}
      loop={loop}
      autoplay={!reducedMotion && slides.length > 2 ? { delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
      pagination={{ clickable: true }}
    >
      {slides.map((slide, i) => (
        <SwiperSlide key={i} className="h-auto">
          {slide}
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
