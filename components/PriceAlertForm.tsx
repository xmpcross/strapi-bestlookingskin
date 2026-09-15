'use client';

import { useState } from 'react';

/**
 * Renders the "Buy For Best Price" + "Set Price Alert" button pair (equal size,
 * side by side) below the product price. Clicking "Set Price Alert" expands a
 * full-width form underneath; on submit we POST to /api/price-alert which stores
 * the alert in Strapi. The daily price-refresh cron emails the visitor (via
 * Brevo) when the live price reaches their target.
 */
export default function PriceAlertForm({
  productDocumentId,
  currency = 'USD',
  currentPrice,
  buyHref,
}: {
  productDocumentId?: string;
  currency?: string;
  currentPrice?: number;
  buyHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [target, setTarget] = useState(
    currentPrice ? String(Math.max(0, Math.floor(currentPrice * 0.9 * 100) / 100)) : '',
  );
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const symbol = currency === 'USD' ? '$' : '';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!productDocumentId) return;
    setState('sending');
    setMessage('');
    try {
      const res = await fetch('/api/price-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          productDocumentId,
          targetPrice: target,
          currency,
          currentPrice,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setState('done');
        setMessage(data.message || "Alert set — we'll email you when the price drops.");
      } else {
        setState('error');
        setMessage(data.message || 'Could not set the alert. Please try again.');
      }
    } catch {
      setState('error');
      setMessage('Could not set the alert. Please try again.');
    }
  }

  // Shared sizing so the two buttons are identical in width + height.
  const btnBase = 'btn shop-btn';
  const btnSize = { flex: '1 1 0', minWidth: 130 };

  return (
    <div className="mt-4">
      <div className="d-flex flex-wrap gap-2">
        {productDocumentId && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className={`${btnBase} shop-btn-outline`}
            style={btnSize}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Set Price Alert
          </button>
        )}
        {buyHref && (
          <a
            href={buyHref}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`${btnBase} btn-dark`}
            style={btnSize}
          >
            Buy For Best Price
          </a>
        )}
      </div>

      {state === 'done' ? (
        <div className="shop-success mt-3" role="status">
          {message}
        </div>
      ) : (
        open && productDocumentId && (
          <form onSubmit={submit} className="review-form mt-3 p-3">
            <p className="fs-7 fw-semi-bold text-dark mb-1">Get notified when the price drops</p>
            <p className="fs-8 text-600 mb-3">
              We&rsquo;ll email you once when this product reaches your target price.
            </p>
            <div className="d-flex flex-column flex-sm-row gap-2">
              <label htmlFor="price-alert-email" className="visually-hidden">Email address</label>
              <input
                id="price-alert-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                className="form-control shop-input mw-100 flex-grow-1"
                style={{ minWidth: 0 }}
              />
              <label htmlFor="price-alert-target" className="visually-hidden">Target price{symbol ? ` (${currency})` : ''}</label>
              <div className="form-control shop-input d-flex align-items-center gap-1" style={{ width: 'auto' }}>
                {symbol && <span className="fs-7 text-500" aria-hidden>{symbol}</span>}
                <input
                  id="price-alert-target"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="Target"
                  className="fs-7 border-0 bg-transparent"
                  style={{ width: '6rem', minWidth: 0, outline: 'none' }}
                />
              </div>
              <button
                type="submit"
                disabled={state === 'sending'}
                className="btn btn-dark shop-btn"
              >
                {state === 'sending' ? 'Saving…' : 'Notify me'}
              </button>
            </div>
            {state === 'error' && <p className="fs-8 shop-error mt-2 mb-0" role="alert">{message}</p>}
          </form>
        )
      )}
    </div>
  );
}
