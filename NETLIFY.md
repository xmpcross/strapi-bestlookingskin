# Deploying bestlooking.skin on Netlify

The site runs today on the /opt server (`next start` behind nginx, deployed with `./deploy.sh`). This repo is also
ready to build on Netlify. Nothing here changes the server deployment: the server ignores `netlify.toml`.

## What is set up in the repo

| File | Purpose |
|---|---|
| `netlify.toml` | Build command, Node 22, `/cms-uploads/*` cache header, apex → www redirect |
| `scripts/netlify-build.sh` | `yarn build`, then fails the build if Strapi was unreachable (same guard as `deploy.sh`). On Netlify a failed build leaves the previous deploy live |
| `next.config.mjs` → `outputFileTracingIncludes` | Bundles `data/*.json` (affiliate link maps, generated-cover manifest) into the server functions, which read them at runtime |
| `public/cms-uploads/`, `data/generated-covers.json` | Now committed (no longer gitignored), so the generated covers exist in a git-based build |

Netlify detects Next.js 16 and applies its Next.js runtime automatically (server rendering, ISR, API routes,
`next/image` via Netlify Image CDN). No plugin entry is needed.

## Setting up the Netlify site

1. **Add new site → Import from Git** → `xmpcross/strapi-bestlookingskin`, branch `main`. Base directory: repo root.
   Build command and publish directory come from `netlify.toml`.
2. **Environment variables** (Site configuration → Environment variables). Copy the values from the server's
   `.env.local`; never commit them. Scope: Builds + Functions + Runtime.

   | Variable | Needed for |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | Canonicals, sitemap, OG (`https://www.bestlooking.skin`) |
   | `NEXT_PUBLIC_STRAPI_URL` | CMS (`https://cms.fxnstudio.com`) |
   | `STRAPI_API_TOKEN` | CMS reads |
   | `STRAPI_WRITE_TOKEN` | Product reviews / price alerts API routes |
   | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_TO_EMAIL` (`CONTACT_FROM_EMAIL` optional) | Contact form via Stalwart (mail.fxnstudio.com:465) |
   | `TAKEADS_ENABLED`, `NEXT_PUBLIC_TAKEADS_CONVERTLINK_URL` | Takeads links + ConvertLink script |
   | `NEXT_PUBLIC_SITE_SLUG`, `NEXT_PUBLIC_SITE_PRODUCT_TAG`, `SHOW_SCHEDULED_POSTS` | Optional; defaults are right for production |

   `NEXT_PUBLIC_*` values are baked in at build time: change one → trigger a new deploy.
   Script-only keys (`ANTHROPIC_*`, `FAL_KEY`, `GENIUSLINK_*`, `TAKEADS_PUBLIC_KEY`, `ZENROWS_API_KEY`) are **not**
   needed on Netlify — those scripts keep running on the server.
3. **Deploy once on the Netlify subdomain** (`<site>.netlify.app`) and check it before touching DNS:
   `node scripts/seo-check.mjs --base https://<site>.netlify.app --limit 60` (canonicals will still point at www,
   which is correct), open a post, a product, a brand page, submit the contact form, and check that
   `/cms-uploads/…` images load.
4. **Domains:** add `www.bestlooking.skin` (primary) and `bestlooking.skin`. In Cloudflare, point `www` (CNAME) and
   the apex at Netlify and set the records to **DNS only** (grey cloud): Netlify runs its own CDN and TLS, and a
   proxied Cloudflare record in front of it causes cache and certificate problems.
5. Once live, stop the server's `bestlooking-skin` service only after a few days of clean traffic.

## What works differently on Netlify

| On the server today | On Netlify |
|---|---|
| New covers from `scripts/generate-post-cover.mjs` are live as soon as they are written | Commit `public/cms-uploads/` and `data/generated-covers.json`, push, and let Netlify deploy |
| Affiliate link maps (`data/geniuslink-links.json`, `data/takeads-links.json`) are re-read when the files change | Run the fetch scripts, commit the maps, push |
| `data/iherb-flash-deals.json` is written into this folder by nxt.discount's cron | Not in git and not needed: `lib/iherb-deals.ts` is not used by any page |
| `./deploy.sh` restarts the service | Every push to `main` deploys (each production deploy costs 15 Netlify credits) |
| Content scripts (`fix-legacy-links.mjs`, `fix-dated-titles.mjs`, product rewrites) write to Postgres via `docker exec` | Unchanged: they run on the server, not in the build |

## Cost note

Netlify's credit plans charge for bandwidth (20 credits/GB), requests (2 credits / 10k), function compute
(10 credits / GB-hour) and deploys (15 credits each). The Free plan (300 credits) is not enough for this site;
plan on Personal or Pro, and turn on auto-recharge or the site pauses when credits run out.
