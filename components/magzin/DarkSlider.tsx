'use client';

import { Children } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

/* Three-up card slider for dark bands (Magzin home 2, section 4). */
export default function DarkSlider({ children }: { children: React.ReactNode }) {
  const slides = Children.toArray(children);
  return (
    <Swiper slidesPerView={1} spaceBetween={15} loop={slides.length > 3} breakpoints={{ 768: { slidesPerView: 2 }, 1200: { slidesPerView: 3 } }}>
      {slides.map((child, i) => (
        <SwiperSlide key={i}>{child}</SwiperSlide>
      ))}
    </Swiper>
  );
}
