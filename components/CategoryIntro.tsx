'use client';

import { useState } from 'react';

/**
 * A category's introduction: the CMS description split into paragraphs on blank lines.
 *
 * The first paragraph always shows, ending with an inline "Read more" link; the rest are rendered but
 * `hidden` until it is clicked, so the full text is in the server HTML for search engines. Open, the
 * "Read less" link sits at the end of the last paragraph.
 */
export default function CategoryIntro({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (!paras.length) return null;
  const [first, ...rest] = paras;

  const toggle = (label: string) => (
    <>
      {' '}
      <button type="button" className="bls-category-intro-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        {label}
      </button>
    </>
  );

  return (
    <div className="bls-category-intro mt-3">
      <p>
        {first}
        {rest.length > 0 && !open && toggle('Read more')}
      </p>
      {rest.map((para, i) => (
        <p key={para.slice(0, 40)} hidden={!open}>
          {para}
          {open && i === rest.length - 1 && toggle('Read less')}
        </p>
      ))}
    </div>
  );
}
