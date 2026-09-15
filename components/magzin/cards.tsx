import Image from 'next/image';
import Link from 'next/link';
import type { PostCardData } from '@/lib/post-card';
import { ArrowRightIcon } from './icons';

/*
 * Magzin article cards, fed by real post data. The template's comment/view counters, bookmark buttons and
 * video play buttons are left out: none of them exist on this site.
 */

const Corner = ({ href, label, className = '' }: { href: string; label: string; className?: string }) => (
  <div className={`card-corner ${className}`}>
    <Link href={href} className="arrow-box" aria-label={`Read: ${label}`}>
      <ArrowRightIcon size={24} />
    </Link>
    <div className="curve-one" />
    <div className="curve-two" />
  </div>
);

const Cover = ({ card, width, height, className = 'cover-image', sizes }: { card: PostCardData; width: number; height: number; className?: string; sizes: string }) =>
  card.image ? (
    <Image src={card.image} alt={card.imageAlt} className={className} width={width} height={height} sizes={sizes} />
  ) : (
    <span className={`${className} d-block bg-100`} style={{ aspectRatio: `${width} / ${height}` }} aria-hidden />
  );

const Badge = ({ card, className = '' }: { card: PostCardData; className?: string }) =>
  card.category ? (
    <Link href={card.category.href} className={`badge ${card.badgeTone} fs-8 ${className}`}>
      {card.category.name}
    </Link>
  ) : null;

export const Avatar = ({ name, src, size = 41 }: { name: string; src: string | null; size?: number }) =>
  src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="avatar avatar-md rounded-circle" src={src} alt="" width={size} height={size} />
  ) : (
    <span className="avatar avatar-md rounded-circle d-inline-flex align-items-center justify-content-center bg-2 fs-8 fw-semi-bold text-dark" style={{ width: size, height: size }} aria-hidden>
      {name
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()}
    </span>
  );

const Meta = ({ card, withAuthor = true }: { card: PostCardData; withAuthor?: boolean }) => (
  <div className="bottom mt-auto d-flex flex-wrap align-items-center gap-2 pt-4">
    {withAuthor && card.author && (
      <Link href={card.author.href} className="author d-flex align-items-center gap-2">
        <Avatar name={card.author.name} src={card.author.avatar} />
        <span className="fs-7 text-dark fw-regular">{card.author.name}</span>
      </Link>
    )}
    <ul className="d-flex align-items-center gap-4 text-600 m-0 ps-3">
      {card.date && (
        <li>
          <p className="fs-8 m-0">{card.date}</p>
        </li>
      )}
      {card.readMinutes && (
        <li>
          <p className="fs-8 m-0">{card.readMinutes} min read</p>
        </li>
      )}
    </ul>
  </div>
);

/* card-11: large feature with image, title, excerpt and byline. */
export function FeatureCard({ card, priority = false }: { card: PostCardData; priority?: boolean }) {
  return (
    <article className="article card-11">
      <div className="card-img-top thumbnail">
        <Link href={card.href}>
          {card.image ? <Image src={card.image} alt={card.imageAlt} className="cover-image" width={640} height={420} sizes="(min-width: 992px) 50vw, 100vw" priority={priority} /> : <Cover card={card} width={640} height={420} sizes="50vw" />}
        </Link>
        <Badge card={card} />
      </div>
      <div className="card-body">
        <Corner href={card.href} label={card.title} />
        <div className="left pe-5">
          <Link href={card.href}>
            <h2 className="h5 card-title mb-0 text-truncate-2">{card.title}</h2>
          </Link>
          {card.excerpt && <p className="card-text text-600 fs-7 mb-0 mt-4 text-truncate-2">{card.excerpt}</p>}
          <Meta card={card} />
        </div>
      </div>
    </article>
  );
}

/* card-1: large image with the text panel overlapping its lower edge (Magzin home 2, "For you"). */
export function OverlapCard({ card }: { card: PostCardData }) {
  return (
    <article className="article card-1">
      <div className="card-img-top thumbnail position-relative">
        <Link href={card.href}>
          <Cover card={card} width={700} height={540} sizes="(min-width: 992px) 50vw, 100vw" />
        </Link>
        {card.category && (
          <Link href={card.category.href} className={`badge ${card.badgeTone} fs-8 position-absolute top-0 start-0 m-3`}>
            {card.category.name}
          </Link>
        )}
      </div>
      <div className="card-body position-relative">
        <Corner href={card.href} label={card.title} />
        <div className="left">
          <Link href={card.href}>
            <h3 className="h5 card-title mb-0">{card.title}</h3>
          </Link>
          {card.excerpt && <p className="card-text text-600 fs-7 mb-0 mt-4 text-truncate-3">{card.excerpt}</p>}
          <Meta card={card} />
        </div>
      </div>
    </article>
  );
}

/* card-5: square image tile with a corner arrow and title below. */
export function TileCard({ card, corner = '' }: { card: PostCardData; corner?: string }) {
  return (
    <article className="article card-5">
      <div className="post-link">
        <div className="position-relative card-img-top thumbnail">
          <Link href={card.href}>
            <Cover card={card} width={300} height={300} sizes="(min-width: 992px) 25vw, 50vw" />
          </Link>
          <Badge card={card} />
        </div>
        <Corner href={card.href} label={card.title} className={`${corner} no-border`} />
      </div>
      <div className="card-body mt-4">
        <Link href={card.href}>
          <h3 className="h6 card-title mb-0">{card.title}</h3>
        </Link>
      </div>
    </article>
  );
}

/* card-7: text-led card (badge, title, image, excerpt), used in sliders. */
export function TextCard({ card }: { card: PostCardData }) {
  return (
    <article className="article card-7">
      <div className="card-body">
        <Corner href={card.href} label={card.title} />
        <div className="d-flex flex-column">
          <div className="card-info d-flex flex-wrap align-items-center gap-2 mb-3">
            <Badge card={card} />
            {card.readMinutes && (
              <ul className="d-flex align-items-center text-600 m-0 ps-3">
                <li>
                  <p className="fs-8 m-0">{card.readMinutes} min read</p>
                </li>
              </ul>
            )}
          </div>
          <Link href={card.href}>
            <h3 className="h6 card-title mb-4">{card.title}</h3>
          </Link>
          <div className="position-relative card-img">
            <Link href={card.href}>
              <Cover card={card} width={420} height={280} className="rounded-16 overflow-hidden cover-image" sizes="(min-width: 1200px) 25vw, (min-width: 768px) 40vw, 90vw" />
            </Link>
          </div>
          {card.excerpt && <p className="card-text text-600 fs-7 mb-0 mt-4 pe-5 text-truncate-3">{card.excerpt}</p>}
        </div>
      </div>
    </article>
  );
}

/* card-6: bordered row with a square thumbnail, title, date and read time (official Magzin home 2 rows). */
export function RowCard({ card }: { card: PostCardData }) {
  return (
    <article className="article card-6 card-6-row">
      <Link href={card.href} className="thumbnail overflow-hidden">
        <Cover card={card} width={216} height={216} className="" sizes="108px" />
      </Link>
      <div className="card-body">
        <Link href={card.href}>
          <h3 className="card-title mb-2">{card.title}</h3>
        </Link>
        <ul className="card-6-meta d-flex align-items-center m-0 ps-0">
          {card.date && <li>{card.date}</li>}
          {card.readMinutes && <li>{card.readMinutes} min read</li>}
        </ul>
      </div>
    </article>
  );
}

/* card-12: wide list card with image left. */
export function WideCard({ card }: { card: PostCardData }) {
  return (
    <article className="article card-12 d-flex flex-md-row align-items-stretch flex-column">
      <Link href={card.href} className="card-img-top position-relative">
        <Cover card={card} width={520} height={520} className="cover-image thumbnail" sizes="(min-width: 768px) 35vw, 100vw" />
      </Link>
      <div className="card-body">
        <Corner href={card.href} label={card.title} />
        <div className="left">
          <Badge card={card} />
          <Link href={card.href}>
            <h3 className="h4 card-title mb-0 mt-3 text-truncate-2">{card.title}</h3>
          </Link>
          {card.excerpt && <p className="card-text text-600 fs-7 mb-0 mt-3 text-truncate-3">{card.excerpt}</p>}
          <Meta card={card} />
        </div>
      </div>
    </article>
  );
}

/* card-recommend: image and title, for formats and hubs. */
export function ImageLinkCard({ href, title, image, alt }: { href: string; title: string; image: string | null; alt: string }) {
  return (
    <div className="card-recommend">
      <Link href={href}>
        {image ? <Image className="rounded-16 overflow-hidden cover-image" src={image} alt={alt} width={300} height={300} sizes="(min-width: 992px) 20vw, 50vw" /> : <span className="rounded-16 d-block bg-100" style={{ aspectRatio: '1' }} aria-hidden />}
      </Link>
      <Link href={href} className="card-title">
        <h3 className="h6 mb-0 mt-3">{title}</h3>
      </Link>
    </div>
  );
}

/* category-card style-2: a hub chip over its newest cover image. */
export function CategoryChip({ href, name, image, count }: { href: string; name: string; image: string | null; count?: number }) {
  return (
    <div className="category-card style-2 w-100" style={image ? { backgroundImage: `linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.35)), url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
      <div className="post-content text-center">
        <Link href={href}>
          <span className="h6 mb-0 changeless text-white d-block">{name}</span>
        </Link>
        {typeof count === 'number' && count > 0 && (
          <span className="post-count fs-8">
            {count} {count === 1 ? 'post' : 'posts'}
          </span>
        )}
      </div>
    </div>
  );
}

/* Magzin section title with the four-point star and an optional "View more" link. */
export function SectionTitle({ title, description, href, dark = false, as: Tag = 'h2' }: { title: string; description?: string; href?: string; dark?: boolean; as?: 'h2' | 'h3' }) {
  return (
    <div className={`section-title ${dark ? 'dark' : ''} d-flex align-items-center justify-content-between flex-wrap gap-3`}>
      <div className="d-flex">
        <div className="d-flex align-items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M0.582044 11.7285C8.79451 13.4712 10.252 14.8614 12.125 22.7372C13.8067 14.8768 15.2308 13.4992 23.4018 11.8279C15.1894 10.0852 13.7319 8.69503 11.8589 0.81924C10.1769 8.67956 8.75306 10.0571 0.582044 11.7285Z" fill={dark ? '#fff' : '#0E0E0F'} />
          </svg>
          <Tag className="h5 mb-0">{title}</Tag>
        </div>
        {description && <p className="fs-7 ms-3 mb-2 d-none d-lg-block">{description}</p>}
      </div>
      {href && (
        <div className="d-none d-md-block">
          <Link href={href} className={`view-more ${dark ? 'white' : ''}`}>
            <span className="circle" aria-hidden="true">
              <span className="icon arrow" />
            </span>
            <span className="button-text">View more</span>
          </Link>
        </div>
      )}
    </div>
  );
}
