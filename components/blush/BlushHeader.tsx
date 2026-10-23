'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { b } from '@/lib/blush';
import type { BlushNavItem } from '@/lib/blush-nav';
import { Icon } from './Icon';

const NAME = 'BestLooking.Skin';

function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`${b('wordmark wordmark--logo')} ${className}`.trim()} aria-label={`${NAME} home`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={b('logo logo--on-light')} src="/bestlookingskin_logo.svg" width={194} height={40} alt={NAME} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={b('logo logo--on-dark')} src="/bestlookingskin_logo-light.svg" width={194} height={40} alt="" aria-hidden="true" />
    </Link>
  );
}

/**
 * The Blush header: logo left, the links in a pill, search and the theme toggle on the right, and below the nav
 * breakpoint a menu button that opens a drawer. Dropdowns open on hover and focus in CSS; the state here is for
 * a tap on a touch screen.
 */
export default function BlushHeader({ nav }: { nav: BlushNavItem[] }) {
  const [openParent, setOpenParent] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  /* Colour theme: the same localStorage key the Magzin pages use, applied to the .blush wrapper. */
  const applyTheme = useCallback((theme: 'light' | 'dark') => {
    document.querySelector('.blush')?.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') applyTheme(saved);
    } catch {
      /* storage blocked: stay on the default */
    }
  }, [applyTheme]);

  const toggleTheme = () => {
    const current = document.querySelector('.blush')?.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* ignore */
    }
  };

  /* The drawer: a class on the wrapper dims the page, Escape and the scrim close it. */
  useEffect(() => {
    const wrapper = document.querySelector('.blush');
    wrapper?.classList.toggle('bl-has-open-drawer', drawer);
    if (!drawer) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawer(false);
    };
    document.addEventListener('keydown', onKey);
    drawerRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [drawer]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('[data-dropdown]')) setOpenParent(null);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const closeDrawer = () => {
    setDrawer(false);
    openerRef.current?.focus();
  };

  return (
    <>
      <header className={b('site-header')}>
        <div className={b('container site-header__inner')}>
          <Logo />

          <nav className={b('nav')} aria-label="Primary">
            {nav.map((item) =>
              item.children?.length ? (
                <div key={item.label} className={`${b('nav__parent')}${openParent === item.label ? ` ${b('is-open')}` : ''}`} data-dropdown>
                  <button
                    type="button"
                    className={b('nav__item nav__item--parent')}
                    aria-expanded={openParent === item.label}
                    aria-controls={`bl-nav-${item.label.toLowerCase()}`}
                    onClick={() => setOpenParent(openParent === item.label ? null : item.label)}
                  >
                    {item.label}
                    <Icon name="chevron-down" size={14} className={b('nav__caret')} />
                  </button>
                  <div className={`${b('nav__dropdown')}${item.children.length > 8 ? ` ${b('nav__dropdown--wide')}` : ''}`} id={`bl-nav-${item.label.toLowerCase()}`}>
                    <ul className={b('nav__dropdown-list')}>
                      {item.children.map((child) => (
                        <li key={child.href + child.label}>
                          <Link className={b('nav__sublink')} href={child.href}>
                            <span className={b('nav__sublink-name')}>{child.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <Link key={item.label} className={b('nav__item')} href={item.href}>
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className={b('header-actions')}>
            <Link className={b('icon-btn header-search')} href="/search" aria-label="Search guides">
              <Icon name="search" size={18} />
              <span className={b('header-search__label')}>Search</span>
            </Link>

            <button type="button" className={b('icon-btn theme-toggle')} onClick={toggleTheme} aria-label="Switch color theme">
              <Icon name="sun" className={b('theme-icon-sun')} />
              <Icon name="moon" className={b('theme-icon-moon')} />
            </button>

            <button
              ref={openerRef}
              type="button"
              className={b('icon-btn menu-button')}
              aria-controls="bl-site-drawer"
              aria-expanded={drawer}
              onClick={() => setDrawer(true)}
            >
              <Icon name="menu" size={20} />
              <span className={b('sr-only')}>Open site menu</span>
            </button>
          </div>
        </div>
      </header>

      <div className={b('drawer-scrim')} onClick={closeDrawer} aria-hidden="true" />
      <aside ref={drawerRef} id="bl-site-drawer" className={b('drawer')} aria-label="Site menu" hidden={!drawer}>
        <div className={b('drawer__bar')}>
          <Logo />
          <button type="button" className={b('icon-btn icon-btn--line')} onClick={closeDrawer} aria-label="Close menu">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className={b('drawer__body')}>
          <Link className={b('drawer__search')} href="/search" onClick={closeDrawer}>
            <Icon name="search" size={16} />
            <span>Search guides</span>
          </Link>

          <nav className={b('drawer__group')} aria-label="Menu">
            <ul className={b('drawer__list')}>
              {nav
                .filter((item) => !item.children?.length)
                .map((item) => (
                  <li key={item.label}>
                    <Link className={b('drawer__link')} href={item.href} onClick={closeDrawer}>
                      {item.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>

          {nav
            .filter((item) => item.children?.length)
            .map((item) => (
              <nav key={item.label} className={b('drawer__group')} aria-label={item.label}>
                <p className={b('label txt-dim')}>{item.label}</p>
                <ul className={b('drawer__list')}>
                  {item.children?.map((child) => (
                    <li key={child.href + child.label}>
                      <Link className={b('drawer__small')} href={child.href} onClick={closeDrawer}>
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
        </div>
      </aside>
    </>
  );
}
