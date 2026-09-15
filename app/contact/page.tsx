import Link from 'next/link';
import type { Metadata } from 'next';
import { SITE } from '@/lib/site';
import ContactForm from '@/components/ContactForm';
import Breadcrumb from '@/components/magzin/Breadcrumb';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: `Get in touch with the ${SITE.name} editorial team — story tips, partnership questions, corrections.`,
  alternates: { canonical: '/contact' },
};

const CONTACT_EMAIL = 'hello@bestlooking.skin';

/*
 * Magzin "Contact" layout, minus the template's map, street address, phone numbers and opening hours:
 * the site has none of those, so only the real inbox and the form are shown.
 */
export default function ContactPage() {
  return (
    <div data-testid="contact-page">
      <section className="sec-breadcumb">
        <div className="container">
          <Breadcrumb items={[{ label: 'Contact' }]} />
          <div className="row align-items-end">
            <div className="col-lg-8 col-12">
              <div className="title">
                <p className="bls-eyebrow mb-3">Contact</p>
                <h1 className="h3 mb-0">Get in touch.</h1>
                <p className="bls-page-lead mt-3 mb-0">
                  Story tips, partnership questions, corrections, or just hello — we read everything that
                  comes through. Pick the channel that fits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec-padding">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-5 col-12">
              <p className="bls-eyebrow mb-2">Send a message</p>
              <h2 className="h4 mb-3">Tell us what’s on your mind.</h2>
              <p>
                Fill in the form and we’ll get back to you. Your message goes straight to our
                editorial inbox so we can reply from the right place.
              </p>
              <p className="fs-7 text-600 mt-4 mb-0">
                Prefer email?{' '}
                <a href="mailto:hello@bestlooking.skin" className="bls-link fw-medium">
                  hello@bestlooking.skin
                </a>
              </p>
            </div>
            <div className="col-lg-7 col-12">
              <div className="bls-panel p-4 p-md-5">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-70">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 col-12 text-center mx-auto">
              <h2 className="h5 mb-2">Looking for something specific?</h2>
              <p className="mb-0">Browse the full archive or jump to a section.</p>
              <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
                <Link href="/" className="btn btn-dark bls-btn">
                  Home
                </Link>
                <Link href="/sitemap" className="btn bls-btn bls-btn-outline">
                  Site map
                </Link>
                <Link href="/about" className="btn bls-btn bls-btn-outline">
                  About us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
