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
              <h4 className="mb-0 ds-4">{title}</h4>
              <div className="justify-content-between align-items-center gap-3 d-none d-md-flex">
                <Link href={viewMoreHref} className="view-more">
                  <span className="circle" aria-hidden="true">
                    <span className="icon arrow" />
                  </span>
                  <span className="button-text">View More</span>
                </Link>
                <div className="block-author d-none d-lg-flex align-items-center">
                  <div className="avatar avatar-64 rounded-circle overflow-hidden border-3 border-white z-5">
                    <Image
                      src="/assets/imgs/template/author/author-11.png"
                      alt="Contributor"
                      width={64}
                      height={64}
                    />
                  </div>
                  <div className="avatar avatar-64 rounded-circle overflow-hidden border-3 border-white z-4">
                    <Image
                      src="/assets/imgs/template/author/author-12.png"
                      alt="Contributor"
                      width={64}
                      height={64}
                    />
                  </div>
                  <div className="avatar avatar-64 rounded-circle overflow-hidden border-3 border-white z-3">
                    <Image
                      src="/assets/imgs/template/author/author-13.png"
                      alt="Contributor"
                      width={64}
                      height={64}
                    />
                  </div>
                  <div className="avatar avatar-64 rounded-circle overflow-hidden border-3 border-white z-1">
                    <Image
                      src="/assets/imgs/template/author/author-14.png"
                      alt="Contributor"
                      width={64}
                      height={64}
                    />
                  </div>
                  <div className="avatar avatar-64 rounded-circle overflow-hidden border-3 border-white z-0">
                    <Image
                      src="/assets/imgs/template/author/author-15.png"
                      alt="Contributor"
                      width={64}
                      height={64}
                    />
                  </div>
                </div>
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
