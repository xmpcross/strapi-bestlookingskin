# bestlooking.skin

Next.js 16 (App Router) frontend for the FXN Strapi CMS — skincare reviews,
comparisons, roundups and buying guides.

**This repository is the source of truth.** Build and deploy from here.

```bash
yarn install
cp .env.example .env.local     # set NEXT_PUBLIC_STRAPI_URL at minimum
yarn dev                       # http://localhost:3002
yarn build && yarn start
```

Node 22 (`nvm use 22`).

> **Lockfiles:** both `package-lock.json` and `yarn.lock` are currently
> committed, and the installed `node_modules` was produced by npm
> (`node_modules/.package-lock.json` is present, `.yarn-integrity` is not).
> Pick one package manager, delete the other lockfile, and add a
> `packageManager` field to `package.json` — otherwise the build platform picks
> for you and local and CI can resolve different trees.

## Read this before editing the live site

For a period this site was served from a **static HTML mirror** — a page-by-page
snapshot of the running site, committed to `xmpcross/bestlooking.skin` and
published as a folder. It was not produced by this repository: a Next.js build
always emits `_next/static/`, and the mirror had no `_next/` at all.

That mirror is retired. It caused two problems worth remembering:

- Anything edited in it (a verification meta tag, an affiliate link) lived in
  generated output with no source, so the next regeneration would silently drop
  it. The Mitgo tag now lives in `app/layout.tsx` metadata for exactly this
  reason.
- It preserved product pages that Strapi can no longer produce, which hid the
  fact that the catalogue had gone (see below).

## Content

Figures below are from the live crawl of 12 September 2026
(`full-audit-bestlooking-skin-sep-2026.md`), not from the CMS admin.

| Source | Content type | Status |
| --- | --- | --- |
| Strapi | `bls-posts` | ~195 posts across 20 categories |
| Strapi | `bls-categories` | 20 categories |
| Strapi | `commerce-products` | 243 products live, prices refreshed 11 Sep 2026 |

Posts split into two tiers that need handling differently:

- **Tier A — 75 hub posts** (15 hubs × 5), published 11 Sep 2026. Named author,
  unique meta description, own cover image, answer paragraph under the H1.
  **This is the standard.** Match it.
- **Tier B — 120 legacy posts**, published May 2026. No author, site-wide
  boilerplate meta description, no `og:image`, hotlinked Amazon images, stale
  2024 prices. Rewrite, consolidate or prune — do not match.

`commerce-products` is a pool **shared** with nxt.bargains and nxt-sourcing.
This storefront shows only products tagged `bestlooking-skin`
(`SITE_PRODUCT_TAG` in `lib/strapi.ts`, overridable via
`NEXT_PUBLIC_SITE_PRODUCT_TAG`).

> An earlier version of this file said the product catalogue was empty and the
> product routes rendered nothing. That was true in August 2026 and was fixed by
> the re-import; it is no longer the case. The open work on products is
> **monetisation** (their outbound links are unwrapped) and **originality**
> (their bodies are verbatim manufacturer copy), not availability.

Note that nxt-sourcing may still wrap outbound links with Geniuslink. That
network is being retired in favour of Takeads across the other properties, so
check before re-importing.

## Audit

`full-audit-bestlooking-skin-sep-2026.md` is the working reference: findings,
evidence and the task register (tasks live in Notion; update them rather than
creating duplicates). Scores at the time of audit — SEO 5/10, GEO 4/10,
AEO 6/10.

Its four `/legal/*` findings carry a standing instruction: **do not fix legal
pages by editing text.** A solicitor must review the framework, not just the
country name.

## Affiliate and verification

- AdSense publisher id is in `app/layout.tsx`; `public/ads.txt` declares it.
- Mitgo verification is in `metadata.verification.other`.
- Impact.com verification is a literal `<meta name … value …>` tag in the
  `<head>` — it uses `value`, not `content`, exactly as Impact provides it.
- `NEXT_PUBLIC_AMAZON_AFFILIATE_TAG` back-fills a tag onto Amazon links that
  arrive without one.

## Deployment

Hosted on **Vercel**, built from `main` on push. Repository:
[`xmpcross/strapi-bestlookingskin`](https://github.com/xmpcross/strapi-bestlookingskin).

Server-rendered: it reads Strapi at request time and uses `next/image` with
remote patterns, so it needs a Next.js runtime rather than a static host. The
retired HTML mirror made this look like a static site; it never was.

### Environment variables

Set in the Vercel project, not committed:

```text
NEXT_PUBLIC_STRAPI_URL           CMS read at request time
STRAPI_API_TOKEN                 optional; /api/bls-* reads are public
STRAPI_WRITE_TOKEN               price-drop alerts; see PRICE_ALERTS.md
NEXT_PUBLIC_SITE_URL             canonicals, sitemap, RSS, OpenGraph
NEXT_PUBLIC_GA_MEASUREMENT_ID    analytics, loaded only after consent
NEXT_PUBLIC_AMAZON_AFFILIATE_TAG back-fills a tag onto untagged Amazon links
SMTP_HOST / PORT / USER / PASS   contact form delivery
CONTACT_TO_EMAIL                 contact form recipient
CONTACT_FROM_EMAIL               contact form envelope sender
```

### The CMS is a runtime dependency

Content is fetched per request, so **the site has no content if Strapi is
unreachable**. That server is a separate machine from the one Vercel runs on.
