import { format, parseISO } from 'date-fns';

export function fmtDate(iso?: string): string {
  if (!iso) return '';
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return '';
  }
}

/** "Sep 16" -- the day within a month-grouped listing, where the heading carries the year. */
export function fmtShortDate(iso?: string): string {
  if (!iso) return '';
  try {
    return format(parseISO(iso), 'MMM d');
  } catch {
    return '';
  }
}

/** "September 2026" -- a month heading, and the key posts are grouped by. */
export function fmtMonthYear(iso?: string): string {
  if (!iso) return '';
  try {
    return format(parseISO(iso), 'MMMM yyyy');
  } catch {
    return '';
  }
}

// Pick the canonical primary category for a post — the first one that's not "uncategorized".
export function primaryCategorySlug(post: { categories?: { slug: string }[] }): string {
  const cats = post.categories ?? [];
  const real = cats.find((c) => c.slug !== 'uncategorized');
  return real?.slug ?? cats[0]?.slug ?? 'uncategorized';
}

export function postPath(post: { slug: string; categories?: { slug: string }[] }): string {
  return `/${primaryCategorySlug(post)}/${post.slug}`;
}

// First inline <img src="..."> in post body HTML — used as a thumbnail fallback
// when a post has no coverImage (e.g., when the WP featured_media reference
// was orphaned, but the body still has Amazon product images).
export function firstImageUrl(html?: string): string | null {
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1] ?? null;
}

/**
 * A meta description derived from the post body.
 *
 * Used only when a post has neither `seoDescription` nor `excerpt`. The
 * previous fallback was the site-wide description, which put one identical
 * sentence on 120 legacy posts — telling a search engine that 120 URLs are
 * interchangeable, and wasting the one line of copy that decides whether
 * anyone clicks the result.
 *
 * Handles both body formats in the CMS: HTML from the WordPress migration and
 * Markdown from newer posts. Prefers the opening paragraphs and skips headings,
 * so the description reads as prose rather than starting mid-title.
 */
export function descriptionFromBody(body?: string | null, limit = 155): string {
  if (!body) return '';

  let text = body;

  // Drop anything that is markup rather than prose.
  text = text.replace(/<(script|style)[\s\S]*?<\/\1\s*>/gi, ' ');

  // Prefer the first paragraphs of an HTML body — heading text reads badly as a
  // description and usually just repeats the title.
  const paras = [...text.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => m[1]);
  if (paras.length) text = paras.join(' ');

  text = text
    .replace(/<[^>]+>/g, ' ')
    // Markdown: images, then links (keep the label), emphasis, headings, quotes, list bullets.
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+.*$/gm, ' ')
    .replace(/^\s{0,3}>\s?/gm, ' ')
    .replace(/^\s{0,3}[-*+]\s+/gm, ' ')
    .replace(/`+/g, '')
    // Entities left behind by the migration.
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&#0?39;|&apos;|&lsquo;|&rsquo;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    // Stripping inline tags leaves a space before punctuation ("sensitive skin ,").
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();

  if (!text) return '';
  if (text.length <= limit) return text;

  // Clip on a word boundary; only fall back to a hard cut if the last space is
  // so early that the description would be a fragment.
  const cut = text.slice(0, limit + 1);
  const space = cut.lastIndexOf(' ');
  return `${cut.slice(0, space > 80 ? space : limit).replace(/[\s,;:.—-]+$/, '')}…`;
}
