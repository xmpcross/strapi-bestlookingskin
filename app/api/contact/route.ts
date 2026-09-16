import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const CONTACT_EMAIL = process.env.CONTACT_TO_EMAIL || 'notifications@bestlooking.skin';

type ContactPayload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

function clean(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

/**
 * A submitted value that is safe to place in a mail header.
 *
 * `clean` only trims the ends, so a CR or LF in the MIDDLE of a submitted
 * subject survived into the Subject header. That is the header-injection shape:
 * a newline ends the header, and whatever follows is read as headers of the
 * sender's choosing -- a Bcc, a forged Reply-To.
 *
 * Every character that can end or fold a header is collapsed to a space rather
 * than stripped, so two words cannot be silently glued into one. The message
 * body deliberately does NOT go through this: newlines belong there.
 */
function cleanHeader(value: unknown, maxLength: number) {
  return clean(value, maxLength)
    .replace(/[\r\n\t\v\f\u0085\u2028\u2029]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export async function POST(request: Request) {
  let payload: ContactPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Please submit the form again.' }, { status: 400 });
  }

  const name = clean(payload.name, 120);
  const email = clean(payload.email, 180).toLowerCase();
  /* `email` needs no header cleaning: isValidEmail below rejects any whitespace,
     newlines included, before it can reach replyTo. */
  const subject = cleanHeader(payload.subject, 160) || 'New contact form message';
  const message = clean(payload.message, 4000);

  if (!name || !email || !message) {
    return NextResponse.json({ message: 'Name, email and message are required.' }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ message: 'Please enter a valid email address.' }, { status: 400 });
  }

  try {
    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host: getRequiredEnv('SMTP_HOST'),
      port,
      secure: port === 465,
      auth: {
        user: getRequiredEnv('SMTP_USER'),
        pass: getRequiredEnv('SMTP_PASS'),
      },
    });

    await transporter.sendMail({
      from: process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER,
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `[BestLooking.Skin] ${subject}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Subject: ${subject}`,
        '',
        message,
      ].join('\n'),
    });

    return NextResponse.json({ message: 'Thanks, your message has been sent.' });
  } catch (error) {
    console.error('Contact form email failed:', error);
    return NextResponse.json(
      { message: 'The form is not ready yet. Please email hello@bestlooking.skin directly.' },
      { status: 500 },
    );
  }
}
