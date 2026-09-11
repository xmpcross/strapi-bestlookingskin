import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * Comment submissions.
 *
 * These are emailed to the site owner, not stored: bls-post has no comments
 * relation and there is no bls-comment content type, so there is nowhere to put
 * one. Adding those is a Strapi schema change and a rebuild, which takes every
 * site on this CMS down for the window -- worth doing deliberately rather than
 * as a side effect of adding a form.
 *
 * What matters is that nothing is silently dropped. The form tells the reader
 * their comment goes to the editors for review, which is exactly what happens,
 * and it fails loudly if the mail cannot be sent rather than showing a thank-you
 * over a discarded message.
 */
type Payload = { name?: string; email?: string; message?: string; postUrl?: string; postTitle?: string };

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const looksEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not configured`);
  return v;
}

export async function POST(request: Request) {
  let payload: Payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Please submit the form again.' }, { status: 400 });
  }

  const name = clean(payload.name, 80);
  const email = clean(payload.email, 180).toLowerCase();
  const message = clean(payload.message, 4000);
  const postTitle = clean(payload.postTitle, 200);
  const postUrl = clean(payload.postUrl, 300);

  if (!name || !email || !message) {
    return NextResponse.json({ message: 'Name, email and comment are all required.' }, { status: 400 });
  }
  if (!looksEmail(email)) {
    return NextResponse.json({ message: 'That email address does not look right.' }, { status: 400 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env('SMTP_HOST'),
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') },
    });

    await transporter.sendMail({
      from: process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER,
      to: process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER,
      replyTo: `${name} <${email}>`,
      subject: `New comment on: ${postTitle || postUrl || 'a post'}`,
      text: [
        `From: ${name} <${email}>`,
        postUrl ? `Post: ${postUrl}` : '',
        '',
        message,
      ].filter(Boolean).join('\n'),
    });
  } catch (error) {
    console.error('[comment] send failed', error);
    return NextResponse.json(
      { message: 'We could not send that just now. Please try again shortly.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ message: 'Thanks — your comment has been sent to our editors for review.' });
}
