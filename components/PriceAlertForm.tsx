'use client';

import { useState } from 'react';

/**
 * Price alert card under the product price: a bell, a one-line explanation and a "Set price alert" button that
 * expands the form (email + target price). On submit we POST to /api/price-alert, which stores the alert in Strapi;
 * the price-refresh job emails the visitor (via Brevo) when a refreshed price reaches their target. The buy button
 * lives in the offer panel, not here.
 */
export default function PriceAlertForm({
  productDocumentId,
  currency = 'USD',
  currentPrice,
}: {
  productDocumentId?: string;
  currency?: string;
  currentPrice?: number;
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

  const bell = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );

  return (
    <div className="price-alert-card mt-4" data-testid="price-alert">
      <div className="price-alert-head">
        <span className="price-alert-icon">{bell}</span>
        <div className="price-alert-copy">
          <p className="price-alert-title">Price alert</p>
          <p className="price-alert-text">Get one email when this product drops to your target price.</p>
        </div>
      </div>

      {state === 'done' ? (
        <div className="shop-success mt-3" role="status">
          {message}
        </div>
      ) : !open ? (
        productDocumentId && (
          <button type="button" onClick={() => setOpen(true)} aria-expanded={false} className="price-alert-toggle">
            {bell}
            Set price alert
          </button>
        )
      ) : (
        productDocumentId && (
          <form onSubmit={submit} className="price-alert-form">
            <label htmlFor="price-alert-email" className="price-alert-label">
              Email address
            </label>
            <input
              id="price-alert-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              className="form-control shop-input"
            />
            <label htmlFor="price-alert-target" className="price-alert-label">
              Target price{currency ? ` (${currency})` : ''}
            </label>
            <div className="d-flex gap-2">
              <div className="form-control shop-input d-flex align-items-center gap-1 flex-grow-1">
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
                  className="fs-7 border-0 bg-transparent w-100"
                  style={{ minWidth: 0, outline: 'none' }}
                />
              </div>
              <button type="submit" disabled={state === 'sending'} className="btn btn-dark shop-btn shop-btn-sm shop-btn-square">
                {state === 'sending' ? 'Saving…' : 'Notify me'}
              </button>
            </div>
            <button type="button" className="price-alert-cancel" onClick={() => setOpen(false)}>
              Cancel
            </button>
            {state === 'error' && <p className="fs-8 shop-error mt-2 mb-0" role="alert">{message}</p>}
          </form>
        )
      )}
    </div>
  );
}
