'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { AFFILIATE_LINKS_ENABLED, GENIUSLINK } from '@/lib/site';

/*
 * Geniuslink snippet: rewrites Amazon and Google Play links in the page to geni.us links on the account's tracking
 * id (GENIUSLINK in lib/site.ts). Retailers it does not handle (Walmart, Target...) are converted server-side from
 * data/geniuslink-links.json, and everything else by Takeads -- see lib/links.ts.
 *
 * Mounted before TakeadsConvertLink so Geniuslink claims its links first; neither rewrites a geni.us URL.
 * Affiliate tracking cookies, so it loads only with the "marketing" cookie consent (as GoogleAnalytics does for
 * analytics). The link domain is https, so converted links never downgrade the page.
 */
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

export default function GeniuslinkSnippet() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- consent lives in localStorage, read on mount.
    setAllowed(marketingAllowed());
    const onDecision = () => setAllowed(marketingAllowed());
    window.addEventListener('bestlooking:consent', onDecision);
    return () => window.removeEventListener('bestlooking:consent', onDecision);
  }, []);

  if (!AFFILIATE_LINKS_ENABLED || !allowed) return null;
  const { tsid, linkDomain } = GENIUSLINK;
  return (
    <Script
      id="geniuslink-snippet"
      src="https://geniuslinkcdn.com/snippet.min.js"
      strategy="afterInteractive"
      onLoad={() => {
        const g = (window as unknown as { Genius?: { amazon?: { convertLinks: (...a: unknown[]) => void }; google?: { convertLinks: (...a: unknown[]) => void } } }).Genius;
        g?.amazon?.convertLinks(tsid, true, linkDomain);
        g?.google?.convertLinks(tsid, false, linkDomain);
      }}
    />
  );
}
