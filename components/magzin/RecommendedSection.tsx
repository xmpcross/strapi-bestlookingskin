import Image from 'next/image';
import Link from 'next/link';
import type { PostCardData } from '@/lib/post-card';

type RecommendedSectionProps = {
  posts: PostCardData[];
  title?: string;
  viewMoreHref?: string;
};

export default function RecommendedSection({
  posts,
  title = 'Recommended',
  viewMoreHref = '/articles',
}: RecommendedSectionProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <section
      className="sec-7-home-2 sec-padding"
      style={{ backgroundImage: "url('/assets/imgs/page/bg-home2-sec7.png')" }}
      data-testid="home-recommended"
    >
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="d-flex align-items-center justify-content-between gap-3">
              <h2 className="mb-0 recommended-title">{title}</h2>
              <div className="d-none d-md-flex align-items-center">
                <Link href={viewMoreHref} className="view-more">
                  <span className="circle" aria-hidden="true">
                    <span className="icon arrow" />
                  </span>
                  <span className="button-text">View More</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4 g-4">
          {posts.map((card) => (
            <div className="card-recommend col-lg-3 col-md-6 col-12" key={card.key}>
              <Link href={card.href} className="d-block overflow-hidden rounded-16" aria-label={card.title}>
                {card.image ? (
                  <Image
                    className="rounded-16 overflow-hidden cover-image"
                    src={card.image}
                    alt={card.imageAlt || card.title}
                    width={276}
                    height={276}
                    sizes="(min-width: 992px) 25vw, (min-width: 768px) 50vw, 100vw"
                  />
                ) : (
                  <span className="rounded-16 d-block bg-100" style={{ aspectRatio: '1 / 1' }} aria-hidden />
                )}
              </Link>
              <Link href={card.href} className="card-title text-decoration-none">
                <h6 className="mb-0 mt-3 text-truncate-2">{card.title}</h6>
              </Link>
            </div>
          ))}
        </div>

        <div className="d-flex d-md-none justify-content-center mt-4">
          <Link href={viewMoreHref} className="view-more">
            <span className="circle" aria-hidden="true">
              <span className="icon arrow" />
            </span>
            <span className="button-text">View More</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
