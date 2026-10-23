import Link from 'next/link';
import type { PostCardData } from '@/lib/post-card';
import { b } from '@/lib/blush';
import { Icon } from './Icon';

type Heading = 'h2' | 'h3' | 'h4';

/** The section tag: a pale rose pill (or a smoked one on a photograph). */
export function CategoryTag({ category, glass = false, linked = true }: { category: { name: string; href: string }; glass?: boolean; linked?: boolean }) {
  const cls = b(`tag${glass ? ' tag--glass' : ''}`);
  return linked ? (
    <Link className={cls} href={category.href}>
      {category.name}
    </Link>
  ) : (
    <span className={cls}>{category.name}</span>
  );
}

/** The credit line used throughout the front page: the date alone. */
export function DateMeta({ card, className = '' }: { card: PostCardData; className?: string }) {
  return (
    <div className={`${b('meta meta--inline')} ${className}`.trim()}>
      <p className={b('meta__facts meta__facts--ruled')}>
        <span>{card.date}</span>
      </p>
    </div>
  );
}

/** The workhorse card: 4:3 cover with the tag on it, headline, date. */
export function PostCard({
  card,
  eager = false,
  showExcerpt = false,
  headingLevel = 'h3',
  className = '',
}: {
  card: PostCardData;
  eager?: boolean;
  showExcerpt?: boolean;
  headingLevel?: Heading;
  className?: string;
}) {
  const H = headingLevel;
  return (
    <article className={`${b('card zoom-host')} ${className}`.trim()}>
      <div className={b('media media--card')}>
        {card.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.image} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" width={640} height={480} />
        )}
        {card.category && (
          <div className={b('media-badges')}>
            <CategoryTag category={card.category} glass />
          </div>
        )}
      </div>
      <Link className={b('hit')} href={card.href} aria-label={card.title} />
      <div className={b('card__body')}>
        <H className={b('txt-h3 card__title')}>{card.title}</H>
        {showExcerpt && card.excerpt && <p className={b('txt-s txt-dim line-clamp-2')}>{card.excerpt}</p>}
        <DateMeta card={card} className={b('card__meta')} />
      </div>
    </article>
  );
}

/** Thumbnail beside the headline and standfirst. */
export function MediaCard({ card, headingLevel = 'h3' }: { card: PostCardData; headingLevel?: Heading }) {
  const H = headingLevel;
  return (
    <article className={b('card-media')}>
      <div className={b('card-media__media')}>
        {card.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.image} alt="" loading="lazy" decoding="async" width={480} height={360} />
        )}
        {card.category && (
          <span className={b('card-media__tag')}>
            <CategoryTag category={card.category} glass linked={false} />
          </span>
        )}
      </div>
      <Link className={b('hit')} href={card.href} aria-label={card.title} />
      <div className={b('card-media__body')}>
        <H className={b('txt-h3 card-media__title')}>{card.title}</H>
        {card.excerpt && <p className={b('txt-s txt-dim line-clamp-2 card-media__excerpt')}>{card.excerpt}</p>}
        <DateMeta card={card} />
      </div>
    </article>
  );
}

/** A headline and date with no picture: the short entries under a card. */
export function PostBrief({ card, headingLevel = 'h3' }: { card: PostCardData; headingLevel?: Heading }) {
  const H = headingLevel;
  return (
    <article className={b('brief')}>
      <DateMeta card={card} />
      <Link className={b('hit')} href={card.href} aria-label={card.title} />
      <H className={b('txt-h4 brief__title')}>{card.title}</H>
    </article>
  );
}

/** Section heading with an optional "view all" link. */
export function SectionHeader({ title, id, href, linkLabel = 'View all', count }: { title: string; id?: string; href?: string; linkLabel?: string; count?: string }) {
  return (
    <div className={b('section-head')}>
      <div className={b('section-head__bar')}>
        <h2 className={b('section-head__name')} id={id}>
          {title}
          {count && <span className={b('section-head__count txt-dim')}> {count}</span>}
        </h2>
        {href && (
          <Link className={b('section-link')} href={href}>
            {linkLabel}
            <Icon name="arrow-right" size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}
