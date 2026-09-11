'use client';

import { useEffect, useRef } from 'react';

/**
 * Renders post body HTML.
 *
 * Source posts come from a WordPress site that bakes a "GreenShift / GSPB" block
 * into the markup — inline <style> chunks, .gspb_* class names and a flex column
 * layout. Tailwind's `prose` class fights GSPB's layout (forces block images,
 * adds vertical margins between siblings, etc.), so we render plain HTML and
 * style only the non-GSPB elements via globals.css scoped to `.post-content`.
 *
 * Also wires GreenShift FAQ accordions: the source's vanilla JS isn't running
 * here, so on mount we collapse every `.gs-accordion-item` (add `.gsclose`)
 * and attach a click handler on its title that toggles the class. CSS in
 * globals.css hides `.gsclose > .gs-accordion-item__content`.
 *
 * Affiliate-tag rewriting happens at import time (server-side, in the importer)
 * — not here.
 */
/**
 * Turn a trailing FAQ section into an accordion.
 *
 * The generated posts end with "<h2>Frequently Asked Questions</h2>" followed
 * by a flat run of h3/answer pairs -- 74 of 100 posts carry one -- which reads
 * as a wall of text the reader scrolls past.
 *
 * <details> rather than a client component or a checkbox trick: every answer
 * stays in the HTML even while collapsed, so crawlers and FAQ structured data
 * still see the full text, and the open/close behaviour is the browser's own,
 * keyboard accessible with nothing to wire up.
 *
 * Anchored on the heading text and stopped at the next h2, so a post without
 * that section is returned untouched and FAQ-shaped content elsewhere in the
 * article is left alone. Fewer than two pairs is not a FAQ run, so it bails.
 */
function withFaqAccordion(value: string) {
  const html = String(value || '');
  const heading = /<h([23])\b[^>]*>(?:(?!<\/h\1>).)*(?:FAQ|Frequently\s+Asked)(?:(?!<\/h\1>).)*<\/h\1>/i;
  const match = html.match(heading);
  if (!match) return html;

  const start = html.search(heading);
  const afterHeading = start + match[0].length;
  const rest = html.slice(afterHeading);
  const nextH2 = rest.search(/<h2\b/i);
  const sectionEnd = nextH2 === -1 ? html.length : afterHeading + nextH2;
  const section = html.slice(afterHeading, sectionEnd);

  /*
   * Two shapes in this library, both from the same generator:
   *   <h3>Question</h3><p>Answer</p>            -- 62 posts
   *   <p><strong>Question?</strong> Answer</p>  -- 13 posts
   * Handling only the first left a fifth of the posts as flat walls of text
   * while the run reported success.
   */
  let pairs: { q: string; a: string }[] = [...section.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3\b|$)/gi)]
    .map((m) => ({ q: m[1], a: m[2] }));

  if (pairs.length < 2) {
    pairs = [...section.matchAll(
      /<p[^>]*>\s*<strong[^>]*>([\s\S]*?)<\/strong>([\s\S]*?)<\/p>([\s\S]*?)(?=<p[^>]*>\s*<strong|$)/gi,
    )]
      /* Only question-shaped bold leads. A bold run opening an ordinary
         paragraph is emphasis, not a FAQ entry. */
      .filter((m) => /\?\s*$/.test(m[1].replace(/<[^>]+>/g, '').trim()))
      .map((m) => ({ q: m[1], a: `${m[2].trim() ? `<p>${m[2].trim()}</p>` : ''}${m[3]}` }));
  }

  if (pairs.length < 2) return html;

  const items = pairs
    .map((pair) => {
      const question = pair.q.replace(/<[^>]+>/g, '').trim();
      const answer = pair.a.trim();
      if (!question || !answer) return '';
      return (
        '<details class="faq-item">' +
        `<summary class="faq-question">${question}<span class="faq-icon" aria-hidden="true"></span></summary>` +
        `<div class="faq-answer">${answer}</div>` +
        '</details>'
      );
    })
    .join('');
  if (!items) return html;

  /* "FAQs" rather than the generator's "Frequently Asked Questions": shorter,
     and it stops a heading running two lines in the narrowed article column. */
  const renamedHeading = match[0].replace(/>([^<]*)</, '>FAQs<');
  return (
    html.slice(0, start) +
    renamedHeading +
    `<div class="faq-accordion">${items}</div>` +
    html.slice(sectionEnd)
  );
}

export default function PostContent({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const items = root.querySelectorAll<HTMLElement>('.gs-accordion-item');
    const cleanups: Array<() => void> = [];
    // Track the first item per accordion so question 1 starts open.
    const openedFirst = new Set<Element>();

    items.forEach((item) => {
      const accordion = item.closest('.gs-accordion') ?? root;
      const isFirst = !openedFirst.has(accordion);
      if (isFirst) openedFirst.add(accordion);
      // Auto-open the first question of each accordion; collapse the rest.
      if (!isFirst) item.classList.add('gsclose');
      const title = item.querySelector<HTMLElement>('.gs-accordion-item__title');
      if (!title) return;
      title.setAttribute('role', 'button');
      title.setAttribute('tabindex', '0');
      const onActivate = (e: Event) => {
        if (e instanceof KeyboardEvent && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        item.classList.toggle('gsclose');
        title.setAttribute('aria-expanded', String(!item.classList.contains('gsclose')));
      };
      title.setAttribute('aria-expanded', String(isFirst));
      title.addEventListener('click', onActivate);
      title.addEventListener('keydown', onActivate);
      cleanups.push(() => {
        title.removeEventListener('click', onActivate);
        title.removeEventListener('keydown', onActivate);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [html]);

  return (
    <div
      ref={ref}
      className="post-content"
      data-testid="post-content"
      dangerouslySetInnerHTML={{ __html: withFaqAccordion(html) }}
    />
  );
}
