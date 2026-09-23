# bestlooking.skin

Next.js 16 (App Router) frontend for the FXN Strapi CMS (`cms.fxnstudio.com`): skincare guides, product pages,
brand pages and a product catalogue. Repository: [`xmpcross/strapi-bestlookingskin`](https://github.com/xmpcross/strapi-bestlookingskin),
branch `main`.

```bash
npm ci
cp .env.example .env.local     # NEXT_PUBLIC_STRAPI_URL etc.; see "Environment variables"
npm run dev                    # http://localhost:3002
npm run build && npm run start
```

Node 22. **npm** is the package manager (`package-lock.json`); the stale `yarn.lock` was removed on 24 Sep 2026.

## Hosting and deployment

**Production runs on Netlify** (since 24 Sep 2026) — see [`NETLIFY.md`](NETLIFY.md) for setup, environment variables
and what differs from a server.

| To change | Do |
|---|---|
| Posts, products, categories, prices in Strapi | Nothing — pages revalidate from Strapi within 1–60 minutes |
| Code | Commit and `git push origin main`; Netlify builds and deploys (~2 min) |
| Generated covers (`public/cms-uploads/`, `data/generated-covers.json`) or affiliate link maps (`data/*.json`) | Generate on the server, commit, push |
| Environment variables | Netlify dashboard → then **Trigger deploy** (`NEXT_PUBLIC_*` are baked in at build time) |
| Roll back | Netlify → Deploys → pick a deploy → Publish |

`scripts/netlify-build.sh` fails the build if Strapi was unreachable (pages would otherwise be built from seed
content); Netlify then keeps the previous deploy live.

DNS is on Cloudflare: apex `A 75.2.60.5`, `www` CNAME `bestlooking-skin.netlify.app`. Keep both **DNS only** (grey
cloud): Netlify provides the CDN and TLS. `www.bestlooking.skin` is the primary domain; the apex redirects to it.

The previous host was the FXN `/opt` server (`next start` behind nginx, `./deploy.sh`); before that Vercel. The
server copy in `/opt/projects/bestlooking.skin` stays as the working checkout for the scripts below.

## Content

| Source | Collection | Notes |
|---|---|---|
| Strapi | `bls-posts`, `bls-categories`, `bls-authors` | ~197 guides in 15 topic hubs (grouped as By Product / By Concern / Routines & Ingredients) |
| Strapi | `commerce-products` (shared pool) | ~272 listed products; this site shows products related to site `bestlooking-skin` |

- Product pages carry rewritten editorial content (description, key features, how to use, good to know, FAQs) in
  the product's `specs` JSON, marked with `specs.contentSource`. The imported `shortDescription` (manufacturer copy)
  is ignored for those products (`ownShortDescription` in `lib/site.ts`).
- **Hyaluronic Acid** is an info-only category (`INFO_ONLY_CATEGORY_SLUGS`): 45 iHerb supplements, always listed,
  shown with product information, label data (supplement facts, directions, warnings) and the iHerb reference price
  marked "price subject to change" — no price comparison.
- Brand pages live at `/brands/<slug>` (`lib/brands.ts`: slugs, alias map for truncated brand names, intros in
  `data/brand-intros.json` — drafts, `reviewed: false`). Old `/brands/<Raw Name>` URLs 308 to the slug.
- Category and hub introductions come from the CMS `description` field (2 paragraphs; "Read more" after ~1.5 lines).

**Rules** (see `CLAUDE.md`): no invented facts — brand claims are attributed; legal pages are not edited without a
solicitor; never hotlink or re-add Amazon images/prices (no active Amazon Associates account).

## Monetisation

- **Google AdSense** — manual placements (`components/AdSlot.tsx`, slots in `lib/site.ts` `ADSENSE`).
- **Affiliate links** (`AFFILIATE_LINKS_ENABLED`) — every outbound retailer link goes through `lib/links.ts`:
  1. **Geniuslink** for Walmart (Impact), eBay (EPN), Target, Best Buy, Newegg — `data/geniuslink-links.json`
     (`scripts/fetch-geniuslink-links.mjs`);
  2. **Takeads** for other retailers — `data/takeads-links.json` (`scripts/fetch-takeads-links.mjs`,
     `TAKEADS_ENABLED=true`);
  3. otherwise the plain URL. Retailer links carry `rel="sponsored nofollow noopener"` (`SPONSORED_REL`).
  Browser fallbacks (Geniuslink snippet, Takeads ConvertLink) load only with marketing-cookie consent.
- Refresh both link maps weekly (new offers), then commit and push.
- Legacy WordPress affiliate markup in old posts (foreign Amazon tags, Amazon images, Content Egg boxes) is always
  stripped at render time (`lib/affiliate.ts`).
- `/legal/disclosure` still describes Amazon Associates and does not name Geniuslink/Takeads — flagged for review.

## Scripts (run on the server, not in the build)

| Script | Does |
|---|---|
| `scripts/seo-check.mjs` | Crawl the sitemap: status, canonical, one H1, JSON-LD, Review/rating checks, og:image |
| `scripts/generate-post-cover.mjs` | Generate post covers (catalogue composites or fal.ai), saved ≤1600px |
| `scripts/optimise-cms-uploads.mjs` | Shrink oversized images in `public/cms-uploads` (originals backed up) |
| `scripts/fetch-geniuslink-links.mjs`, `scripts/fetch-takeads-links.mjs` | Build the affiliate link maps |
| `scripts/fix-legacy-links.mjs`, `scripts/fix-dated-titles.mjs` | Content fixes in Strapi (dry run by default; write to Postgres, dates preserved) |
| `scripts/fetch-iherb-products.mjs` | Scrape an iHerb category (facts vs. manufacturer prose kept apart) |

Post and product content writes go straight to Postgres (`docker exec strapi-cms-postgres`) because a Strapi REST
update resets `publishedAt`. Every script backs up the rows it changes under `/opt/backups/`.

## Environment variables

Listed with what breaks without them in [`NETLIFY.md`](NETLIFY.md). Runtime: `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_STRAPI_URL`, `STRAPI_API_TOKEN`, `STRAPI_WRITE_TOKEN`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `SMTP_HOST`,
`SMTP_PORT` (465), `SMTP_USER`, `SMTP_PASS`, `CONTACT_TO_EMAIL`, `TAKEADS_ENABLED`,
`NEXT_PUBLIC_TAKEADS_CONVERTLINK_URL`. Script-only keys (Anthropic, fal, Geniuslink API, Takeads API, ZenRows) live
in the server's `.env.local` only.

## References

- `CLAUDE.md` — working rules for this repo.
- `full-audit-bestlooking-skin-sep-2026.md` — 12 Sep full audit and task register, incl. the 24 Sep Search Console
  audit outcome. Tasks live in Notion; update them rather than creating duplicates.
- The retired `xmpcross/bestlooking.skin` repo is an HTML mirror, not a build — never deploy from it.
