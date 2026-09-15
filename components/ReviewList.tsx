import type { ProductReview } from '@/lib/strapi';

function Stars({ rating }: { rating: number }) {
  const pct = (Math.max(0, Math.min(5, rating)) / 5) * 100;
  return (
    <span aria-label={`${rating} out of 5 stars`} className="d-inline-flex align-items-center gap-2">
      <span className="shop-stars fs-7">
        <span className="shop-star-off">★★★★★</span>
        <span className="shop-star-fill shop-star-on" style={{ width: `${pct}%` }}>
          ★★★★★
        </span>
      </span>
      <span className="fs-8 fw-semi-bold text-600">{rating.toFixed(1)}</span>
    </span>
  );
}

/** Approved first-party reviews as a responsive card grid. */
export default function ReviewList({ reviews }: { reviews: ProductReview[] }) {
  if (!reviews.length) {
    return <p className="text-600">No written reviews yet — be the first to review this product.</p>;
  }

  return (
    <ul className="row g-3 list-unstyled ps-0 mb-0">
      {reviews.map((r) => (
        <li key={r.id} className="col-sm-6 col-12">
          <div className="review-card d-flex flex-column h-100 p-4">
            <div className="d-flex align-items-center justify-content-between gap-3">
              <Stars rating={r.rating} />
              <span className="fs-8 text-500">
                {r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                  : ''}
              </span>
            </div>
            {r.title && <p className="fs-7 fw-semi-bold text-dark mt-3 mb-0">{r.title}</p>}
            <p className="review-body fs-7 mt-2 mb-0">{r.body}</p>
            <p className="fs-8 fw-medium text-600 mt-3 mb-0">— {r.authorName}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
