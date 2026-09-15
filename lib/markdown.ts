/**
 * Markdown post bodies (e.g. articles pushed from app.fxnseo.com) rendered to the same HTML the imported posts carry,
 * so the post template (heading ids, contents list, FAQ accordion, inserts) treats both alike.
 *
 * Covers what those articles use: ATX headings, paragraphs, bullet and numbered lists, block quotes, horizontal
 * rules, pipe tables, and inline bold, italic, code and links. Raw HTML in the source is escaped, not passed through.
 *
 * Heading levels are normalised: the shallowest level used more than once becomes h2 (a lone "## FAQ" above "###"
 * sections is lifted to h2 with them), deeper levels follow, and nothing renders as h1 (the page title is the h1).
 */

/** True when a body is Markdown rather than HTML: no block-level tags, and at least one Markdown block marker. */
export function isMarkdownBody(value: string | null | undefined): boolean {
  const s = String(value ?? '');
  if (!s.trim()) return false;
  if (/<(p|h[1-6]|div|ul|ol|li|table|figure|section|blockquote|br)\b/i.test(s)) return false;
  return /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s|\|.*\|)/.test(s) || /\*\*[^*\n]+\*\*/.test(s);
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Site links become root-relative (canonical host rule); only http(s), root-relative and #anchors are linked. */
function safeHref(raw: string): string | null {
  const href = raw.trim().replace(/^<|>$/g, '');
  const site = href.match(/^https?:\/\/(?:www\.)?bestlooking\.skin(\/[^\s]*)?$/i);
  if (site) return (site[1] || '/').replace(/(.)\/$/, '$1');
  if (/^(https?:\/\/|\/|#)/i.test(href)) return href;
  return null;
}

function inline(text: string): string {
  const codes: string[] = [];
  let s = text.replace(/`([^`]+)`/g, (_m, code: string) => {
    codes.push(`<code>${escapeHtml(code)}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = escapeHtml(s);
  s = s.replace(/\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)(?:\s+&quot;[^&]*&quot;)?\)/g, (_m, label: string, url: string) => {
    const href = safeHref(url.replace(/&amp;/g, '&'));
    if (!href) return label;
    const external = /^https?:\/\//i.test(href);
    return `<a href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
  });
  s = s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/(^|[^_\w])_([^_\s][^_]*?)_(?!\w)/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => codes[Number(i)] ?? '');
}

const HEADING = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/;
const BULLET = /^\s{0,3}[-*+]\s+(.*)$/;
const ORDERED = /^\s{0,3}\d+[.)]\s+(.*)$/;
const RULE = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_DIVIDER = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

export function markdownToHtml(markdown: string): string {
  const lines = String(markdown ?? '').replace(/\r\n?/g, '\n').split('\n');

  /* Heading level map: shallowest level used at least twice -> h2. */
  const levels = lines.map((l) => l.match(HEADING)?.[1].length).filter((n): n is number => Boolean(n));
  const counts = new Map<number, number>();
  levels.forEach((n) => counts.set(n, (counts.get(n) ?? 0) + 1));
  const repeated = [...counts.entries()].filter(([, c]) => c > 1).map(([n]) => n);
  const top = repeated.length ? Math.min(...repeated) : levels.length ? Math.min(...levels) : 2;
  const tag = (n: number) => `h${Math.min(6, Math.max(2, 2 + (n - top)))}`;

  const out: string[] = [];
  let para: string[] = [];
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let quote: string[] = [];

  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.type}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.type}>`);
    list = null;
  };
  const flushQuote = () => {
    if (quote.length) out.push(`<blockquote><p>${inline(quote.join(' '))}</p></blockquote>`);
    quote = [];
  };
  const flushAll = () => {
    flushPara();
    flushList();
    flushQuote();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      flushAll();
      continue;
    }
    const heading = line.match(HEADING);
    if (heading) {
      flushAll();
      const t = tag(heading[1].length);
      out.push(`<${t}>${inline(heading[2])}</${t}>`);
      continue;
    }
    if (RULE.test(line)) {
      flushAll();
      out.push('<hr>');
      continue;
    }
    if (TABLE_ROW.test(line) && i + 1 < lines.length && TABLE_DIVIDER.test(lines[i + 1])) {
      flushAll();
      const cells = (row: string) => row.trim().replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim()));
      const head = cells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && TABLE_ROW.test(lines[i])) rows.push(cells(lines[i++]));
      i -= 1;
      out.push(
        `<table><thead><tr>${head.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
          .join('')}</tbody></table>`,
      );
      continue;
    }
    const bullet = line.match(BULLET);
    const ordered = line.match(ORDERED);
    if (bullet || ordered) {
      flushPara();
      flushQuote();
      const type = bullet ? 'ul' : 'ol';
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push((bullet ?? ordered)![1]);
      continue;
    }
    const q = line.match(/^\s{0,3}>\s?(.*)$/);
    if (q) {
      flushPara();
      flushList();
      quote.push(q[1]);
      continue;
    }
    /* A wrapped continuation of the last list item. */
    if (list && /^\s{2,}\S/.test(line)) {
      list.items[list.items.length - 1] += ` ${line.trim()}`;
      continue;
    }
    flushList();
    flushQuote();
    para.push(line.trim());
  }
  flushAll();
  return out.join('\n');
}
