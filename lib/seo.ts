import type { Metadata } from 'next';
import { SITE } from '@/lib/site';

/* The layout's title template appends " · BestLooking.Skin". Google cuts titles off at about 60 characters, so a
   page whose own title is already long drops the suffix (GSC audit 24 Sep 2026: 261 of 504 titles ran past 65). */
const SUFFIX = ` · ${SITE.name}`;
const MAX = 60;

/** A page title for generateMetadata: templated when it fits in 60 characters, bare (absolute) when it would not. */
export function seoTitle(title: string): Metadata['title'] {
  return title.length + SUFFIX.length > MAX ? { absolute: title } : title;
}

/** A full URL for a site path (og:image, JSON-LD image): /cms-uploads/x.jpg -> https://www.bestlooking.skin/cms-uploads/x.jpg. */
export function absoluteUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE.url}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** openGraph + twitter image metadata for one image (full URL). */
export function shareImages(url: string | null | undefined, alt?: string) {
  const u = absoluteUrl(url) ?? absoluteUrl(SITE.ogImage)!;
  return {
    openGraphImages: [{ url: u, ...(alt ? { alt } : {}) }],
    twitter: { card: 'summary_large_image' as const, images: [u] },
  };
}
