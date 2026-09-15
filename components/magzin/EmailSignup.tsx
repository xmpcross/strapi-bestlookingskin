'use client';

import Link from 'next/link';
import { useState } from 'react';

/*
 * Email-only form for the home page's Newsletter and "Become an author" blocks. There is no mailing list or
 * author programme behind these yet, so a submission is emailed to the editors through /api/contact (SMTP),
 * and the confirmation says exactly that rather than claiming a subscription exists.
 */
const PURPOSE = {
  newsletter: {
    name: 'Newsletter sign-up',
    subject: 'Newsletter sign-up from the home page',
    message: 'Please email me when new BestLooking.Skin guides are published.',
    done: 'Thanks. Your address has been sent to our editors, who will email you when new guides are published.',
  },
  author: {
    name: 'Author enquiry',
    subject: 'Become an author: enquiry from the home page',
    message: 'I would like to write for BestLooking.Skin. Please get in touch.',
    done: 'Thanks. Your enquiry has been sent to our editors, who will reply by email.',
  },
} as const;

export default function EmailSignup({ purpose, button = 'Send', note }: { purpose: keyof typeof PURPOSE; button?: string; note?: boolean }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const cfg = PURPOSE[purpose];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cfg.name, email, subject: cfg.subject, message: cfg.message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'That did not send. Please try again.');
      setState('sent');
      setMessage(cfg.done);
      setEmail('');
    } catch (err) {
      setState('error');
      setMessage(err instanceof Error ? err.message : 'That did not send. Please try again.');
    }
  }

  const id = `signup-${purpose}`;
  return (
    <form onSubmit={onSubmit} className="position-relative" data-testid={`${purpose}-form`}>
      <div className="d-flex flex-wrap flex-md-nowrap gap-2 align-items-center mb-3">
        <label htmlFor={id} className="visually-hidden">
          Your email address
        </label>
        <input id={id} className="form-control" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" autoComplete="email" />
        <button className="btn btn-dark" type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : button}
        </button>
      </div>
      {note && (
        <p className="text-600 fs-8 mb-0">
          We only use your address to reply. See our{' '}
          <Link href="/legal/privacy" className="text-dark">
            Privacy Policy
          </Link>
          .
        </p>
      )}
      {message && (
        <p role="status" className={`fs-7 mt-2 mb-0 ${state === 'error' ? 'text-danger' : 'text-dark'}`}>
          {message}
        </p>
      )}
    </form>
  );
}
