'use client';

import { useEffect, useState } from 'react';

/* Magzin's scroll-progress back-to-top button. */
export default function BackToTop() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(window.scrollY > 100);
      setProgress(max > 0 ? (window.scrollY / max) * 139.988 : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <button
      type="button"
      className={`btn-scroll-top border-0 ${visible ? 'active-progress' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{ display: visible ? 'flex' : 'none' }}
      aria-label="Back to top"
    >
      <svg className="progress-square svg-content" width="100%" height="100%" viewBox="0 0 40 40" aria-hidden>
        <path d="M20 1a19 19 0 1 1 0 38 19 19 0 0 1 0-38" style={{ transition: 'stroke-dashoffset 10ms linear', strokeDasharray: '139.988px', strokeDashoffset: `${139.988 - progress}px` }} />
      </svg>
    </button>
  );
}
