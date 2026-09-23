'use client';

import { useLayoutEffect, useRef, useState } from 'react';

/**
 * A category's introduction: the CMS description split into paragraphs on blank lines.
 *
 * Collapsed, it shows about a line and a half of the first paragraph followed by "… Read more". The cut is
 * measured against the rendered width (canvas text metrics in the paragraph's own font), so it lands at the
 * same visual point on a phone and on a desktop. Everything past the cut is still in the HTML -- the rest
 * of the first paragraph in a `hidden` span, later paragraphs `hidden` -- so search engines read the whole
 * introduction. Open, "Read less" sits at the end of the last paragraph.
 */
const LINES = 1.5;
/* Used for the server render and until the first measurement: roughly 1.5 lines at desktop width. */
const DEFAULT_CUT = 220;

export default function CategoryIntro({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [cut, setCut] = useState<number | null>(null);
  const ref = useRef<HTMLParagraphElement>(null);

  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const first = paras[0] ?? '';

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return;

    const measure = () => {
      const style = getComputedStyle(el);
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const toggle = getComputedStyle(el.querySelector('button') ?? el);
      const suffix = ctx.measureText('… ').width + measureWith(ctx, 'Read more', `${toggle.fontWeight} ${toggle.fontSize} ${toggle.fontFamily}`, ctx.font);
      /* Lay the words out line by line, the way the browser wraps them: fill the first line, then take
         the second up to about half its width (with room for "… Read more"). */
      const W = el.clientWidth;
      const space = ctx.measureText(' ').width;
      let line = 0;
      let lineWidth = 0;
      let best = 0;
      let pos = 0;
      for (const word of first.split(' ')) {
        const w = ctx.measureText(word).width;
        const next = lineWidth ? lineWidth + space + w : w;
        if (next > W) { line += 1; lineWidth = w; } else lineWidth = next;
        if (line > 1 || (line === 1 && lineWidth + suffix > W * (LINES - 1))) break;
        pos += (pos ? 1 : 0) + word.length;
        best = pos;
      }
      setCut(best);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [first]);

  if (!paras.length) return null;

  const at = cut ?? cutAtWord(first, DEFAULT_CUT);
  const truncates = paras.length > 1 || at < first.length;
  /* Visible part, without trailing punctuation before the ellipsis; the rest stays in the HTML. */
  const shown = first.slice(0, at).replace(/[\s,;:.\u2014-]+$/, '');

  const toggle = (label: string) => (
    <>
      {' '}
      <button type="button" className="bls-category-intro-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        {label}
      </button>
    </>
  );

  if (!truncates) {
    return (
      <div className="bls-category-intro mt-3">
        <p ref={ref}>{first}</p>
      </div>
    );
  }

  return (
    <div className="bls-category-intro mt-3">
      <p ref={ref}>
        {open ? (
          first
        ) : (
          <>
            {shown}
            <span hidden>{first.slice(shown.length)}</span>…
          </>
        )}
        {!open && toggle('Read more')}
        {open && paras.length === 1 && toggle('Read less')}
      </p>
      {paras.slice(1).map((para, i) => (
        <p key={para.slice(0, 40)} hidden={!open}>
          {para}
          {open && i === paras.length - 2 && toggle('Read less')}
        </p>
      ))}
    </div>
  );
}

/** Width of `text` in `font`, restoring the context's previous font. */
function measureWith(ctx: CanvasRenderingContext2D, text: string, font: string, restore: string) {
  ctx.font = font;
  const w = ctx.measureText(text).width;
  ctx.font = restore;
  return w;
}

/** The last word boundary at or before `max` characters. */
function cutAtWord(s: string, max: number) {
  if (s.length <= max) return s.length;
  const i = s.lastIndexOf(' ', max);
  return i > 0 ? i : max;
}
