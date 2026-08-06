import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { SITE } from '@/lib/site';

// Fonts are self-hosted via @font-face in globals.css (public/fonts/InterVariable*.woff2).
// No next/font/google fetch — keeps the build offline-friendly and lands the
// font on our own origin so pageload makes zero requests to fonts.gstatic.com.

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  // Default title kept under 60 chars for SEO. The longer SITE.tagline is
  // still used in `description` and on-page copy where space allows.
  title: {
    default: `${SITE.name} — Honest Skincare Reviews & Guides`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: { type: 'website', siteName: SITE.name, locale: 'en_US' },
  twitter: { card: 'summary_large_image' },
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': [{ url: '/feed.xml', title: `${SITE.name} RSS` }],
    },
  },
  verification: {
    other: {
      // Mitgo (Takeads' parent) site verification. Lives here rather than in
      // hand-edited HTML so it survives every rebuild — the previous copy was
      // written into the exported artifact and would have been lost.
      'mitgo-verification': '0bd5a870-e07e-4d99-bd70-2897813fd88b',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Impact.com site verification — verbatim <meta name=… value=…> tag.
            Using `value` (not Next's metadata `content`) exactly as Impact provides. */}
        <meta {...({ name: 'impact-site-verification', value: '5018c6dc-98d5-4dd1-84ac-32c80d7fd16f' } as Record<string, string>)} />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2867376862905050"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans" data-testid="app-shell">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieConsent />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
