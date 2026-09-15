'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'bestlooking.consent.v1';

type ConsentCategory = 'essential' | 'analytics' | 'marketing';

type ConsentState = {
  version: 1;
  decidedAt: string;
  categories: Record<ConsentCategory, boolean>;
};

type View = 'banner' | 'settings';

const ALL_OFF: ConsentState['categories'] = { essential: true, analytics: false, marketing: false };
const ALL_ON: ConsentState['categories'] = { essential: true, analytics: true, marketing: true };

function readStoredConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed?.version === 1) return parsed;
    return null;
  } catch {
    return null;
  }
}

function persistConsent(categories: ConsentState['categories']) {
  const payload: ConsentState = {
    version: 1,
    decidedAt: new Date().toISOString(),
    categories,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* private mode / disabled storage — fall through silently */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bestlooking:consent', { detail: payload }));
  }
}

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('banner');
  const [categories, setCategories] = useState<ConsentState['categories']>(ALL_OFF);

  useEffect(() => {
    const existing = readStoredConsent();
    if (!existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- stored consent is browser-only, read once on mount.
      setOpen(true);
      setView('banner');
    } else {
      setCategories(existing.categories);
    }

    const onReopen = () => {
      const cur = readStoredConsent();
      if (cur) setCategories(cur.categories);
      setView('settings');
      setOpen(true);
    };
    window.addEventListener('bestlooking:consent:reopen', onReopen);
    return () => window.removeEventListener('bestlooking:consent:reopen', onReopen);
  }, []);

  if (!open) return null;

  const acceptAll = () => {
    persistConsent(ALL_ON);
    setCategories(ALL_ON);
    setOpen(false);
  };
  const rejectAll = () => {
    persistConsent(ALL_OFF);
    setCategories(ALL_OFF);
    setOpen(false);
  };
  const saveChoices = () => {
    const next = { ...categories, essential: true };
    persistConsent(next);
    setOpen(false);
  };
  const toggle = (key: ConsentCategory) => {
    if (key === 'essential') return;
    setCategories((c) => ({ ...c, [key]: !c[key] }));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      className="bls-cookie"
      data-testid="cookie-consent"
    >
      <div className="bls-cookie-panel">
        {view === 'banner' ? (
          <div className="d-flex flex-column flex-md-row align-items-md-center gap-3">
            <div className="flex-grow-1">
              <p id="cookie-consent-title" className="fw-semi-bold text-dark">We use cookies</p>
              <p className="bls-cookie-muted mt-1">
                BestLooking.Skin uses essential cookies to run the site. With your permission we may also use cookies for analytics and personalised advertising.
                Read our <Link href="/legal/cookies">Cookie Policy</Link> for details.
              </p>
            </div>
            <div className="bls-cookie-actions d-flex flex-wrap flex-md-nowrap align-items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setView('settings')}
                className="btn bls-btn-sm bls-btn-outline"
                data-testid="cookie-consent-settings"
              >
                Settings
              </button>
              <button
                type="button"
                onClick={rejectAll}
                className="btn bls-btn-sm bls-btn-outline"
                data-testid="cookie-consent-reject"
              >
                Reject all
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="btn btn-dark bls-btn-sm"
                data-testid="cookie-consent-accept"
              >
                Accept all
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="d-flex align-items-start justify-content-between gap-3">
              <div>
                <p id="cookie-consent-title" className="fw-semi-bold text-dark">Cookie settings</p>
                <p className="bls-cookie-muted mt-1">
                  Choose which categories of cookies you allow. You can change these any time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setView('banner')}
                className="bls-cookie-back flex-shrink-0"
                aria-label="Back"
              >
                Back
              </button>
            </div>

            <ul className="list-unstyled d-flex flex-column gap-2 m-0 mt-3 p-0">
              <li className="bls-cookie-option d-flex align-items-start justify-content-between gap-3">
                <div>
                  <p className="fw-medium text-dark">Essential</p>
                  <p className="bls-cookie-muted mt-1">Required for the site to function (security, navigation, consent storage). Always on.</p>
                </div>
                <input
                  type="checkbox"
                  checked
                  disabled
                  aria-label="Essential cookies (required)"
                />
              </li>
              <li className="bls-cookie-option d-flex align-items-start justify-content-between gap-3">
                <div>
                  <p className="fw-medium text-dark">Analytics</p>
                  <p className="bls-cookie-muted mt-1">Help us understand how readers use the site so we can improve content and navigation.</p>
                </div>
                <input
                  type="checkbox"
                  checked={categories.analytics}
                  onChange={() => toggle('analytics')}
                  aria-label="Analytics cookies"
                  data-testid="cookie-consent-analytics"
                />
              </li>
              <li className="bls-cookie-option d-flex align-items-start justify-content-between gap-3">
                <div>
                  <p className="fw-medium text-dark">Advertising / Personalisation</p>
                  <p className="bls-cookie-muted mt-1">Used by ad partners (including Google AdSense) to show more relevant advertising and measure performance.</p>
                </div>
                <input
                  type="checkbox"
                  checked={categories.marketing}
                  onChange={() => toggle('marketing')}
                  aria-label="Advertising cookies"
                  data-testid="cookie-consent-marketing"
                />
              </li>
            </ul>

            <div className="bls-cookie-actions d-flex flex-wrap align-items-center justify-content-end gap-2 mt-3">
              <button
                type="button"
                onClick={rejectAll}
                className="btn bls-btn-sm bls-btn-outline"
              >
                Reject all
              </button>
              <button
                type="button"
                onClick={saveChoices}
                className="btn btn-dark bls-btn-sm"
                data-testid="cookie-consent-save"
              >
                Save choices
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="btn btn-dark bls-btn-sm"
              >
                Accept all
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Tiny button you can drop in any footer/legal page so users can re-open consent settings. */
export function CookieSettingsButton({ className }: { className?: string }) {
  const cls = className ?? 'hover-dark';
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('bestlooking:consent:reopen'));
        }
      }}
      className={cls}
      data-testid="cookie-consent-reopen"
    >
      Cookie settings
    </button>
  );
}
