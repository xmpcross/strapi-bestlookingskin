import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import '@/public/assets/css/vendors/bootstrap-grid.min.css';
import '@/public/assets/css/main.css';
import './magzin.css';
import './magzin-shop.css';
import './magzin-pages.css';
import SiteHeader from '@/components/magzin/SiteHeader';
import SiteFooter from '@/components/magzin/SiteFooter';
import BackToTop from '@/components/magzin/BackToTop';
import CookieConsent from '@/components/CookieConsent';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { SITE } from '@/lib/site';

// Magzin template (header style 2, Home 2 / Archive 3 / Single 3). Geist is self-hosted through the
// `geist` package — no next/font/google fetch, so the build stays offline-friendly and pageload makes
// zero requests to fonts.gstatic.com.

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  // Default title kept under 60 chars for SEO. The longer SITE.tagline is
  // still used in `description` and on-page copy where space allows.
  title: {
    default: `${SITE.name} — Honest Skincare Reviews & Guides`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  // A default image here means no page can ship a link preview with no picture;
  // pages with their own cover override it in their generateMetadata.
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    locale: 'en_US',
    images: [{ url: SITE.ogImage, width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: { card: 'summary_large_image', images: [SITE.ogImage] },
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
    <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
      <head>
        {/* Apply the saved light/dark theme before paint (Magzin's data-bs-theme switch). */}
        <script
          dangerouslySetInnerHTML={{
            __html: "try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-bs-theme',t)}catch(e){}",
          }}
        />
        {/* Impact.com site verification — verbatim <meta name=… value=…> tag.
            Using `value` (not Next's metadata `content`) exactly as Impact provides. */}
        <meta {...({ name: 'impact-site-verification', value: '5018c6dc-98d5-4dd1-84ac-32c80d7fd16f' } as Record<string, string>)} />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2867376862905050"
          crossOrigin="anonymous"
        />
      </head>
      <body className={GeistSans.className} data-testid="app-shell">
        <div id="top" />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <BackToTop />
        <CookieConsent />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
