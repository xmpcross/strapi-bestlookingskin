# bestlooking.skin

Next.js 15 (App Router) frontend for the FXN Strapi CMS — skincare reviews,
comparisons, roundups and buying guides.

**This repository is the source of truth.** Build and deploy from here.

```bash
yarn install
cp .env.example .env.local     # set NEXT_PUBLIC_STRAPI_URL at minimum
yarn dev                       # http://localhost:3002
yarn build && yarn start
```

Node 22 (`nvm use 22`).

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

| Source | Content type | Status |
| --- | --- | --- |
| Strapi | `bls-posts` | 120 posts — healthy |
| Strapi | `bls-categories` | 5 categories — healthy |
| Strapi | `commerce-products` | **empty for this storefront** |

Editorial content is intact. Products are not.

`commerce-products` is a pool **shared** with nxt.bargains and nxt-sourcing.
This storefront shows only products tagged `bestlooking-skin`
(`SITE_PRODUCT_TAG` in `lib/strapi.ts`, overridable via
`NEXT_PUBLIC_SITE_PRODUCT_TAG`). As of August 2026 no product in the pool
carries that tag, and no skincare product remains in it under any tag — so the
product routes render empty. This is a data gap, not a code fault; the filter is
correct and needs no change.

To restore products, re-import them through `nxt-sourcing`
(`/opt/strapi-cms-git/backend/nxt-sourcing`), which already has a
`bestlooking-skin` storefront configured. Products tagged that way appear here
automatically.

**Before that re-import**, note that nxt-sourcing still wraps outbound links
with Geniuslink. That network is being retired in favour of Takeads across the
other properties, so importing now would mint links on the way out.

## Affiliate and verification

- AdSense publisher id is in `app/layout.tsx`; `public/ads.txt` declares it.
- Mitgo verification is in `metadata.verification.other`.
- `NEXT_PUBLIC_AMAZON_AFFILIATE_TAG` back-fills a tag onto Amazon links that
  arrive without one.

## Deployment

Server-rendered: it reads Strapi at request time and uses `next/image` with
remote patterns, so it needs a Next.js runtime — not a static host. **Vercel**
is the fit, alongside nxtsmart.homes, which is the same stack.

The CMS must be publicly reachable from wherever this runs; the site has no
content without it.
