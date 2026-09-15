import Link from 'next/link';
import type { BlsPost } from '@/lib/strapi';
import { mediaUrl } from '@/lib/strapi';
import { postPath, firstImageUrl } from '@/lib/format';

type Tag = { label: string; href?: string };

function Card({ post, side }: { post: BlsPost; side: 'prev' | 'next' }) {
  const img = mediaUrl(post.coverImage ?? null) ?? firstImageUrl(post.content ?? '');
  return (
    <Link href={postPath(post)} className={`d-flex align-items-center gap-3 ${side === 'next' ? 'flex-sm-row-reverse text-sm-end' : ''}`}>
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" className="rounded-8" style={{ width: 64, height: 64, objectFit: 'cover', flexShrink: 0 }} loading="lazy" />
      ) : (
        <span className="rounded-8 bg-100" style={{ width: 64, height: 64, flexShrink: 0 }} />
      )}
      <span>
        <span className="d-block fs-8 text-600">{side === 'prev' ? 'Previous article' : 'Next article'}</span>
        <span className="d-block fs-6 fw-semi-bold text-dark mt-1 text-truncate-2">{post.title}</span>
      </span>
    </Link>
  );
}

/**
 * End-of-article furniture: tags and share buttons, then previous/next posts.
 *
 * Share links are plain intent URLs — no SDK, no third-party script, nothing
 * loaded until the reader actually clicks. The template also showed a Behance
 * button, dropped here because a skincare article has no business being shared
 * to a design portfolio network.
 */
export default function PostFooterNav({
  title,
  url,
  tags,
  prev,
  next,
  children,
}: {
  title: string;
  url: string;
  tags: Tag[];
  prev: BlsPost | null;
  next: BlsPost | null;
  /** Rendered between the tags row and prev/next -- the author card sits here,
   *  so the reader meets who wrote it before being offered the next article. */
  children?: React.ReactNode;
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


  return (
    <div data-testid="post-footer-nav">
      <div className="border-top mt-5 mb-1" />
      <div className="d-flex flex-wrap gap-4 align-items-center justify-content-between mb-4 pt-3">
        <div className="d-flex flex-wrap align-items-center gap-2">
          {tags.map((t) =>
            t.href ? (
              <Link key={t.label} href={t.href} className="tag-item px-3">
                <span>{t.label}</span>
              </Link>
            ) : (
              <span key={t.label} className="tag-item px-3">
                <span className="text-capitalize">{t.label}</span>
              </span>
            ),
          )}
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="fs-7 text-600">Share:</span>
          <div className="d-inline-flex group-social-icons mt-0">
            {share.map((sh) => (
              <a key={sh.label} href={sh.href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${sh.label}`} className="icon-shape icon-46">
                <svg className="dark-mode-invert" viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden>
                  <path d={sh.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      {children}

      {(prev || next) && (
        <div className="row g-4 border-top mt-5 pt-4">
          <div className="col-sm-6">{prev && <Card post={prev} side="prev" />}</div>
          <div className="col-sm-6">{next && <Card post={next} side="next" />}</div>
        </div>
      )}
    </div>
  );
}
