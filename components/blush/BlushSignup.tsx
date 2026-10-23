'use client';

import { useState } from 'react';
import { b } from '@/lib/blush';

/**
 * Email-only newsletter form. There is no mailing list behind it yet, so a submission is emailed to the editors
 * through /api/contact (SMTP), and the confirmation says exactly that rather than claiming a subscription.
 */
export default function BlushSignup() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setState('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Newsletter sign-up',
          email,
          subject: 'Newsletter sign-up from the home page',
          message: 'Please email me when new BestLooking.Skin guides are published.',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'That did not send. Please try again.');
      setState('sent');
      setMessage('Thanks. Your address has been sent to our editors, who will email you when new guides are published.');
      setEmail('');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'That did not send. Please try again.');
    }
  }

  return (
    <form className={b('subscribe-form cta__form')} onSubmit={onSubmit} data-testid="newsletter-form">
      <div className={b('field')}>
        <label className={b('sr-only')} htmlFor="bl-signup-email">
          Your email address
        </label>
        <input
          id="bl-signup-email"
          className={b('field__input')}
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button type="submit" className={b('btn')} disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Send'}
        </button>
      </div>
      <p className={b('form-note')} role="status">
        {message || 'You’ll only hear from us when new guides are published, no spam.'}
      </p>
    </form>
  );
}
