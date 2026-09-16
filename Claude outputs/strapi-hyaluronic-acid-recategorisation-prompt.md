# Task brief: recategorise the Hyaluronic Acid products in Strapi

Paste this whole file into a new session. It is self-contained.

---

## Context

- **CMS:** Strapi v5 at `https://cms.fxnstudio.com`, admin UI at the same host.
- **Collection:** `commerce-products` (admin label: *Commerce · Product*).
- **Category collection:** `commerce-categories` (admin label: *Commerce · Category*).
- **Important:** `commerce-products` is a **shared pool** used by several sites
  (bestlooking.skin, nxt.bargains, nxt-sourcing). Products are scoped to a site
  by a `site` relation. Every product listed below has `site.slug = bestlooking-skin`,
  so this work does not belong to another storefront — but **category membership
  itself is global**, so keep the edits to exactly the products listed.
- Reads on the public API are open. Writes need an admin token or the admin UI.

## The problem

The category `hyaluronic-acid` was intended to hold **ingestible hyaluronic acid
supplements** — capsules, tablets and powders — with topical products living in
`facial-serums`, `moisturisers` and `toners-and-astringents`.

The frontend documents that intent in `lib/strapi.ts`:

> Ingestible hyaluronic acid supplements — capsules and powders — not the
> topical serums, which sit under facial-serums.

The data never matched it. Of the 35 products currently in that category for
bestlooking.skin, **only 6 are ingestible**. The other 29 are serums, creams,
toners and boosters.

Worse, **20 of those 29 sit in `hyaluronic-acid` and no other category.** So the
category cannot simply be filtered down to supplements in code — those 20 would
disappear from the storefront entirely, with no category page listing them.

## The goal

Recategorise so that `hyaluronic-acid` naturally contains only ingestible
supplements, and every topical product lands in a category that fits it. No
frontend code change should be needed afterwards.

## The rule

- **Ingestible** (capsules, tablets, veg caps, powder, "Dietary Supplement" in
  the description) → **keep `hyaluronic-acid`**, change nothing.
- **Topical serum, booster or concentrate** → **add `facial-serums`** (if absent)
  and **remove `hyaluronic-acid`**.
- **Topical cream, face moisturiser or "moisturizing factors"** → **add
  `moisturisers`** (if absent) and **remove `hyaluronic-acid`**.
- **Toner or hydrating lotion** (a Japanese "lotion" is a toner, not a body
  lotion) → **add `toners-and-astringents`** (if absent) and **remove
  `hyaluronic-acid`**.

Every product must end with **at least one** category. Do not leave any product
with zero categories — it would become unreachable from any listing page.

---

## Group A — keep as is (6 products, ingestible)

No edit. Listed so you can confirm nothing here gets moved by mistake.

| documentId | Name |
|---|---|
| `c0wa2x5eqnpa5c1s0937llxm` | NOW Foods, Hyaluronic Acid With MSM, 60 Veg Capsules |
| `f42h040zn8bieyzah1d3w61r` | NOW Foods, Hyaluronic Acid, 100 mg, 120 Veg Capsules |
| `mg82wt6b76w284r6tep66fcw` | Best Naturals, Hyaluronic Acid With Glucosamine & Chondroitin, 120 Capsules |
| `w9ul75svk9s3hnlrbl9c6qax` | Micro Ingredients, Hyaluronic Acid Powder, 3.52 oz (100 g) |
| `l89n2stsnkojnlbtd5l07nnv` | Solgar, Collagen Hyaluronic Acid Complex, 30 Tablets |
| `o1mnk9rcetg7viihniy43ns0` | Doctor's Best Hyaluronic Acid with Chondroitin Sulfate ⚠️ |

⚠️ **Confirm this one before finishing.** It has no `shortDescription`, so the
classification is inferred from the brand and from chondroitin sulfate being a
joint-support ingredient. Open the product and check it is capsules, not a
topical. If it turns out to be topical, move it to `facial-serums` per the rule.

## Group B — add `facial-serums`, remove `hyaluronic-acid` (21 products)

These 9 **already have** `facial-serums` — only remove `hyaluronic-acid`:

| documentId | Name |
|---|---|
| `z8vfxmlib8qdp72mjiqo44r6` | The Ordinary Hyaluronic Acid 2% + B5 |
| `x9drp08v2rpklcn1l5qqgx98` | SkinCeuticals Hyaluronic Acid Intensifier |
| `az6ucpenpb39rppu918iil2g` | La Roche-Posay Hyalu B5 Pure Hyaluronic Acid Serum |
| `yoyrp7142o0l4lk765lsozcx` | CeraVe Hydrating Hyaluronic Acid Serum |
| `bxpn24eprluplns3luwbrzaq` | Glow Recipe Plum Plump Hyaluronic Acid Serum |
| `nzzwc1rowwnldgsu5jr5e61y` | Torriden DIVE-IN Low Molecular Hyaluronic Acid Serum |
| `vjfhj7ehr45fkz39u3exl90n` | The Inkey List Hyaluronic Acid Serum |
| `hdh9wr0va3akcfelle7r5pux` | Farmacy Filling Good Hyaluronic Acid Plumping Serum |
| `a5wil1x596ya7g3wppmxhh32` | Avene Hyaluron Activ B3 Concentrated Plumping Serum |

These 12 have **only** `hyaluronic-acid` — add `facial-serums`, then remove it:

| documentId | Name |
|---|---|
| `ju8u3w333vt9t53px90jzkk1` | La Roche-Posay Hyalu B5 Hyaluronic Acid Serum Pure |
| `ypjy8psjup3iwupty0sngzh5` | Paula's Choice Hyaluronic Acid Booster ⚠️ |
| `uivdh4ao3u3jycr5wq5gui18` | Peter Thomas Roth Water Drench Hyaluronic Cloud Serum |
| `levcx7chwgonre9iee96v4mk` | Good Molecules Hyaluronic Acid Serum |
| `ql60wik6wrw62jpcwygzgbzk` | Olay Regenerist Hyaluronic + Peptide 24 Serum |
| `js49grtslxpkisaucyg21phf` | Laneige Water Bank Blue Hyaluronic Serum |
| `jv4ala1icqxbei7mwv4uzem4` | Medik8 Hydr8 B5 Serum |
| `cu2gboz2o39mq5b4wjd3wsyy` | Dr. Barbara Sturm Hyaluronic Serum |
| `yoc9wtt3t5py7pwhr8batraa` | Bioderma Hydrabio Serum |
| `j4sc8a5zcml4qbcufmx3ilom` | Byoma Hydrating Serum |
| `dwtvof1rqzpwpz0e95rt4vfu` | First Aid Beauty Ultra Repair Hydrating Serum |
| `p8e8514js2t4q2b7rcokmhqv` | Youth To The People Triple Peptide + Hyaluronic Acid Serum |

⚠️ Paula's Choice Hyaluronic Acid Booster is a leave-on concentrate. `facial-serums`
is the closest fit; flag it if the site later adds a "boosters" category.

## Group C — add `moisturisers`, remove `hyaluronic-acid` (6 products)

This 1 **already has** `moisturisers` — only remove `hyaluronic-acid`:

| documentId | Name |
|---|---|
| `hecacxo3zqa7izsfo4d2rkdt` | Glow Recipe Plum Plump Hyaluronic Cream |

These 5 have **only** `hyaluronic-acid` — add `moisturisers`, then remove it:

| documentId | Name |
|---|---|
| `vz4ehon28pky97v0sfvgb5v1` | Peter Thomas Roth Water Drench Hyaluronic Cloud Cream |
| `xt6qliyrvak8cv934s7agxgw` | Olay Regenerist Hyaluronic + Peptide 24 Face Moisturizer |
| `g50je6aj98e8vvfoupd2u494` | Laneige Water Bank Blue Hyaluronic Cream |
| `tc0fdzlolt1i1cvtos380kp3` | Elf Holy Hydration Face Cream |
| `kcuwrtkfohx34fwunhxje3kp` | The Ordinary Natural Moisturizing Factors + HA ⚠️ |

⚠️ The Ordinary NMF + HA is a leave-on cream — `moisturisers` is right, despite
"HA" in the name.

## Group D — add `toners-and-astringents`, remove `hyaluronic-acid` (2 products)

This 1 **already has** the category — only remove `hyaluronic-acid`:

| documentId | Name |
|---|---|
| `ns5tvblq8w95itn309uswv50` | Torriden DIVE-IN Low Molecular Hyaluronic Acid Toner |

This 1 has **only** `hyaluronic-acid` — add the category, then remove it:

| documentId | Name |
|---|---|
| `wdgxkk1sdlvzlu0jxvtio4ru` | Hada Labo Gokujyun Premium Hyaluronic Acid Lotion ⚠️ |

⚠️ Japanese "lotion" means a hydrating toner/essence applied after cleansing, not
a body lotion. `toners-and-astringents` is correct.

**Total: 6 unchanged + 29 edited = 35.**

---

## How to apply

Either is fine — pick based on what access you have.

### Admin UI
Open each product, edit the `categories` relation, **Save**, then **Publish**
(these entries are published; a save alone leaves a draft the API will not
return until published).

### REST API
Strapi v5 uses `documentId` in the URL:

```
PUT /api/commerce-products/{documentId}
```

Use `connect` / `disconnect` on the relation rather than assigning an array.
Assigning `categories: [...]` **replaces the whole relation** and will silently
drop categories not listed:

```json
{
  "data": {
    "categories": {
      "connect": [{ "documentId": "<facial-serums documentId>" }],
      "disconnect": [{ "documentId": "<hyaluronic-acid documentId>" }]
    }
  }
}
```

Fetch the four category documentIds first:

```
GET /api/commerce-categories?filters[slug][$in][0]=facial-serums&filters[slug][$in][1]=moisturisers&filters[slug][$in][2]=toners-and-astringents&filters[slug][$in][3]=hyaluronic-acid&fields[0]=slug&fields[1]=name
```

## Do not

- **Do not change any product `slug`.** Product URLs are `/products/{slug}` and
  are indexed by Google. Categories change which listing pages show a product;
  slugs must not move.
- **Do not delete any product.**
- **Do not touch `productStatus`.** It is maintained automatically by
  `sync-product-listability.mjs` in the nxt-sourcing project, driven by live
  offer count. Hand edits get reverted on its next run.
- **Do not edit products outside the 35 listed**, even if they look similar —
  the pool is shared with other sites.

## Verify when done

Run these against the public API and check the numbers.

**1. `hyaluronic-acid` should now hold exactly the 6 supplements:**
```
https://cms.fxnstudio.com/api/commerce-products?filters[categories][slug][$eqi]=hyaluronic-acid&filters[site][slug][$eq]=bestlooking-skin&filters[productStatus][$eq]=active&fields[0]=name&pagination[pageSize]=100
```
Expect `meta.pagination.total` = **6** (or 5, if Doctor's Best turned out topical).

**2. No product left with zero categories.** For each of the 29 edited
documentIds, confirm `categories` is non-empty:
```
https://cms.fxnstudio.com/api/commerce-products/{documentId}?populate[categories][fields][0]=slug
```

**3. Totals should be unchanged.** The site-scoped catalogue was **243 products**
before this work. Recategorising moves products between listings; it must not
change the total:
```
https://cms.fxnstudio.com/api/commerce-products?filters[site][slug][$eq]=bestlooking-skin&filters[productStatus][$eq]=active&pagination[pageSize]=1
```
Expect **243**.

**4. Spot-check the live site** after a minute (pages revalidate every 60s):
- `https://www.bestlooking.skin/categories/hyaluronic-acid` — supplements only
- `https://www.bestlooking.skin/categories/facial-serums` — should have grown by 21
- `https://www.bestlooking.skin/categories/moisturisers` — grown by 6
- `https://www.bestlooking.skin/categories/toners-and-astringents` — grown by 2

## If you need to roll back

There is no bulk undo. Before starting, save the current state:

```
https://cms.fxnstudio.com/api/commerce-products?filters[categories][slug][$eqi]=hyaluronic-acid&filters[site][slug][$eq]=bestlooking-skin&filters[productStatus][$eq]=active&populate[categories][fields][0]=slug&fields[0]=name&fields[1]=slug&pagination[pageSize]=100
```

Save that JSON to a file first. It records every product's categories exactly as
they are now, which is enough to restore any of them.
