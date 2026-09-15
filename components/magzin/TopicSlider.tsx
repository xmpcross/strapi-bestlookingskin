'use client';

import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import type { PostCardData } from '@/lib/post-card';
import { TextCard } from './cards';

export type TopicTab = { slug: string; label: string; href: string; posts: PostCardData[] };

/* Home "Browse by Topic": hub tabs beside a slider of that hub's posts (Magzin home 2, section 3). */
export default function TopicSlider({ tabs }: { tabs: TopicTab[] }) {
  const [active, setActive] = useState(tabs[0]?.slug);
  const current = tabs.find((t) => t.slug === active) ?? tabs[0];
  if (!current) return null;
  return (
    <div className="row">
      <div className="col-lg-3">
        <ul className="nav nav-tabs d-flex flex-lg-column flex-row flex-wrap ps-0 ps-lg-5" role="tablist">
          {tabs.map((tab) => (
            <li className="nav-item" key={tab.slug}>
              <button
                type="button"
                className={`nav-link border-0 bg-transparent${tab.slug === current.slug ? ' active' : ''}`}
                onClick={() => setActive(tab.slug)}
                role="tab"
                aria-selected={tab.slug === current.slug}
                aria-controls="topic-slider-panel"
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="col-lg-9" id="topic-slider-panel" role="tabpanel">
        <div className="box-swiper-padding">
          <Swiper
            key={current.slug}
            className="slider-3"
            modules={[Autoplay, Navigation]}
            slidesPerView={1}
            spaceBetween={20}
            loop={current.posts.length > 3}
            autoplay={{ delay: 6000, pauseOnMouseEnter: true, disableOnInteraction: true }}
            breakpoints={{ 576: { slidesPerView: 1 }, 768: { slidesPerView: 2 }, 1200: { slidesPerView: 3 } }}
          >
            {current.posts.map((card) => (
              <SwiperSlide key={card.key}>
                <TextCard card={card} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
}
