/**
 * Cleans the WordPress roundup markup carried by the imported Top-Rated Products posts (Content Egg product boxes and
 * GreenShift blocks), so the post template can style it from site CSS alone.
 *
 * Removed:
 * - GreenShift's per-block <style> chunks and every inline style attribute: they reference the old theme (fixed
 *   greens, reds and yellows, drop shadows, fixed widths) and would override the site palette;
 * - images served from the old WordPress /wp-content/ folder (the Content Egg merchant logo);
 * - Content Egg prices, struck-through prices, stock lines, cashback slots and the "Amazon price updated: April 7,
 *   2024" disclaimers: frozen 2024 prices are not shown as current (see CLAUDE.md, Monetisation rules);
 * - WordPress link-plugin attributes (data-wpil-monitor-id).
 *
 * Rewritten: links to the old /top-rated/<slug>/ path on bestlooking.skin become root-relative
 * /top-rated-products/<slug> links (the old path only redirects there).
 *
 * Everything is matched on leaf elements whose contents hold no nested element of the same tag, so the surrounding
 * markup stays balanced. Idempotent.
 */
export function cleanProductRoundupHtml(html: string): string {
  if (!html) return '';
  return (
    html
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/\sstyle=("[^"]*"|'[^']*')/gi, '')
      .replace(/\sdata-wpil-monitor-id=("[^"]*"|'[^']*')/gi, '')
      .replace(/<img\b[^>]*\bsrc=["'][^"']*\/wp-content\/[^"']*["'][^>]*>/gi, '')
      /* Price disclaimer column: a <small> holding the date and an info link, closed by its own div. */
      .replace(/<div class="[^"]*\bcegg-price-disclaimer\b[^"]*">\s*<small>[\s\S]*?<\/small>\s*<\/div>/gi, '')
      .replace(/<(div|span|del|s)\s+class="[^"]*\bcegg-(?:old-)?price\b[^"]*">(?:\s|<br\s*\/?>|&nbsp;)*[^<]*<\/\1>/gi, '')
      .replace(/<div class="[^"]*\bcegg-stock-status\b[^"]*">[\s\S]*?<\/div>/gi, '')
      .replace(/<div class="[^"]*\bcegg-card-cashback\b[^"]*">\s*<\/div>/gi, '')
      .replace(
        /href="https?:\/\/(?:www\.)?bestlooking\.skin\/top-rated\/([a-z0-9-]+)\/?"/gi,
        (_m, slug: string) => `href="/top-rated-products/${slug.toLowerCase()}"`,
      )
  );
}
