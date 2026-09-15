/*
 * Product attributes for the product page tabs.
 *
 * The sourcing pipeline (DataForSEO product info) writes a product's attributes as flat keys on `specs`
 * ("Form", "Size", "Skin Type", "Ingredients"...), next to its own bookkeeping keys; the iHerb enricher writes a
 * nested `technicalSpecs` object instead. Both are read here and split into two lists:
 *
 *   Specifications  -- what the product physically is: format, size, packaging, how and when it is applied.
 *   Additional Info -- who and what it is for: skin types and concerns, ingredients, free-from and certification
 *                      claims as the retailer listing states them.
 *
 * Values are shown as sourced; nothing is inferred or filled in. Keys that are pipeline bookkeeping, the fields
 * the page already shows elsewhere, and retailer gift-marketing copy are left out.
 */

const HIDDEN_KEYS = new Set(
  [
    'source',
    'importedAt',
    'sourceImageUrl',
    'sourceUrl',
    'technicalSpecs',
    'keyFeatures',
    'skinTypes',
    'ingredients',
    'seoTitle',
    'seoDescription',
    'seoKeywords',
    'primaryAffiliateUrl',
    'Target Audience Highlights',
    'Gifts for Mothers',
  ].map((k) => k.toLowerCase()),
);

/* Specifications, in display order. Anything not listed here goes to Additional Info. */
const SPECIFICATION_KEYS = [
  'Brand',
  'Product Type',
  'Type',
  'Subtype',
  'Form',
  'Formulation Form',
  'Formulation Type',
  'Formulation Subtype',
  'Formulation Consistency',
  'Formula',
  'Texture',
  'Texture Type',
  'Finish',
  'Coverage',
  'Color',
  'Tint Color',
  'Formulation Color',
  'Scent',
  'Scented',
  'Unscented',
  'Flavor',
  'SPF',
  'Protection Level',
  'Protection Type',
  'Sun Protection',
  'Water Resistance',
  'Size',
  'Volume',
  'Net Volume',
  'Net Weight',
  'Weight',
  'Item Count',
  'Count',
  'Quantity',
  'Package quantity',
  'Multipack Quantity',
  'Number of Servings',
  'Dosage',
  'Travel Size',
  'Container Type',
  'Container Features',
  'Packaging Type',
  'Material Type',
  'Included Components',
  'Included Accessories',
  'Accessory Type',
  'Face Treatment Type',
  'Acne Treatment Type',
  'Scar Treatment Type',
  'Application Method',
  'Application Time',
  'Application Time of Day',
  'Night / Day Use',
  'Night Or Day',
  'Overnight Use',
  'Overnight',
  'Application Frequency',
  'Application Duration',
  'No Rinse',
  'Body Part',
  'Body Part Use',
  'Applicable Body Areas',
  'For Face',
  'Eye Safe',
  'Dimensions',
  'Shipping weight',
  'UPC',
  'Product code',
  'First available',
].map((k) => k.toLowerCase());

/* Additional Info leads with these, in this order; the rest follow alphabetically. */
const ADDITIONAL_PRIORITY = [
  'Skin Type',
  'For Sensitive Skin',
  'Skin Concerns',
  'Primary Skin Concern',
  'Secondary Skin Concern',
  'Skin Problem',
  'Solution For',
  'Target Concern',
  'Key Ingredient',
  'Active Ingredients',
  'Active Ingredient',
  'Highlighted Ingredients',
  'Featured Ingredient',
  'Ingredients',
  'Ingredient',
  'Contains',
  'Contains Ingredients',
  'Free Of',
  'Certifications',
  'Sustainability',
  'Sustainability Label',
  'Suitable For',
  'Typical Users',
  'Age Range',
  'Age Group',
  'Suggested Use',
  'Warnings',
].map((k) => k.toLowerCase());

const decodeEntities = (s: string) =>
  s
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/<wbr\s*\/?>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

const labelFor = (key: string) => {
  const k = decodeEntities(key);
  if (k === 'suggestedUse') return 'Suggested Use';
  if (k === 'warnings') return 'Warnings';
  return k.charAt(0).toUpperCase() + k.slice(1);
};

export type AttributeRow = [label: string, value: string];

export function productAttributes(specs: Record<string, unknown> | undefined | null): {
  specifications: AttributeRow[];
  additional: AttributeRow[];
} {
  const flat: Record<string, unknown> = { ...(specs ?? {}) };
  const technical = specs?.technicalSpecs;
  if (technical && typeof technical === 'object') Object.assign(flat, technical as Record<string, unknown>);

  const seen = new Set<string>();
  const rows: AttributeRow[] = [];
  for (const [key, raw] of Object.entries(flat)) {
    if (HIDDEN_KEYS.has(key.toLowerCase())) continue;
    if (raw === null || raw === undefined || typeof raw === 'object') continue;
    const value = decodeEntities(String(raw));
    const label = labelFor(key);
    if (!value || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    rows.push([label, value]);
  }

  const specIndex = (label: string) => SPECIFICATION_KEYS.indexOf(label.toLowerCase());
  const specifications = rows.filter(([l]) => specIndex(l) !== -1).sort((a, b) => specIndex(a[0]) - specIndex(b[0]));
  const priority = (label: string) => {
    const i = ADDITIONAL_PRIORITY.indexOf(label.toLowerCase());
    return i === -1 ? Infinity : i;
  };
  const additional = rows
    .filter(([l]) => specIndex(l) === -1)
    .sort((a, b) => priority(a[0]) - priority(b[0]) || a[0].localeCompare(b[0]));
  return { specifications, additional };
}

/* A short lead for the top of the page: the product's own short description, else the opening sentences of its
   description (cut at a sentence end, around 240 characters). */
export function productLead(shortDescription?: string, description?: string): string | null {
  const short = shortDescription?.trim();
  if (short) return short;
  const text = (description ?? '').replace(/[#*_`>]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  let lead = '';
  for (const s of sentences) {
    if (lead && (lead + s).length > 240) break;
    lead += s;
  }
  return lead.trim() || null;
}

/* Highlights strip above the product description: up to eight headline facts, in this order, each taken from the
   same attribute rows the Specifications / Additional Info sections show (so each tile can point at its section). */
const HIGHLIGHT_KEYS: { keys: string[]; label?: string }[] = [
  { keys: ['Product Type', 'Type', 'Formulation Form', 'Form'], label: 'Product Type' },
  { keys: ['Skin Type'] },
  { keys: ['Key Ingredient', 'Active Ingredients', 'Active Ingredient', 'Highlighted Ingredients'], label: 'Key Ingredient' },
  { keys: ['Free Of'] },
  { keys: ['Volume', 'Net Volume', 'Size', 'Net Weight', 'Item Count'], label: 'Size' },
  { keys: ['Texture', 'Texture Type', 'Formulation Consistency', 'Formulation Type'], label: 'Texture' },
  { keys: ['Scent'] },
  { keys: ['Application Frequency', 'Application Time of Day', 'Application Time'], label: 'When to Use' },
  { keys: ['Primary Skin Concern', 'Skin Concerns', 'Solution For'], label: 'Skin Concern' },
];

export type ProductHighlight = { label: string; value: string; section: 'specifications' | 'additional' };

export function productHighlights(attributes: { specifications: AttributeRow[]; additional: AttributeRow[] }, limit = 7): ProductHighlight[] {
  const find = (key: string) => {
    const k = key.toLowerCase();
    const spec = attributes.specifications.find(([l]) => l.toLowerCase() === k);
    if (spec) return { value: spec[1], section: 'specifications' as const };
    const add = attributes.additional.find(([l]) => l.toLowerCase() === k);
    return add ? { value: add[1], section: 'additional' as const } : null;
  };
  const out: ProductHighlight[] = [];
  for (const h of HIGHLIGHT_KEYS) {
    for (const key of h.keys) {
      const hit = find(key);
      if (hit) {
        out.push({ label: h.label ?? key, value: hit.value, section: hit.section });
        break;
      }
    }
    if (out.length >= limit) break;
  }
  return out;
}

/* A short description may be a sentence followed by "- " bullet lines. splitShortDescription separates the two for
   the product page; plainShortDescription flattens it for meta tags, structured data and card excerpts. */
export function splitShortDescription(text?: string | null): { intro: string; bullets: string[] } {
  const lines = (text ?? '').replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean);
  const bullets = lines.filter((l) => /^[-*•]\s+/.test(l)).map((l) => l.replace(/^[-*•]\s+/, ''));
  const intro = lines.filter((l) => !/^[-*•]\s+/.test(l)).join(' ');
  return { intro, bullets };
}

export function plainShortDescription(text?: string | null): string {
  const { intro, bullets } = splitShortDescription(text);
  const tail = bullets.map((b) => b.replace(/[.;]\s*$/, '')).join('; ');
  return [intro, tail && `${tail}.`].filter(Boolean).join(' ').trim();
}
