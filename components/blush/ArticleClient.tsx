'use client';

import { useEffect, useRef, useState } from 'react';
import { b } from '@/lib/blush';
import { SocialIcon, type SocialName } from './Icon';

type TocLink = { id: string; text: string };

/**
 * "On this page": the article's section headings as links, the one being read marked as you scroll. The list is
 * built on the server from the same pass that gave the headings their ids. On a phone it starts folded.
 */
export function ArticleToc({ items }: { items: TocLink[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '');
  const details = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (details.current && window.matchMedia('(max-width: 63.99rem)').matches) details.current.open = false;
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const update = () => {
      const line = window.innerHeight * 0.28;
      let current = items[0].id;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top - line <= 0) current = item.id;
      }
      setActive(current);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [items]);

  if (items.length < 2) return null;
  return (
    <nav className={b('toc')} aria-label="On this page" data-testid="article-contents">
      <details className={b('toc__details')} open ref={details}>
        <summary className={b('toc__summary')}>
          <span className={b('label')}>On this page</span>
        </summary>
        <ol className={b('toc__list')}>
          {items.map((item) => (
            <li key={item.id}>
              <a className={b('toc__link')} href={`#${item.id}`} aria-current={active === item.id ? 'true' : undefined}>
                {item.text}
              </a>
            </li>
          ))}
        </ol>
      </details>
    </nav>
  );
}

/** Round share icons: plain links to each network's share page, plus a copy-link button. */
export function ShareIcons({ url, title }: { url: string; title: string }) {
  const [status, setStatus] = useState('');
  const link = encodeURIComponent(url);
  const text = encodeURIComponent(title);
  const targets: { label: string; icon: SocialName; href: string }[] = [
    { label: 'Facebook', icon: 'facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${link}` },
    { label: 'X', icon: 'twitter-x', href: `https://x.com/intent/tweet?text=${text}&url=${link}` },
    { label: 'Pinterest', icon: 'pinterest', href: `https://pinterest.com/pin/create/button/?url=${link}&description=${text}` },
    { label: 'WhatsApp', icon: 'whatsapp', href: `https://api.whatsapp.com/send?text=${text}%20${link}` },
    { label: 'Email', icon: 'envelope', href: `mailto:?subject=${text}&body=${link}` },
  ];

  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('unavailable');
      await navigator.clipboard.writeText(url);
      setStatus('Link copied');
    } catch {
      setStatus('Copy failed');
    }
    window.setTimeout(() => setStatus(''), 1800);
  };

  return (
    <div className={b('share-rail')}>
      <p className={b('label share-rail__label')}>Share</p>
      <ul className={b('share-rail__list')}>
        {targets.map((t) => (
          <li key={t.label}>
            <a className={b('share-rail__btn')} href={t.href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${t.label}`} title={`Share on ${t.label}`}>
              <SocialIcon name={t.icon} size={16} />
            </a>
          </li>
        ))}
        <li>
          <button type="button" className={b('share-rail__btn')} onClick={copy} aria-label="Copy link" title="Copy link">
            <SocialIcon name="link-45deg" size={16} />
          </button>
        </li>
      </ul>
      <p className={b('txt-xs share-rail__status')} role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
