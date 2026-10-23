import Link from 'next/link';
import type { PostCardData } from '@/lib/post-card';
import { b } from '@/lib/blush';
import { Icon } from './Icon';
import { CategoryTag, DateMeta, MediaCard, PostBrief, PostCard } from './cards';
import ScrollRow from './ScrollRow';
import BlushSignup from './BlushSignup';

/** The opening: one large lead story, three stacked beside it, then a strip of four short ones. */
export function HomeCover({ posts, strip }: { posts: PostCardData[]; strip: PostCardData[] }) {
  const [lead, ...side] = posts;
  if (!lead) return null;
  return (
    <>
      <section className={b('container cover')} aria-label="Top stories">
        <article className={b('cover__lead')}>
          <div className={b('cover__lead-media')}>
            {lead.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lead.image} alt="" fetchPriority="high" decoding="async" width={1280} height={720} />
            )}
          </div>
          <div className={b('cover__lead-scrim')} aria-hidden="true" />
          <div className={b('cover__lead-body')}>
            {lead.category && <CategoryTag category={lead.category} glass />}
            <h2 className={b('cover__lead-title')}>
              <Link href={lead.href}>{lead.title}</Link>
            </h2>
            {lead.excerpt && <p className={b('cover__lead-excerpt')}>{lead.excerpt}</p>}
            <DateMeta card={lead} className={b('meta--onDark')} />
          </div>
        </article>

        <div className={b('cover__stack')}>
          {side.slice(0, 3).map((card) => (
            <article key={card.key} className={b('cover__item')}>
              <div className={b('cover__item-media')}>
                {card.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.image} alt="" decoding="async" width={480} height={480} />
                )}
              </div>
              <Link className={b('hit')} href={card.href} aria-label={card.title} />
              <div className={b('cover__item-body')}>
                {card.category && <CategoryTag category={card.category} />}
                <h3 className={b('cover__item-title')}>{card.title}</h3>
                <DateMeta card={card} />
              </div>
            </article>
          ))}
        </div>
      </section>

      {strip.length > 0 && (
        <div className={b('container homelede')}>
          <div className={b('lede-strip')}>
            {strip.map((card) => (
              <article key={card.key} className={b('lede')}>
                <div className={b('lede__media')}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {card.image && <img src={card.image} alt="" loading="lazy" decoding="async" width={168} height={168} />}
                </div>
                <Link className={b('hit')} href={card.href} aria-label={card.title} />
                <div className={b('lede__body')}>
                  <DateMeta card={card} />
                  <h3 className={b('txt-h4 lede__title line-clamp-2')}>{card.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/** A scrolling row of post cards. */
export function GuideRail({ cards, title, id, href, linkLabel }: { cards: PostCardData[]; title: string; id: string; href?: string; linkLabel?: string }) {
  if (!cards.length) return null;
  return (
    <ScrollRow title={title} id={id} href={href} linkLabel={linkLabel} trackClass="rail__track" wrapperClass="rail">
      {cards.map((card) => (
        <PostCard key={card.key} card={card} />
      ))}
    </ScrollRow>
  );
}

export type SliderProduct = { slug: string; name: string; image: string; alt: string; category: string };

/** "Latest products": the newest products in the shop, picture, name and category. No price is shown. */
export function ProductSlider({ products }: { products: SliderProduct[] }) {
  if (!products.length) return null;
  return (
    <ScrollRow title="Latest products" id="home-products" href="/products" linkLabel="All products" trackClass="pslider__track" wrapperClass="pslider">
      {products.map((product) => (
        <div key={product.slug} className={b('pslider__slide')}>
          <article className={b('pcard')}>
            <div className={b('pcard__media')}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.image} alt={product.alt} width={500} height={500} loading="lazy" decoding="async" />
            </div>
            <div className={b('pcard__body')}>
              {product.category && <p className={b('label txt-dim pcard__cat')}>{product.category}</p>}
              <h3 className={b('pcard__name')}>
                <Link className={b('pcard__link')} href={`/products/${product.slug}`}>
                  {product.name}
                </Link>
              </h3>
              <span className={b('pcard__cta')}>
                View product
                <Icon name="arrow-right" size={14} />
              </span>
            </div>
          </article>
        </div>
      ))}
    </ScrollRow>
  );
}

/** One large card with three beside it. */
export function EditorSpotlight({ cards }: { cards: PostCardData[] }) {
  const [lead, ...list] = cards;
  if (!lead) return null;
  return (
    <div className={b('spotlight')}>
      <PostCard card={lead} className={b('card--lead')} showExcerpt />
      <div className={b('spotlight__list')}>
        {list.slice(0, 3).map((card) => (
          <MediaCard key={card.key} card={card} />
        ))}
      </div>
    </div>
  );
}

/** Head to head: the newest comparison as a panel, the next few in a row below it. */
export function HeadToHead({ cards }: { cards: PostCardData[] }) {
  const [lead, ...rest] = cards;
  if (!lead) return null;
  return (
    <div className={b('verdicts')}>
      <article className={b('verdict-lead')}>
        <div className={b('verdict-lead__media')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {lead.image && <img src={lead.image} alt="" loading="lazy" decoding="async" width={960} height={720} />}
        </div>
        <Link className={b('hit')} href={lead.href} aria-label={lead.title} />
        <div className={b('verdict-lead__body')}>
          {lead.category && <p className={b('label txt-dim')}>{lead.category.name}</p>}
          <h3 className={b('txt-h2 verdict-lead__title')}>{lead.title}</h3>
          {lead.excerpt && <p className={b('txt-m txt-dim line-clamp-4')}>{lead.excerpt}</p>}
          <span className={b('section-link verdict-lead__more')}>
            Read the comparison
            <Icon name="arrow-right" size={14} />
          </span>
        </div>
      </article>
      {rest.length > 0 && (
        <div className={b('verdict-list')}>
          {rest.slice(0, 4).map((card) => (
            <article key={card.key} className={b('verdict-row')}>
              <span className={b('verdict-row__thumb')}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {card.image && <img src={card.image} alt="" loading="lazy" decoding="async" width={136} height={136} />}
              </span>
              <Link className={b('hit')} href={card.href} aria-label={card.title} />
              <div className={b('verdict-row__body')}>
                {card.category && <p className={b('label txt-dim')}>{card.category.name}</p>}
                <h3 className={b('txt-h5 verdict-row__title')}>{card.title}</h3>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export type StandardsItem = { figure: string; label: string; note: string };

/** "How we work": figures counted from the site's own content, on a dark band. */
export function StandardsBand({ eyebrow, title, intro, items }: { eyebrow: string; title: string; intro: string; items: StandardsItem[] }) {
  if (!items.length) return null;
  return (
    <section className={b('standards')} aria-labelledby="home-standards">
      <div className={b('container standards__inner')}>
        <div className={b('standards__lead')}>
          <p className={b('label standards__eyebrow')}>{eyebrow}</p>
          <h2 className={b('txt-h2')} id="home-standards">
            {title}
          </h2>
          <p className={b('txt-m standards__intro')}>{intro}</p>
          <Link className={b('section-link')} href="/about">
            How we work
            <Icon name="arrow-right" size={14} />
          </Link>
        </div>
        <dl className={b('standards__grid')}>
          {items.map((item) => (
            <div key={item.label} className={b('standards__item')}>
              <dt className={b('txt-s standards__label')}>{item.label}</dt>
              <dd className={b('standards__figure nums')}>{item.figure}</dd>
              <dd className={b('txt-xs standards__note')}>{item.note}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** Three columns: a card over short entries. */
export function HighlightColumns({ groups }: { groups: PostCardData[][] }) {
  if (!groups.length) return null;
  return (
    <div className={b('highlights')}>
      {groups.map((group, index) => (
        <div key={index} className={b('highlights__col')}>
          {group.map((card, position) =>
            position === 0 ? <PostCard key={card.key} card={card} eager={index === 0} /> : <PostBrief key={card.key} card={card} />,
          )}
        </div>
      ))}
    </div>
  );
}

export type TopicTile = { label: string; href: string; image: string | null; count: number };

/** The topic tiles: a picture each, the name, and how many guides it holds. */
export function TopicTiles({ topics }: { topics: TopicTile[] }) {
  if (!topics.length) return null;
  return (
    <div className={b('sections-row')}>
      {topics.map((topic) => (
        <Link key={topic.href} href={topic.href} className={b('section-card')}>
          {topic.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={topic.image} alt="" loading="lazy" decoding="async" width={640} height={800} />
          )}
          <span className={b('section-card__scrim')} aria-hidden="true" />
          <span className={b('section-card__body')}>
            <span className={b('txt-h4 section-card__name')}>{topic.label}</span>
            <span className={b('section-card__reveal')}>
              <span className={b('txt-s section-card__blurb')}>{topic.count} guides</span>
              <span className={b('label section-card__more')}>
                Browse the topic
                <Icon name="arrow-right" size={14} />
              </span>
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

/** The closing panel: the newsletter signup. */
export function CtaPanel() {
  return (
    <section className={b('cta')} aria-labelledby="home-cta-title">
      <h2 className={b('txt-h2 cta__title')} id="home-cta-title">
        Subscribe to our newsletter and get new guides by email
      </h2>
      <p className={b('txt-m cta__body')}>Honest skincare guides, comparisons and ingredient explainers, sent when they are published.</p>
      <BlushSignup />
    </section>
  );
}
