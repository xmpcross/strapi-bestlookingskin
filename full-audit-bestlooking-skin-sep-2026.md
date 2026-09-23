# bestlooking.skin — Full Audit, September 2026

Working reference for agents. Findings, evidence, and the live task register.

- **Audited:** 12 September 2026
- **Method:** live crawl of production (7 pages in full, complete URL inventory from `/sitemap`) plus the Notion project record
- **Scores:** SEO 5/10 · GEO 4/10 · AEO 6/10
- **Notion audit page:** https://app.notion.com/p/3d9007e8eecb8103bb28f4723c084e2c

---

## 1. The core finding

Two content tiers wearing one skin. Almost every task exists because of the gap
between them.

| | Tier A — hubs | Tier B — legacy |
|---|---|---|
| Count | 75 (15 hubs × 5) | 120 |
| Published | 11 Sep 2026 | 3 and 30 May 2026 |
| Length | ~1,800 words (9 min) | Bloated, repetitive, mislabelled "2 min" |
| Author | Named, bio + `/authors/{slug}` | None |
| Meta description | Unique per page | Site-wide boilerplate on all 120 |
| og:image | Yes | No |
| Images | Custom, own CMS | Hotlinked from Amazon |
| Answer paragraph | Yes, under the H1 | No |
| Heading anchors | Clean slugs | `gspb_heading-id-gsbp-…` residue |
| Affiliate links | **None** | Dense, and stale |

Underneath both sit **243 product pages** whose bodies are verbatim manufacturer
copy, whose meta descriptions are the brand name printed twice, and which leak a
CMS editor instruction into public HTML.

**Tier A is the standard.** Match it. Never match Tier B for consistency.

**Monetisation is inverse to quality.** The 75 best posts carry no affiliate
links; the 120 worst are densely monetised with 2024 prices; the 243 product
pages link out completely unwrapped under an affiliate disclosure.

---

## 2. Findings by severity

### Critical

| ID | Finding | Evidence |
|---|---|---|
| C1 | CMS instruction leaking to public HTML | Product pages render *"No key features yet — add them in Strapi → Commerce · Product → Specs → keyFeatures."* |
| C2 | 243 product pages reproduce manufacturer copy verbatim | Sampled page carries The Ordinary's own PDP text word for word |
| C3 | Amazon blocks non-compliant and priced March 2024 | "Amazon price updated: March 1, 2024"; hotlinked `m.media-amazon.com`; PA-API blocked |
| C4 | No named author, credentials or reviewer on YMYL content | `/about` names no human being; content covers skin cancer, adapalene, tretinoin |

### High

| ID | Finding | Evidence |
|---|---|---|
| H1 | Product meta descriptions print the brand twice | `The Ordinary The Ordinary Hyaluronic Acid 2% + B5` — ×243 |
| H2 | Boilerplate meta description on all 120 legacy posts | Identical to the homepage description |
| H3 | Product pages unmonetised | Links go straight to `theordinary.com`, `sephora.com` with no affiliate parameters |
| H4 | Tier A content carries no affiliate links | 75 best posts earn nothing but the sidebar widget |
| H5 | Placeholder titles live in production | `Brand Xyz Vitamin C Face Mask Review`; `/product-reviews/face-serum`; `/informative-articles/sunscreen` |
| H6 | Off-topic content damaging topical authority | COVID cloth-mask article ("In these uncertain times…"), hair care links, insect-bite balm review |

### Medium

| ID | Finding | Evidence |
|---|---|---|
| M1 | Dead internal links and non-canonical host references | Links to `bestlooking.skin/skincare-how-to-guides/hair-essential-tips/` and `/how-to-guides/how-to-care-for-hair-after-sun-exposure/`; non-`www` with trailing slash |
| M2 | Six titles still dated 2024 | Top 7 Mineral Sunscreen Picks For 2024, 6 Best Products Clear Radiant Skin 2024, 7 Best Sensitive Skin Care Products 2024, Top 7 Anti Aging Skincare 2024, 6 Best Organic Skincare 2024, 7 Best Eye Creams Caffeine 2024 |
| M3 | Taxonomy overlap | `/categories/moisturisers` (British) vs `/moisturizers` (American); same for cleansers, serums |
| M4 | No citations to authoritative sources | Zero across every page sampled |
| M5 | AggregateRating compliance unverified | Product shows "4.6 · 15,000 ratings" while on-site review count is zero |
| M6 | No comparison tables | On posts explicitly framed as comparisons |
| M7 | Duplicate headings in Tier B | "Choosing the Right Sunscreen" appears as an H2 twice in one post |

### Low

| ID | Finding | Evidence |
|---|---|---|
| L1 | Homepage tiles mis-mapped | "Eye Care" and "Eye Cream" both link to `/categories/facial-cleansers`; "Anti-Aging" uses `showcase-reviews.jpg` |
| L2 | Two image placeholders on `/about` | Renders "Editorial skincare research image placeholder" and "Skincare products flat-lay image placeholder" as literal text |
| L3 | Read time wrong on Tier B | Reports "2 min" for ~2,000-word posts |
| L4 | og:image missing on Tier B; twitter:card inconsistent | `summary` on legacy posts, `summary_large_image` sitewide |
| L5 | Empty product review system | "No written reviews yet" on all products sampled |

---

## 3. Site inventory

**243 products** across 7 product categories · **195 posts** across 20 categories ·
~15 hub index pages · ~10 utility and legal pages. Roughly **465 indexable URLs**.

### Tier A hubs (75 posts, 5 each)

Product-type: `/exfoliants` `/cleansers` `/eye-cream` `/face-masks`
`/moisturizers` `/serums` `/sunscreen`
Skin-concern: `/anti-aging` `/sensitive-skin` `/acne` `/hyperpigmentation`
Cross-cutting: `/routines` `/dupes` `/ingredients` `/korean-skincare`

### Tier B categories (120 posts)

`/product-comparisons` (15) · `/product-reviews` (29) · `/top-rated-products` (20)
· `/how-to-guides` (27) · `/informative-articles` (29)

---

## 4. Not assessed

Do not treat these as clean — they were never checked.

| Signal | How to get it |
|---|---|
| Search Console data | Export Performance (16mo), Pages coverage, Enhancements |
| AdSense status | Export account status + Policy Center |
| Core Web Vitals | `pagespeed.web.dev` |
| JSON-LD schema | Rich Results Test, one page per template |
| Backlinks | Ahrefs / GSC Links |
| `/robots.txt`, `/sitemap.xml` raw | Open directly in a browser |
| `/contact`, `/faqs`, `/brands`, `/search` | Second pass |
| **All four `/legal/*` pages** | See section 5 — **not crawled** |

---

## 5. Legal pages — NOT AUDITED

`/legal/disclosure`, `/legal/privacy`, `/legal/cookies`, `/legal/terms` were **not
crawled**. The fetch tool refused those URLs during the audit session.

This matters because the equivalent pages on the sibling site nxtsmart.homes were
found to be badly wrong:

- Named the operator as *"FXN Holdings, a registered business in **Australia**"* — the actual entity is **FXN Holdings Limited, England & Wales, no. 16134139, ICO ZB940664**
- Terms governed by the laws of **Western Australia**, venue WA courts, mediation in Perth
- Privacy ran on the Australian Privacy Act, complaints routed to the OAIC not the ICO
- Unfilled placeholders live: `FXN Holdings (ABN )`, "providing FXN Holdings with days' notice"
- Both policies carried the generator's disclaimer: *"provided as a general template … does not constitute legal advice"*
- Cookie policy described a consent banner and "Cookie settings" footer link that did not appear to exist

Same operator, probably the same template source. **Assume the same defects here
until verified.**

Two things in this site's favour: it has a dedicated `/legal/disclosure` page,
which nxtsmart.homes does not, and its in-article affiliate disclosure sits
correctly above the content.

> **Do not fix legal pages by editing text.** A UK solicitor must review the
> framework, not just the country name. Flag and stop.

---

## 6. Stale Notion records

The project page contradicts reality on several counts. Trust the live site.

| Recorded | Actual (12 Sep 2026) |
|---|---|
| `commerce-products` empty for this storefront | **243 products live**, prices refreshed 11 Sep |
| Product routes render empty | Rendering correctly |
| Open: re-import the catalogue | Appears done — the open item is now monetisation |
| `bls-posts` — 120 posts | **195 posts** |
| `bls-categories` — 5 categories | **20 categories** |
| Repository `FXNHoldings/strapi-bestlookingskin` | **`xmpcross/strapi-bestlookingskin`** |
| Wiki.js: static site on Netlify | Superseded — Next.js 15 on Vercel |

---

## 7. Task register

Live in the Notion Tasks database. Update these rather than creating duplicates.

- **Data source:** `collection://3af007e8-eecb-80df-a2d1-000b6e65fcd0`
- **Project relation:** `https://app.notion.com/p/3b4007e8eecb81bcaea5c62d8099aea3`
- **Status values:** `Not started` · `Up next` · `In progress` · `Done`

| Task | Notion page ID | Finding |
|---|---|---|
| P0 · Remove Strapi keyFeatures placeholder from product pages | `3d9007e8-eecb-81ec-95bd-c97e49e318fb` | C1 |
| P0 · Fix product meta descriptions — brand printed twice | `3d9007e8-eecb-8184-8f57-fa1c622cf6dd` | H1 |
| P0 · Strip stale March 2024 Amazon price blocks | `3d9007e8-eecb-811a-a2f5-fd3e06dbfb1e` | C3 |
| P0 · Fix mis-mapped homepage tiles | `3d9007e8-eecb-81a1-bf17-d5e234a09bde` | L1 |
| P0 · Fix dead internal links and non-canonical host references | `3d9007e8-eecb-8162-9111-e8f3b54437a7` | M1 |
| P0 · Fix placeholder titles live in production | `3d9007e8-eecb-81ce-82c4-d084286c8423` | H5 |
| P0 · Portfolio · Audit legal pages across all sites | `3d9007e8-eecb-818f-bb44-e1ccb00a3353` | §5 |
| P1 · Triage all 120 legacy posts | `3d9007e8-eecb-8159-b5a6-dc3d34477abb` | core |
| P1 · Remove off-topic content | `3d9007e8-eecb-81a3-900f-ca0d92af10d9` | H6 |
| P1 · Rewrite the six titles dated 2024 | `3d9007e8-eecb-810f-979b-e0ad7cafa32f` | M2 |
| P1 · Write unique meta descriptions for retained legacy posts | `3d9007e8-eecb-8158-8f27-fed9a97a8a59` | H2 |
| P1 · Add og:image and fix twitter:card on legacy posts | `3d9007e8-eecb-819b-8291-c6fd762b7ed1` | L4 |
| P1 · Fix read-time calculation | `3d9007e8-eecb-81fb-a19a-eb1ce0f1af63` | L3 |
| P1 · Backfill author attribution on retained legacy posts | `3d9007e8-eecb-814d-89e1-eaa28f2b8acd` | C4 |
| P2 · Rewrite /about with named people and company entity | `3d9007e8-eecb-81f2-a76a-c1a8ede4e64b` | C4 |
| P2 · Replace the two image placeholders on /about | `3d9007e8-eecb-8194-add8-e01c35e547f0` | L2 |
| P2 · Add credentials to author profiles | `3d9007e8-eecb-8184-952c-e0fbce7ad5a2` | C4 |
| P2 · Add an expert reviewer layer for YMYL content | `3d9007e8-eecb-813c-a5ed-c66141ac8d5d` | C4 |
| P2 · Add citations to authoritative sources | `3d9007e8-eecb-8149-851b-e3136d6d4741` | M4 |
| P2 · Verify and complete structured data | `3d9007e8-eecb-8158-94e1-e3aa687f9cb2` | — |
| P2 · Verify AggregateRating compliance on product pages | `3d9007e8-eecb-8123-ad41-fd1a530ccc4f` | M5 |
| P3 · Export Search Console and AdSense baseline | `3d9007e8-eecb-81d0-abc8-fb87a630cc24` | — |
| P3 · Write original editorial for product pages | `3d9007e8-eecb-81c8-ae6b-dc3cc173e07e` | C2 |
| P3 · Add comparison tables to versus-style posts | `3d9007e8-eecb-810b-974a-eb5069c85cbb` | M6 |
| P4 · Complete Takeads repoint and retire Geniuslink | `3d9007e8-eecb-816f-9577-cabe5913a3fd` | H3 |
| P4 · Wrap outbound links on the 243 product pages | `3d9007e8-eecb-81db-829e-c0ffcfffe2ae` | H3 |
| P4 · Add contextual affiliate links to the 75 hub posts | `3d9007e8-eecb-81fe-8a9d-d4aaac0a14a3` | H4 |
| P4 · Run AdSense pre-submission checklist and apply | `3d9007e8-eecb-8131-84b2-e87c1b68a36f` | — |
| P5 · Retire the xmpcross/bestlooking.skin mirror repo | `3d9007e8-eecb-8132-934b-ffbc18e00288` | — |
| P5 · Clear outstanding Dependabot advisories | `3d9007e8-eecb-81ca-8acb-ccfd5e70cd6b` | — |
| P5 · Resolve the moisturisers / moisturizers taxonomy overlap | `3d9007e8-eecb-8158-8335-e3a1cc01469b` | M3 |
| P5 · Update the Notion project page | `3d9007e8-eecb-8141-b9ef-e2a08b2bbb55` | §6 |

---

### Search Console audit (24 Sep 2026) — outcome

Fixed on `main` and deployed 24 Sep 2026; each verified on https://www.bestlooking.skin with `scripts/seo-check.mjs`
(545 sitemap URLs: 0 failures — all 200, self-canonical, one H1, JSON-LD parses, no Review without itemReviewed,
no retailer aggregateRating, no noindexed URL in the sitemap). Full audit: Notion `3e4007e8-eecb-810d-8320-e6234953df32`.

| Task | Notion | Status | Outcome |
|---|---|---|---|
| P0 · GSC · Fix Review schema on 31 review posts | `3e4007e8-eecb-81dc-8125-d8ac8a54c326` | Done | All posts emit Article (no rating / linked product exists) |
| Remove retailer ratings from product schema | `3d9007e8-eecb-8123-ad41-fd1a530ccc4f` | Done | aggregateRating only from on-site reviews; iHerb products carry their one Offer |
| P1 · GSC · Fix or remove the 3 empty hub-group pages | `3e4007e8-eecb-8191-86aa-c3d26418a510` | Done | Pages list their hubs with an intro (components/HubGroupPage.tsx) |
| P1 · GSC · Add missing indexable pages to sitemap.xml | `3e4007e8-eecb-81ed-9e1e-ed44eb1187a5` | Done | Authors, /categories, /legal/disclosure, 38 indexable brands; hourly revalidate |
| P1 · GSC · Clean up brand pages | `3e4007e8-eecb-8116-8af2-d935585f42ce` | Done | Slugs + 308s, 4 aliases merged, 17 draft intros (awaiting review), thin brands noindexed |
| P2 · GSC · Noindex or restructure /faqs | `3e4007e8-eecb-81a1-8461-e711d2fb0e4d` | Done | Noindexed, out of sitemap (restructure needs owner-written site FAQs) |
| P2 · GSC · Use real lastmod dates | `3e4007e8-eecb-8167-b505-cbffd02050d3` | Done | Release dates / hand-set constants; no new Date() |
| Point internal links straight at final URLs | `3d9007e8-eecb-8162-9111-e8f3b54437a7` | In progress | scripts/fix-legacy-links.mjs dry run: 402 links / 127 posts / 0 non-200 — awaiting OK to write |
| P3 · GSC · Add missing H1s | `3e4007e8-eecb-81b3-b2dc-e33e3aa8c1d7` | Done | Already one H1 on all four pages; no change needed |
| P3 · GSC · Mark affiliate links rel="sponsored" | `3e4007e8-eecb-81d6-9668-fc8e8404a3d9` | Done | SPONSORED_REL helper (lib/links.ts) on every retailer/affiliate link, incl. post bodies |
| P3 · GSC · Shorten long titles + og:image | `3e4007e8-eecb-81b4-9b11-dd027d27c96a` | Done | Suffix dropped over 60 chars (261 → 54 over 65); og:image on every page |
| Finish the structured data | `3d9007e8-eecb-8158-94e1-e3aa687f9cb2` | Done | Organization logo (public/logo.png) + sameAs (Facebook); absolute image URLs |
| Remove dates from titles | `3d9007e8-eecb-810f-979b-e0ad7cafa32f` | In progress | scripts/fix-dated-titles.mjs dry run: 8 posts — awaiting OK to write |
| Duplicate hub and category descriptions | `3d9007e8-eecb-8158-8335-e3a1cc01469b` | (unchanged) | Descriptions made distinct (0 duplicates site-wide); taxonomy view noted, not implemented |

## 8. Suggested sequence

1. **Stop the bleeding.** CMS placeholder, product meta descriptions, March 2024 Amazon blocks, mis-mapped tiles, dead links. Low effort, and every one is an AdSense rejection trigger.
2. **Decide the fate of Tier B.** 120 posts: rewrite to Tier A standard, consolidate into a hub post, or prune with a redirect. Pruning is legitimate and faster.
3. **Earn the right to rank on YMYL.** Name a human on `/about`, give the author credentials, add a reviewer line, add citations.
4. **Make the catalogue original.** Two or three paragraphs of genuine editorial per product beats 243 copies of a brand's own words. Prioritise by Search Console impressions.
5. **Monetise what deserves traffic.** Takeads repoint, wrap product links, add contextual links to the 75 Tier A posts.
6. **Housekeeping.** Mirror repo, Dependabot, taxonomy overlap, Notion project record.