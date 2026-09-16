# CLAUDE.md — bestlooking.skin

Context for working on this repo. Read this before making changes.

Last updated: 12 September 2026, from the full SEO/GEO/AEO audit.

---

## Start here — read the audit first

Before planning or changing anything on this site, read:

```
full-audit-bestlooking-skin-sep-2026.md
```

It sits alongside this file and contains the full findings, the evidence behind
each one, and the **live task register with Notion page IDs**. This file tells you
how the site works; that file tells you what is wrong with it and what is already
being tracked.

If a request maps to something in the audit, work from the audit's finding IDs
(C1–C4, H1–H6, M1–M7, L1–L5) rather than re-deriving the problem.

If the audit file is missing, say so rather than guessing — do not reconstruct
the task list from this file.

## Keeping Notion in sync

The audit's task register is live in the Notion Tasks database. Update it as work
lands, rather than leaving it to drift.

- **Data source:** `collection://3af007e8-eecb-80df-a2d1-000b6e65fcd0`
- **Project relation:** `https://app.notion.com/p/3b4007e8eecb81bcaea5c62d8099aea3`
- **Status values:** `Not started` · `Up next` · `In progress` · `Done`
- **Naming:** `P0 · <what>` — keep the priority prefix

**When you start a task**, set `Status` to `In progress`.

**When you finish one**, set `Status` to `Done` and append a short note to the task
page body: what changed, which files, and how it was verified.

**When you find something the audit missed**, create a new task in the same
database with the same naming convention and the project relation set. Add it to
the audit file's register too, with its new page ID.

### Rules

- **Update the existing task, never create a duplicate.** Look it up by page ID
  from the audit register first.
- **Never mark a task `Done` you have not verified.** Code merged is not the same
  as deployed and checked. If you changed the template but did not confirm the
  output on the live site, it is `In progress`.
- **Never delete a task.** If something is obsolete, set it to `Done` and say why
  in the body.
- **Leave the `Source` field blank.** It controls Google Tasks sync and setting it
  moves the task between accounts.
- **Do not reprioritise on your own.** The P0–P5 order encodes risk, not
  convenience. If you think something is misprioritised, say so rather than
  silently changing it.
- **Ask before bulk edits.** Updating one task as you complete it is routine;
  changing status on many at once is not.

---

## What this is

A skincare editorial and product-comparison site. Reviews, ingredient explainers,
comparison guides and a product catalogue. Monetised by affiliate links, not ads
(AdSense is not live yet — see **Monetisation**).

Operated by Kritin under FXN Holdings, as part of a multi-site portfolio that
shares one Strapi backend.

## Stack

| | |
|---|---|
| Repo | `xmpcross/strapi-bestlookingskin`, branch `main` |
| Framework | Next.js 15, **server-rendered** (not static export) |
| Host | Vercel |
| CMS | Shared FXN Strapi, read at request time |
| Media | `cms.fxnstudio.com/uploads/` |
| Canonical host | `https://www.bestlooking.skin` — **`www`, no trailing slash** |

### Environment variables

```
NEXT_PUBLIC_STRAPI_URL            CMS read at request time
STRAPI_API_TOKEN                  optional; /api/bls-* reads are public
NEXT_PUBLIC_SITE_URL              canonicals, sitemap, RSS, OpenGraph
NEXT_PUBLIC_GA_MEASUREMENT_ID     analytics, loaded only after consent
NEXT_PUBLIC_AMAZON_AFFILIATE_TAG  back-fills a tag onto untagged Amazon links
```

### Repo warning — read the name carefully

There are **two repos with near-identical names in the same account**:

| Repo | What it is |
|---|---|
| `xmpcross/strapi-bestlookingskin` | ✅ **The real source.** Next.js. Deploy from this. |
| `xmpcross/bestlooking.skin` | ❌ **HTML mirror.** Not a build. Retire it. |

The mirror is a page-by-page snapshot of the site committed as a folder. It is not
produced by a Next.js build — a real build emits `_next/static/`, and the mirror has
no `_next/` at all. Anything edited there (a verification meta tag, an affiliate
link) lives in generated output with no source behind it, so the next real deploy
silently drops it. It also preserved product pages Strapi could no longer produce,
which hid the fact that the catalogue had gone.

**Never commit to the mirror. Never treat it as source.** Check the repo name before
every push — `strapi-bestlookingskin` is source, `bestlooking.skin` is not.

If something appears live but is absent from source, the mirror is the likely cause.

Note: the Notion project page records the repo as `FXNHoldings/strapi-bestlookingskin`.
That is out of date. It is under `xmpcross`.

## Content model

Three Strapi collections:

- `bls-posts` — all editorial. **195 posts** across **20 categories**.
- `bls-categories` — **20** categories.
- `commerce-products` — **243 products** across 7 product categories.

`commerce-products` is a **shared pool** with nxt.bargains and nxt-sourcing.
This storefront renders only products tagged `bestlooking-skin`. If product
routes go empty, check the tag before assuming the code is broken — this has
happened before, and the filter was correct while the data had gone.

### Scheduled publishing

`showFrom` (datetime, on BLS · Post) is the release date. A post whose
`showFrom` is in the **future** is queued, not live. The gate is
`withPublishedGate()` in `lib/strapi.ts`, applied to every `bls-posts` query —
listings, `getPost`, adjacent posts, the sitemap and the RSS feed.

Strapi's own `publishedAt` is a system field, not editable in the admin, and
timed publishing is a paid Strapi feature — hence a field of our own.

- Queue a post by setting a future `showFrom` and clicking **Publish** as normal.
- It appears by itself within ~60s of that time (the cutoff is floored to the
  minute so the Next fetch cache still works).
- **`showFrom` empty = ordinary post**, visible immediately. That is why adding
  the field did not hide the existing corpus. Never backfill it.
- A queued post **404s on its own URL**. That is deliberate — a URL Google
  reaches early is a URL Google has already dated.
- Where `showFrom` is set it also becomes the post's displayed date, its
  Article `datePublished` and its RSS `pubDate` (`withReleaseDate`), so a
  cluster released over six weeks does not show six identical dates.
- `SHOW_SCHEDULED_POSTS=1` reveals the queue. Preview environments only, and
  never rename it to `NEXT_PUBLIC_*`.

Use this to space a cluster out over weeks rather than publishing it in one
burst. **Do not backdate posts to fake a publishing history** — Google dates a
URL from its own first crawl, so the claim contradicts its records, and the
usual result is that it stops trusting the site's dates. Posts migrated from
WordPress keep their real May 2026 dates; that is history, not backdating.

---

## The single most important thing to know

**This site has two content tiers, and they are not remotely equal.** Almost every
task in the backlog exists because of the gap between them.

| | Tier A — hubs | Tier B — legacy |
|---|---|---|
| Published | 11 Sep 2026 | 3 and 30 May 2026 |
| Count | 75 (15 hubs × 5) | 120 |
| Length | ~1,800 words | Bloated, repetitive |
| Author | Named, with bio + `/authors/{slug}` | None |
| Meta description | Unique per page | Site-wide boilerplate on all 120 |
| og:image | Yes | No |
| Images | Custom, on own CMS | Hotlinked from Amazon |
| Answer paragraph | Yes, under the H1 | No |
| Heading anchors | Clean slugs | `gspb_heading-id-gsbp-…` residue |
| Affiliate links | **None** | Dense, and stale |

**Tier A is the standard.** When writing or fixing anything, match it. Do not
match Tier B for consistency — Tier B is what is being fixed.

### Tier A hubs

Product-type: `/exfoliants` `/cleansers` `/eye-cream` `/face-masks` `/moisturizers`
`/serums` `/sunscreen`
Skin-concern: `/anti-aging` `/sensitive-skin` `/acne` `/hyperpigmentation`
Cross-cutting: `/routines` `/dupes` `/ingredients` `/korean-skincare`

### Tier B categories

`/product-comparisons` (15) `/product-reviews` (29) `/top-rated-products` (20)
`/how-to-guides` (27) `/informative-articles` (29)

---

## The post template (Tier A)

Reproduce this structure for any new or rewritten post:

1. Breadcrumb, then **byline with author link and date** above the H1
2. H1
3. One-sentence standfirst under the H1
4. Category tag, cover image, read time, table of contents
5. Affiliate disclosure callout
6. **A 40–60 word direct answer paragraph** — this is what wins featured
   snippets and gets cited by AI search. It is not optional.
7. Body with **question-phrased H2s** and clean anchor slugs
8. FAQ section — real questions, conversational answers
9. Author bio block

## Known-broken things

Do not reintroduce these. Several are actively being fixed.

- **CMS instruction leaking to production.** Product pages render
  `No key features yet — add them in Strapi → Commerce · Product → Specs → keyFeatures.`
  Empty states must render nothing, never editor guidance.
- **Product meta descriptions print the brand twice** —
  `The Ordinary The Ordinary Hyaluronic Acid 2% + B5`. Across all 243.
- **Product bodies are verbatim manufacturer copy.** 243 pages of duplicate
  content. The biggest indexation and AdSense risk on the site.
- **Legacy internal links use non-`www` with trailing slashes**, and some point
  at slugs that no longer exist. Use root-relative paths.
- **Read time is wrong on Tier B** — reports "2 min" for 2,000-word posts.
- **Homepage "Eye Care" and "Eye Cream" tiles link to `/categories/facial-cleansers`.**
- **Placeholder titles are live**: `Brand Xyz Vitamin C Face Mask Review`,
  `/product-reviews/face-serum`, `/informative-articles/sunscreen`.
- **`/about` renders two image placeholders** as literal text.
- **Taxonomy collision** — `/categories/moisturisers` (British) and `/moisturizers`
  (American) both exist and compete. Same for cleansers and serums.

---

## Monetisation rules

Read this before touching any outbound link.

### Amazon — do not add anything new

- Amazon Associates has **no qualifying sales**, so **PA-API access is blocked**.
- Without PA-API, hotlinking `m.media-amazon.com` images and displaying prices
  **breaches the Associates Operating Agreement**. Tier B does both, with prices
  frozen at **1 March 2024**.
- Legacy links carry the tag `unitradeco-20`, which is **not this brand's tag**.
- **Never add a new Amazon price or image widget.** Existing ones are being removed.

### Current approach

- **Takeads** is the primary layer. Geniuslink is being retired.
- The Takeads repoint in nxt-sourcing must land before any product re-import,
  or new links get minted on the retiring network.
- The 243 product pages currently link **unwrapped** to `theordinary.com`,
  `sephora.com` etc. — under an affiliate disclosure, earning nothing. Being fixed.
- iHerb sidebar widget is live, dated, and priced in AUD.
- `meta mitgo-verification` in the head is the Mitgo/Takeads verification tag.
  Do not remove it.

### The inversion to be aware of

Monetisation is currently **inverse to quality** — the 75 best posts have no
affiliate links, the 120 worst are densely monetised with stale data. When adding
links, add them to Tier A.

## AdSense

Not live. **Do not apply yet.** Open rejection triggers: duplicate product copy,
the CMS placeholder leak, placeholder titles, March 2024 prices, broken links,
off-topic content, no identifiable publisher, unfinished About page.

Already fine: complete legal set, disclosure above the fold, real IA, HTTPS,
mobile viewport, contact route.

## YMYL guardrails

This site discusses skin cancer, adapalene, tretinoin, oxybenzone, rosacea and
eczema. Google treats it as **Your Money or Your Life** content, held to a higher
evidential standard.

- **Never invent clinical claims.** If a claim needs a source, cite one —
  AAD, FDA, PubMed, or manufacturer technical data.
- The site currently has **zero outbound citations**. Adding them is the highest-
  leverage improvement available for AI-search visibility.
- Do not write in a voice that implies medical qualification the authors do not
  have. A reviewer layer is planned; until it exists, hedge honestly.
- `/about` names no human being. Until that is fixed, the site has no E-E-A-T
  foundation, and content work alone will not fix ranking.

---

## Conventions

- **Canonical host is `www`, no trailing slash.** Every internal link root-relative.
- **Meta descriptions are per-page, 150–160 chars.** Never fall back to the site
  default — that bug is why 29 posts still share one description. The code now
  derives one from the body (`descriptionFromBody` in `lib/format.ts`) before it
  will reach for `SITE.description`, but a written description beats a clipped
  opening paragraph every time.
- **Every post needs an author.** The `/authors/{slug}` system exists and works.
- **Every post needs `og:image` and `twitter:image`**, `summary_large_image`.
  `SITE.ogImage` (`public/og-default.jpg`, 1200×630) backstops any page without
  one, so the card is never empty — but a post-specific image is the point.
- **Cover images go on `cms.fxnstudio.com`**, never hotlinked from a merchant.
- **No years in titles.** Six posts still say "2024". Evergreen titles do not need
  re-editing every January.
- **Comparison posts get a comparison table.** Many `X vs Y` posts have none.
- **Stay on topic.** Skincare only. There is a COVID cloth-mask article and an
  insect-bite balm review in the corpus; do not add more.

## Before shipping

- Root-relative links, `www`, no trailing slash
- Unique meta description, `og:image` present
- Author assigned, byline rendering
- Direct-answer paragraph present on any explainer
- No merchant-hotlinked images
- No editor-facing empty states in the output
- Run the Rich Results Test if you touched a template

---

## Where things live

- **Audit — read this first** — `full-audit-bestlooking-skin-sep-2026.md`,
  alongside this file. Findings, evidence, and the task register with Notion page IDs.
- **Audit (Notion mirror)** — `Full Audit → Full Audit — bestlooking.skin (Sep 2026)`
- **Tasks** — Notion Tasks database, `collection://3af007e8-eecb-80df-a2d1-000b6e65fcd0`
- **Project record** — Notion, `Projects → 🧴 bestlooking.skin`.
  Parts of it are stale: it says the product catalogue is empty, posts number 120,
  and the repo owner is `FXNHoldings`. All three are wrong. Trust this file and the
  audit over it.

If the local audit file and the Notion page disagree, Notion is authoritative for
task status; the local file is authoritative for findings and evidence.

## Legal pages

`/legal/disclosure`, `/legal/privacy`, `/legal/cookies`, `/legal/terms` were **not
audited** — see section 5 of the audit file. The equivalent pages on the sibling
site nxtsmart.homes named the wrong company, the wrong country and the wrong
governing law, so assume the same defects here until verified.

**Do not fix legal pages by editing text.** A UK solicitor must review the
framework, not just swap the country name. Flag and stop.

## Scores at last audit

SEO 5/10 · GEO 4/10 · AEO 6/10

Not a low-quality site — a good site with 363 pages that have not caught up to
the 75 that set the standard.