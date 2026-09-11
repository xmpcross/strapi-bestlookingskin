'use client';

import Link from 'next/link';
import { useState } from 'react';
import PopularCarousel from '@/components/PopularCarousel';
import BrowseByTopic from '@/components/BrowseByTopic';

export type SidebarCategoryTile = { href: string; name: string; count: number; image: string | null };
export type SidebarRow = { href: string; title: string; date: string; img: string | null; category?: string };

export default function ArticleSidebar({
  categoryTiles = [],
  popular = [],
  recent = [],
}: {
  categoryTiles?: SidebarCategoryTile[];
  popular?: SidebarRow[];
  recent?: SidebarRow[];
}) {
  const [tab, setTab] = useState<'popular' | 'recent'>('popular');
  const rows = (tab === 'popular' ? popular : recent).slice(0, 5);

  return (
    <aside className="space-y-10" aria-label="Sidebar" data-testid="article-sidebar">
      {/* ---- Popular (carousel, sits above Categories) ---- */}
      <PopularCarousel rows={popular} />

      {/* ---- Categories ---- */}
      {/* Same card as the product page's Browse by topic, so a reader moving
          between a product and an article meets one list style rather than two.
          The image tiles it replaces carried a cover photo per category, which
          said nothing about the category and competed with the carousel
          directly above it. */}
      {categoryTiles.length > 0 && (
        <BrowseByTopic
          title="Browse by category"
          rows={categoryTiles.map((t) => ({
            slug: t.href.replace(/^\//, ''),
            name: t.name,
            count: t.count,
            href: t.href,
          }))}
        />
      )}

      {/* ---- Popular / Recent tabbed post list ---- */}
      <div>
        <div className="inline-flex gap-1 rounded-[4px] p-1">
          {(['popular', 'recent'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={
                'rounded-[4px] px-5 py-2 text-sm font-semibold capitalize transition ' +
                (tab === t
                  ? 'bg-[#eceef3] text-[#1f2d4d]'
                  : 'text-ink/45 hover:text-ink/70')
              }
            >
              {t}
            </button>
          ))}
        </div>
        {rows.length > 0 && (
          <ul className="mt-5 divide-y divide-ink/10" data-testid={`sidebar-${tab}-list`}>
            {rows.map((r) => (
              <li key={r.href} className="py-3 first:pt-0 last:pb-0">
                <Link href={r.href} className="group grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3">
                  <div className="overflow-hidden rounded bg-ink/5">
                    {r.img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.img}
                        alt={r.title}
                        className="aspect-square h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="aspect-square bg-gradient-to-br from-primary-hover to-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="line-clamp-2 font-display !text-[14px] !font-normal leading-snug text-[#014fd3] transition group-hover:text-primary">
                      {r.title}
                    </h4>
                    {r.date && (
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-ink/55">
                        {r.date}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
