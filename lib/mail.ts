import nodemailer from 'nodemailer';

/* Form mail goes through the Google Workspace SMTP relay (smtp-relay.gmail.com:587),
   which accepts this host's IPs without a login. SMTP_USER/SMTP_PASS are optional:
   set them only for a server that wants a login. Stalwart was removed 4 Oct 2026. */
export const SMTP_HOST = process.env.SMTP_HOST || 'smtp-relay.gmail.com';

/* The relay only sends From an address on a domain in the Workspace account. */
export const MAIL_FROM = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER || 'contact@bestlooking.skin';
export const MAIL_TO = process.env.CONTACT_TO_EMAIL || 'contact@bestlooking.skin';

export function createMailTransport() {
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465, // never send form contents in clear text on 587
    ...(user && pass ? { auth: { user, pass } } : {}),
  });
}
