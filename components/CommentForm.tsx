'use client';

import { useEffect, useState } from 'react';

const STORE_KEY = 'bls-commenter';

/**
 * "Add a comment" button that opens a reply form.
 *
 * The form posts to /api/comment, which emails the editors -- there is no
 * comments store on this CMS yet, so the success message says the comment has
 * been sent for review rather than implying it is now public. A form that says
 * "posted" and shows nothing would be the worst of the options.
 *
 * "Save my name and e-mail" writes to localStorage only, on this device. It is
 * a convenience, not an account, and nothing is sent anywhere until the reader
 * submits.
 */
export default function CommentForm({ postTitle, postUrl }: { postTitle: string; postUrl: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [remember, setRemember] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [note, setNote] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage exists only in the browser; reading it on mount avoids a hydration mismatch.
      if (saved?.name) { setName(saved.name); setEmail(saved.email || ''); setRemember(true); }
    } catch { /* storage unavailable or corrupt -- start blank */ }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    setNote('');
    try {
      const res = await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, postTitle, postUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'That did not send.');

      try {
        if (remember) localStorage.setItem(STORE_KEY, JSON.stringify({ name, email }));
        else localStorage.removeItem(STORE_KEY);
      } catch { /* non-fatal */ }

      setState('sent');
      setNote(data.message || 'Thanks — your comment has been sent for review.');
      setMessage('');
    } catch (err) {
      setState('error');
      setNote(err instanceof Error ? err.message : 'That did not send.');
    }
  }

  return (
    <div className="mt-5" data-testid="comment-form">
      <p className="comments-label mb-2">Comments</p>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="comments-toggle">
        Add a comment
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <form onSubmit={onSubmit} className="comment-form rounded-16 p-4 p-md-5 mt-4">
          <h2 className="h5 mb-2">Leave a comment</h2>
          <p className="fs-7 text-600 mb-4">
            Your email address will not be published. Comments are read by our editors before they appear. Required fields are marked *
          </p>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="fs-7 fw-semi-bold text-dark mb-2 d-block" htmlFor="c-name">Name *</label>
              <input id="c-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="form-control mw-100" autoComplete="name" />
            </div>
            <div className="col-md-6">
              <label className="fs-7 fw-semi-bold text-dark mb-2 d-block" htmlFor="c-email">Email *</label>
              <input id="c-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className="form-control mw-100" autoComplete="email" />
            </div>
            <div className="col-12">
              <label className="fs-7 fw-semi-bold text-dark mb-2 d-block" htmlFor="c-message">Comment *</label>
              <textarea id="c-message" required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your comment" className="form-control mw-100" />
            </div>
          </div>
          <label className="d-flex align-items-start gap-2 fs-7 text-600 mt-3">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="mt-1" />
            Save my name and email in this browser for the next time I comment.
          </label>
          <button type="submit" disabled={state === 'sending'} className="btn btn-dark mt-4">
            {state === 'sending' ? 'Sending…' : 'Send comment'}
          </button>
          {note && (
            <p role="status" className={`fs-7 mt-3 mb-0 ${state === 'error' ? 'text-danger' : 'text-600'}`}>
              {note}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
