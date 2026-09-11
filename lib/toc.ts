export type TocItem = { id: string; text: string; level: 2 | 3 };

/**
 * Add stable ids to body headings and return the table of contents built from
 * the same pass.
 *
 * Done together on purpose: an id scheme in one place and a TOC generated
 * somewhere else drift the moment either changes, and the failure is a contents
 * list whose links go nowhere. One pass means the anchors cannot disagree.
 *
 * Existing ids are kept, so any hand-written in-page links keep resolving, and
 * duplicates get a numeric suffix -- two sections called "Overview" would
 * otherwise both answer to #overview and the second would be unreachable.
 */
export function withHeadingIds(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Set<string>();
  /*
   * Questions inside a trailing FAQ section get ids but never reach the
   * contents list. PostContent rewrites that section into <details>/<summary>
   * and the h3 wrapper -- id and all -- is discarded, so a contents entry
   * pointing at one is a link to an element that will not exist in the DOM.
   * Six dead anchors per post before this.
   */
  let inFaqSection = false;

  const slugify = (text: string) => {
    const base =
      text
        .replace(/<[^>]+>/g, '')
        .replace(/&[a-z]+;|&#\d+;/gi, ' ')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'section';
    let id = base;
    let n = 2;
    while (used.has(id)) id = `${base}-${n++}`;
    used.add(id);
    return id;
  };

  const out = html.replace(
    /<(h[23])(\b[^>]*)>([\s\S]*?)<\/\1>/gi,
    (whole, tag: string, attrs: string, inner: string) => {
      const level = tag.toLowerCase() === 'h2' ? 2 : 3;
      const text = inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (!text) return whole;

      const existing = attrs.match(/\bid=["']([^"']+)["']/i);
      const id = existing ? existing[1] : slugify(text);
      if (existing) used.add(id);

      if (level === 2) inFaqSection = /\b(FAQ|Frequently\s+Asked)/i.test(text);
      /* The FAQ heading itself stays -- it survives as a real heading. */
      if (!(inFaqSection && level === 3)) toc.push({ id, text, level: level as 2 | 3 });
      const nextAttrs = existing ? attrs : `${attrs} id="${id}"`;
      return `<${tag}${nextAttrs}>${inner}</${tag}>`;
    },
  );

  return { html: out, toc };
}
