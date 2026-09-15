import { mediaUrl, type BlsPost, type BlsPostSummary } from '@/lib/strapi';
import { fmtDate, postPath, primaryCategorySlug } from '@/lib/format';

/* What a Magzin card needs from a post. Nothing here is invented: no view or comment counts, no bookmarks. */
export type PostCardData = {
  key: string;
  href: string;
  title: string;
  excerpt: string;
  image: string | null;
  imageAlt: string;
  category: { name: string; href: string } | null;
  author: { name: string; href: string; avatar: string | null } | null;
  date: string;
  /* Reading time is shown only for posts with a named author: the Tier B values are known to be wrong. */
  readMinutes: number | null;
  badgeTone: string;
};

const TONES = ['bg-1', 'bg-2', 'bg-3', 'bg-4', 'bg-5'];
const toneFor = (slug: string) => TONES[[...slug].reduce((n, c) => n + c.charCodeAt(0), 0) % TONES.length];

export function toCard(post: BlsPost | BlsPostSummary): PostCardData {
  const catSlug = primaryCategorySlug(post);
  const cat = post.categories?.find((c) => c.slug === catSlug) ?? null;
  const excerpt = (post.excerpt || post.seoDescription || '').replace(/<[^>]+>/g, '').trim();
  return {
    key: String(post.documentId ?? post.id),
    href: postPath(post),
    title: post.title,
    excerpt,
    /* A cover under 5 KB is a failed render (three guides carry the same 3.79 KB all-black JPEG); show none. */
    image: post.coverImage?.size !== undefined && post.coverImage.size < 5 ? null : mediaUrl(post.coverImage ?? null),
    imageAlt: post.coverImage?.alternativeText || post.title,
    category: cat ? { name: cat.name, href: `/${cat.slug}` } : null,
    author: post.author ? { name: post.author.name, href: `/authors/${post.author.slug}`, avatar: post.author.avatarUrl || null } : null,
    date: fmtDate(post.publishedAt),
    readMinutes: post.author && post.readingTimeMinutes ? post.readingTimeMinutes : null,
    badgeTone: toneFor(catSlug),
  };
}
