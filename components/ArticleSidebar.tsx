import PopularCarousel from '@/components/PopularCarousel';
import BrowseByTopic from '@/components/BrowseByTopic';
import WeeklyTrending from '@/components/WeeklyTrending';
import IherbBeautyDeals from '@/components/IherbBeautyDeals';

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
  /* No tabs any more, so no client state: show popular where there is enough of
     it and fall back to recent, rather than rendering an empty panel. */
  const rows = (popular.length >= 3 ? popular : recent).slice(0, 5);

  return (
    <aside className="space-y-10" aria-label="Sidebar" data-testid="article-sidebar">
      {/* ---- Weekly trending (above Categories) ---- */}
      <WeeklyTrending rows={rows} />

      {/* ---- Categories ---- */}
      {/* Same card as the product page's Browse by topic, so a reader moving
          between a product and an article meets one list style rather than two.
          The image tiles it replaces carried a cover photo per category, which
          said nothing about the category and competed with the carousel
          directly above it. */}
      {categoryTiles.length > 0 && (
        <BrowseByTopic
          title="Browse by category"
          /* Every non-empty category now, which is ~20 rows -- enough to push
             the trending list far below the fold. Capped and scrolled. */
          maxHeight={340}
          rows={categoryTiles.map((t) => ({
            slug: t.href.replace(/^\//, ''),
            name: t.name,
            count: t.count,
            href: t.href,
          }))}
        />
      )}

      {/* ---- Beauty deals (iHerb, refreshed daily) ---- */}
      {/* Below the editorial panels deliberately: the trending and category
          lists are what a reader came for, and a commercial panel above them
          would read as the page leading with an ad. Renders nothing when the
          scrape cache is missing. */}
      <IherbBeautyDeals limit={4} />

      {/* ---- Popular (carousel) ---- */}
      <PopularCarousel rows={popular} />
    </aside>
  );
}
