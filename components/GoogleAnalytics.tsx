'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

/**
 * GA4, gated on the visitor's analytics consent.
 *
 * Google's instructions say to paste the tag into every page's <head>, but this
 * site asks for consent by category and analytics defaults to off. Loading
 * gtag regardless would collect from visitors who declined and make the banner
 * meaningless, so nothing is requested from googletagmanager.com until consent
 * exists.
 *
 * Consent lives in localStorage under the key CookieConsent writes, and that
 * component already dispatches `bestlooking:consent` whenever a decision is
 * made — so this picks up an acceptance immediately rather than only on the
 * next page load.
 */
const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';
const STORAGE_KEY = 'bestlooking.consent.v1';

function analyticsAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed?.version === 1 && parsed?.categories?.analytics === true;
  } catch {
    return false;
  }
}

export default function GoogleAnalytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    // Read on mount rather than during render: localStorage does not exist
    // during the server pass, and reading it in render would desynchronise
    // hydration.
    setAllowed(analyticsAllowed());

    const onDecision = () => setAllowed(analyticsAllowed());
    window.addEventListener('bestlooking:consent', onDecision);
    return () => window.removeEventListener('bestlooking:consent', onDecision);
  }, []);

  if (!MEASUREMENT_ID || !allowed) return null;

  return (
    <>
      <Script
        id="ga4-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
