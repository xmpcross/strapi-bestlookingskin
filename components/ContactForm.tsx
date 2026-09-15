'use client';

import { useState } from 'react';

const CONTACT_EMAIL = 'hello@bestlooking.skin';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setStatusMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await response.json().catch(() => ({ message: '' }));

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong. Please try again.');
      }

      setStatus('sent');
      setStatusMessage(data.message || 'Thanks, your message has been sent.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error) {
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bls-form"
      data-testid="contact-form"
      aria-label="Contact form"
    >
      <div className="row g-3">
        <div className="col-md-6 col-12">
          <Field label="Your name" id="contact-name" required>
            <input
              id="contact-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className={inputClass}
            />
          </Field>
        </div>
        <div className="col-md-6 col-12">
          <Field label="Email" id="contact-email" required>
            <input
              id="contact-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={inputClass}
            />
          </Field>
        </div>
        <div className="col-12">
          <Field label="Subject" id="contact-subject">
            <input
              id="contact-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What’s this about?"
              className={inputClass}
            />
          </Field>
        </div>
        <div className="col-12">
          <Field label="Message" id="contact-message" required>
            <textarea
              id="contact-message"
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us a bit more…"
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <div className="d-flex flex-wrap align-items-center gap-3 mt-4">
        <button
          type="submit"
          className="btn btn-dark bls-btn"
          disabled={status === 'sending' || !name || !email || !message}
        >
          {status === 'sending' ? 'Sending...' : 'Send message'}
        </button>
        {statusMessage && (
          <p
            className={`fs-7 mb-0 ${status === 'sent' ? 'text-dark' : 'bls-text-danger'}`}
            role="status"
          >
            {statusMessage}{' '}
            {status === 'error' && (
              <>
                You can also write to{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="bls-link fw-medium">
                  {CONTACT_EMAIL}
                </a>
                .
              </>
            )}
          </p>
        )}
      </div>
      <p className="fs-8 text-600 mt-4 mb-0">
        Your message is sent securely to our editorial inbox. Prefer email?{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="bls-link fw-medium">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </form>
  );
}

const inputClass = 'form-control';

function Field({
  label,
  id,
  required,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="d-block">
      <span className="d-block fs-7 fw-semi-bold text-dark mb-2">
        {label}
        {required && <span aria-hidden className="ms-1">*</span>}
      </span>
      {children}
    </label>
  );
}
