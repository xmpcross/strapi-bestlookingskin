'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

/*
 * Takeads ConvertLink: converts, in the browser, any retailer link that the prebuilt maps in lib/links.ts have not
 * covered yet (a new offer, a link added to a post). It only touches merchants in the Takeads catalogue and skips
 * links that already carry tracking (geni.us etc.), so it never re-wraps a Geniuslink or Takeads URL.
 *
 * It sets affiliate tracking cookies, so it loads only after the visitor allows the "marketing" category in the
 * cookie banner (same pattern as GoogleAnalytics). No NEXT_PUBLIC_TAKEADS_CONVERTLINK_URL = not loaded at all.
 */
const SRC = process.env.NEXT_PUBLIC_TAKEADS_CONVERTLINK_URL || '';
const STORAGE_KEY = 'bestlooking.consent.v1';

function marketingAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    return parsed?.version === 1 && parsed?.categories?.marketing === true;
  } catch {
    return false;
  }
}

export default function TakeadsConvertLink() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- consent lives in localStorage, read on mount.
    setAllowed(marketingAllowed());
    const onDecision = () => setAllowed(marketingAllowed());
    window.addEventListener('bestlooking:consent', onDecision);
    return () => window.removeEventListener('bestlooking:consent', onDecision);
  }, []);

  if (!SRC || !allowed) return null;
  return <Script id="takeads-convertlink" src={SRC} strategy="afterInteractive" />;
}
