import Link from 'next/link';
import type { PostCardData } from '@/lib/post-card';

/**
 * "Start here" banner on a hub (category) page, linking to the hub's pillar guide. Shown only when a post in the
 * category has post type Pillar, so a new pillar appears on its hub without a code change.
 */
export default function PillarBanner({ card, hubName }: { card: PostCardData; hubName: string }) {
  return (
    <section className="pillar-banner-wrap" data-testid="pillar-banner" aria-label={`Start here: the complete ${hubName} guide`}>
      <div className="container">
        <Link href={card.href} className={`pillar-banner${card.image ? '' : ' no-image'}`}>
          <div className="pillar-banner-text">
            <p className="pillar-banner-eyebrow">
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                <path d="M.58 11.73c8.21 1.74 9.67 3.13 11.55 11.01 1.68-7.86 3.1-9.24 11.27-10.91-8.21-1.74-9.67-3.13-11.54-11.01-1.68 7.86-3.11 9.24-11.28 10.91Z" fill="currentColor" />
              </svg>
              Start here · Complete guide
            </p>
            <h2 className="pillar-banner-title">{card.title}</h2>
            {card.excerpt && <p className="pillar-banner-excerpt">{card.excerpt}</p>}
            <div className="pillar-banner-foot">
              <span className="pillar-banner-cta">
                Read the guide
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </span>
              {(card.author || card.readMinutes) && (
                <span className="pillar-banner-meta">
                  {card.author ? card.author.name : ''}
                  {card.author && card.readMinutes ? ' · ' : ''}
                  {card.readMinutes ? `${card.readMinutes} min read` : ''}
                </span>
              )}
            </div>
          </div>
          {card.image && (
            <div className="pillar-banner-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.image} alt={card.title || 'Pillar guide banner'} width={640} height={400} loading="eager" />
            </div>
          )}
        </Link>
      </div>
    </section>
  );
}
