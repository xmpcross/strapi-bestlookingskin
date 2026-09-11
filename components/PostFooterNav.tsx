import Link from 'next/link';
import type { BlsPost } from '@/lib/strapi';
import { mediaUrl } from '@/lib/strapi';
import { postPath, firstImageUrl } from '@/lib/format';

type Tag = { label: string; href?: string };

/**
 * End-of-article furniture: tags and share buttons, then previous/next posts.
 *
 * Share links are plain intent URLs — no SDK, no third-party script, nothing
 * loaded until the reader actually clicks. The reference also showed a Behance
 * button, dropped here because a skincare article has no business being shared
 * to a design portfolio network.
 */
export default function PostFooterNav({
  title,
  url,
  tags,
  prev,
  next,
}: {
  title: string;
  url: string;
  tags: Tag[];
  prev: BlsPost | null;
  next: BlsPost | null;
}) {
  const enc = encodeURIComponent;
  const share = [
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      path: 'M22 12a10 10 0 1 0-11.56 9.88v-6.99h-2.5V12h2.5V9.83c0-2.47 1.47-3.84 3.73-3.84 1.08 0 2.21.19 2.21.19v2.43h-1.25c-1.23 0-1.61.76-1.61 1.55V12h2.74l-.44 2.89h-2.3v6.99A10 10 0 0 0 22 12Z' },
    { label: 'X', href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`,
      path: 'M18.244 2H21.5l-7.55 8.63L22.75 22h-6.96l-5.45-7.13L4.04 22H.78l8.08-9.23L1.25 2h7.13l4.93 6.52L18.244 2Zm-1.22 18h1.93L7.06 4H5.04l11.984 16Z' },
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
      path: 'M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3.2 8.5h3.5V21H3.2V8.5Zm5.8 0h3.35v1.7h.05c.47-.85 1.6-1.75 3.3-1.75 3.53 0 4.2 2.2 4.2 5.06V21h-3.5v-6.1c0-1.46-.03-3.34-2.1-3.34-2.1 0-2.42 1.6-2.42 3.24V21H9V8.5Z' },
  ];

  const Card = ({ post, side }: { post: BlsPost; side: 'prev' | 'next' }) => {
    const img = mediaUrl(post.coverImage ?? null) ?? firstImageUrl(post.content ?? '');
    return (
      <Link
        href={postPath(post)}
        className={`group flex items-center gap-4 ${side === 'next' ? 'sm:flex-row-reverse sm:text-right' : ''}`}
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={post.title} className="h-16 w-16 shrink-0 rounded object-cover" loading="lazy" />
        ) : (
          <span className="h-16 w-16 shrink-0 rounded bg-ink/5" />
        )}
        <span className="min-w-0">
          <span className="block text-[13px] text-ink/45">{side === 'prev' ? 'Prev Post' : 'Next Post'}</span>
          <span className="mt-1 block font-display !text-[15px] font-bold leading-snug text-ink transition group-hover:text-primary">
            {post.title}
          </span>
        </span>
      </Link>
    );
  };

  return (
    <div data-testid="post-footer-nav">
      <div className="mt-12 border-y border-ink/10 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ul className="flex flex-wrap gap-3">
            {tags.map((t) => (
              <li key={t.label}>
                {t.href ? (
                  <Link href={t.href} className="inline-flex min-h-[38px] items-center justify-center rounded border border-ink/15 px-4 text-[13px] leading-none text-ink/70 transition hover:border-ink/30 hover:text-primary">
                    {t.label}
                  </Link>
                ) : (
                  <span className="inline-flex min-h-[38px] items-center justify-center rounded border border-ink/15 px-4 text-[13px] leading-none text-ink/70">{t.label}</span>
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <span className="text-[13px] text-ink/55">Share:</span>
            <ul className="flex items-center overflow-hidden rounded border border-ink/15">
              {share.map((sh) => (
                <li key={sh.label} className="border-l border-ink/15 first:border-l-0">
                  <a
                    href={sh.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Share on ${sh.label}`}
                    className="grid h-10 w-11 place-items-center text-ink/70 transition hover:bg-muted hover:text-primary"
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden>
                      <path d={sh.path} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {(prev || next) && (
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>{prev && <Card post={prev} side="prev" />}</div>
          <div>{next && <Card post={next} side="next" />}</div>
        </div>
      )}
    </div>
  );
}
