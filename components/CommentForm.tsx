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

  const field = 'mt-2 w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-[15px] text-ink placeholder:text-ink/35 focus:border-primary focus:outline-none';
  const label = 'text-[14px] font-semibold text-ink';

  return (
    <div className="mt-10" data-testid="comment-form">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-[14px] font-bold text-white transition hover:opacity-90"
      >
        Add a comment
        <svg
          viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
          aria-hidden className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-ink/10 bg-paper p-6 sm:p-8">
          <p className="font-display !text-[20px] font-bold text-ink">Leave a Reply</p>
          <p className="mt-2 text-[14px] leading-6 text-ink/55">
            Your email address will not be published. Comments are read by our editors before they
            appear. Required fields are marked <span className="text-primary">*</span>
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="c-name">Name <span className="text-primary">*</span></label>
              <input id="c-name" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Enter Your Name" className={field} autoComplete="name" />
            </div>
            <div>
              <label className={label} htmlFor="c-email">E-mail <span className="text-primary">*</span></label>
              <input id="c-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Your E-mail" className={field} autoComplete="email" />
            </div>
          </div>

          <div className="mt-5">
            <label className={label} htmlFor="c-message">Message <span className="text-primary">*</span></label>
            <textarea id="c-message" required rows={5} value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Your Message" className={field} />
          </div>

          <label className="mt-5 flex items-start gap-3 text-[14px] leading-6 text-ink/60">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-ink/30" />
            Save my name and e-mail in this browser for the next time I comment.
          </label>

          <button
            type="submit"
            disabled={state === 'sending'}
            className="mt-6 rounded-lg bg-primary px-5 py-3 text-[14px] font-bold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {state === 'sending' ? 'Sending…' : 'Submit Comment'}
          </button>

          {note && (
            <p role="status" className={`mt-4 text-[14px] ${state === 'error' ? 'text-red-600' : 'text-ink/70'}`}>
              {note}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
