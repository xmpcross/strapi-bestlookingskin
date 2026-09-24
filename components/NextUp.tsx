import Link from 'next/link';
import type { PostCardData } from '@/lib/post-card';
import PostShareButtons from './PostShareButtons';

/**
 * End-of-article block: "Next Up" related posts as pill cards, then the post's category, when it was last
 * updated, and share buttons. The reference design also showed view and comment counts and an "AI-generated"
 * badge; the site records neither counter, and the badge would be a disclosure claim, so none are shown.
 */
export default function NextUp({
  posts,
  category,
  updatedAt,
  updatedLabel,
  url,
  title,
}: {
  posts: PostCardData[];
  category: { name: string; href: string } | null;
  updatedAt: string;
  updatedLabel: string;
  url: string;
  title: string;
}) {
  const items = posts.filter((p) => p.image).slice(0, 4);
  return (
    <section className="next-up mt-5" aria-labelledby="next-up-title" data-testid="next-up">
      {items.length > 0 && (
        <>
          <h3 id="next-up-title" className="next-up-title mb-3">
            Next Up
          </h3>
          <ul className="next-up-list list-unstyled m-0 p-0">
            {items.map((p) => (
              <li key={p.key}>
                <Link href={p.href} className="next-up-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image as string} alt={p.title || 'Next article thumbnail'} width={48} height={48} loading="lazy" />
                  <span>{p.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="next-up-meta">
        {category && (
          <Link href={category.href} className="next-up-category">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M22 10 12 5 2 10l10 5 10-5Z" />
              <path d="M6 12v5c3 2 9 2 12 0v-5" />
            </svg>
            {category.name}
          </Link>
        )}
        <p className="next-up-updated m-0">
          Updated on <time dateTime={updatedAt}>{updatedLabel}</time>
        </p>
        <PostShareButtons url={url} title={title} />
      </div>
    </section>
  );
}
