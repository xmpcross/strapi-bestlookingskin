'use client';

import { useState } from 'react';

/**
 * First-party review submission form. Posts to /api/review which stores the
 * review in Strapi as `pending`; it appears in the Reviews tab once an admin
 * approves it. Placed below the in-article ad on the product page.
 */
export default function ReviewForm({ productDocumentId }: { productDocumentId: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [authorName, setAuthorName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setState('error');
      setMessage('Please choose a star rating.');
      return;
    }
    setState('sending');
    setMessage('');
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productDocumentId, authorName, email, title, body, rating }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setState('done');
        setMessage(data.message || 'Thanks! Your review will appear once approved.');
      } else {
        setState('error');
        setMessage(data.message || 'Could not submit your review. Please try again.');
      }
    } catch {
      setState('error');
      setMessage('Could not submit your review. Please try again.');
    }
  }

  if (state === 'done') {
    return (
      <div className="shop-success mt-4" role="status">
        {message}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="review-form mt-4 p-4">
      <h3 className="h6 mb-1">Write a review</h3>
      <p className="fs-7 text-600 mb-0">Share your experience to help other shoppers.</p>

      {/* Star picker */}
      <div className="d-flex align-items-center gap-1 mt-3" role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="review-star-btn"
          >
            <span className={(hover || rating) >= n ? 'shop-star-on' : 'shop-star-off'}>★</span>
          </button>
        ))}
      </div>

      <div className="row g-3 mt-1">
        <div className="col-sm-6 col-lg-12 col-12">
          <label htmlFor="review-name" className="fs-8 fw-semi-bold text-dark mb-1 d-block">Name *</label>
          <input
            id="review-name"
            type="text"
            required
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className="form-control shop-input mw-100"
          />
        </div>
        <div className="col-sm-6 col-lg-12 col-12">
          <label htmlFor="review-email" className="fs-8 fw-semi-bold text-dark mb-1 d-block">Email</label>
          <input
            id="review-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional, not shown)"
            autoComplete="email"
            className="form-control shop-input mw-100"
          />
        </div>
        <div className="col-12">
          <label htmlFor="review-title" className="fs-8 fw-semi-bold text-dark mb-1 d-block">Review title</label>
          <input
            id="review-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Review title (optional)"
            className="form-control shop-input mw-100"
          />
        </div>
        <div className="col-12">
          <label htmlFor="review-body" className="fs-8 fw-semi-bold text-dark mb-1 d-block">Review *</label>
          <textarea
            id="review-body"
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What did you think of this product?"
            rows={4}
            className="form-control shop-input mw-100"
          />
        </div>
      </div>

      {state === 'error' && <p className="fs-8 shop-error mt-2 mb-0" role="alert">{message}</p>}

      <button
        type="submit"
        disabled={state === 'sending'}
        className="btn btn-dark shop-btn mt-3"
      >
        {state === 'sending' ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  );
}
