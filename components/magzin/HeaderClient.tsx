'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { SITE } from '@/lib/site';
import type { NavItem } from '@/lib/nav';
import { CloseIcon, MenuIcon, SearchIcon, ThemeIcon } from './icons';

/*
 * The header's interactive parts: sticky/hide-on-scroll, the search panel, the theme switch and the
 * off-canvas side menu. Plain React state (the template drove these with document.querySelector).
 */
export type SearchTag = { label: string; href: string; count: number };
export type SearchPick = { href: string; title: string; image: string; date: string; readMinutes: number | null };

export default function HeaderClient({
  nav,
  menu,
  searchTags,
  searchPicks,
}: {
  nav: NavItem[];
  menu: React.ReactNode;
  searchTags: SearchTag[];
  searchPicks: SearchPick[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  /* The theme lives on <html data-bs-theme> (set before paint by the inline script in app/layout.tsx); the
     switch follows that attribute. */
  const dark = useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
      return () => observer.disconnect();
    },
    () => document.documentElement.getAttribute('data-bs-theme') === 'dark',
    () => false,
  );

  /* A client-rendered root (the 404 page) replaces <html> and drops the attribute the inline script set: put the
     saved theme back. */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      if ((saved === 'dark' || saved === 'light') && document.documentElement.getAttribute('data-bs-theme') !== saved) {
        document.documentElement.setAttribute('data-bs-theme', saved);
      }
    } catch {
      /* storage blocked */
    }
  }, []);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Close panels on navigation (state adjusted during render, React's pattern for props-driven resets). */
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setSearchOpen(false);
    setMenuOpen(false);
  }

  /* Sticky navbar after 100px; slides away while scrolling down, back when scrolling up. */
  useEffect(() => {
    const navbar = document.querySelector<HTMLElement>('header .navbar');
    if (!navbar) return;
    navbar.style.transition = 'transform 0.3s ease';
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      ['navbar-stick', 'top-0', 'position-fixed', 'w-100'].forEach((c) => navbar.classList.toggle(c, y > 100));
      navbar.style.transform = y > 100 && y > last ? 'translateY(-100%)' : 'translateY(0)';
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleTheme = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-bs-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* private mode */
    }
  };

  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? 'hidden' : '';
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, searchOpen]);

  const submitSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get('q') ?? '').trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <header data-testid="site-header">
        <nav className="navbar style-4" aria-label="Main">
          <div className="container">
            <div className="header d-flex align-items-center justify-content-between w-100">
              <div className="d-flex align-items-center">
                <Link className="navbar-brand" href="/" aria-label={`${SITE.name} home`} data-testid="logo-link">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="logo-light" src="/bestlookingskin_logo.svg" width={175} height={36} alt={SITE.name} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="logo-dark" src="/bestlookingskin_logo-light.svg" width={175} height={36} alt="" aria-hidden="true" />
                </Link>
              </div>
              <div className="navbar-collapse d-none d-lg-block">{menu}</div>
              <div className="d-flex align-items-center gap-4">
                <button
                  type="button"
                  className="search-btn fs-7 d-none d-md-flex link-effect-2 border-0 bg-transparent"
                  onClick={() => setSearchOpen(true)}
                  aria-label={`Search ${SITE.name}`}
                >
                  <SearchIcon />
                  Search
                </button>
                <div className="group-btn-right d-flex align-items-center">
                  <button
                    type="button"
                    className="dark-light-switcher border-0 bg-transparent"
                    onClick={toggleTheme}
                    aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    <ThemeIcon dark={dark} />
                  </button>
                  <button
                    type="button"
                    className="navbar-toggler border-0 bg-transparent"
                    onClick={() => setMenuOpen(true)}
                    aria-label="Open menu"
                    aria-expanded={menuOpen}
                  >
                    <MenuIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Panels sit outside the navbar: it is transformed while scrolling, which would pin fixed children to it. */}

      {/* Search panel */}
      <div className={`popup-search ${searchOpen ? 'show' : ''}`} role="dialog" aria-modal="true" aria-label="Search" aria-hidden={!searchOpen}>
        <div className="container">
          <div className="row">
            <div className="col-lg-10 col-12 mx-auto">
              <div className="popup-search-content position-relative">
                <button
                  type="button"
                  className="close-popup position-absolute top-0 end-0 m-3 border-0 bg-transparent"
                  onClick={() => setSearchOpen(false)}
                  aria-label="Close search"
                >
                  <CloseIcon />
                </button>
                <h2 className="h5 mb-4">Search</h2>
                <form onSubmit={submitSearch} className="d-flex flex-wrap flex-lg-nowrap gap-2" role="search">
                  <label htmlFor="site-search" className="visually-hidden">
                    Search {SITE.name}
                  </label>
                  <input ref={inputRef} id="site-search" name="q" className="form-control" type="search" placeholder="What Are You Looking For?" />
                  <button className="btn btn-dark" type="submit">
                    Search
                  </button>
                </form>
                {searchTags.length > 0 && (
                  <div className="block-tag mt-5">
                    {searchTags.map((t) => (
                      <Link key={t.href} href={t.href} className="tag-item" aria-label={`${t.label}, ${t.count} ${t.count === 1 ? 'post' : 'posts'}`}>
                        <span>{t.label}</span>
                        <span className="number">{t.count}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {searchPicks.length > 0 && (
                  <div className="block-recomment mt-5">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <svg className="dark-mode-invert" xmlns="http://www.w3.org/2000/svg" width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M0.582044 11.7285C8.79451 13.4712 10.252 14.8614 12.125 22.7372C13.8067 14.8768 15.2308 13.4992 23.4018 11.8279C15.1894 10.0852 13.7319 8.69503 11.8589 0.81924C10.1769 8.67956 8.75306 10.0571 0.582044 11.7285Z" fill="#0E0E0F" />
                      </svg>
                      <h2 className="h5 mb-0">Recommended for you</h2>
                    </div>
                    <div className="search-picks">
                      {searchPicks.map((p) => (
                        <div className="article card-10 style-1 search-pick" key={p.href}>
                          <Link href={p.href} className="card-img" tabIndex={-1} aria-hidden>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img className="w-100" src={p.image} alt="" width={108} height={83} loading="lazy" />
                          </Link>
                          <div className="card-body">
                            <Link href={p.href}>
                              <span className="h6 fs-7 mb-2 text-truncate-2">{p.title}</span>
                            </Link>
                            <div className="d-flex align-items-center text-600">
                              <span className="fs-8">{p.date}</span>
                              {p.readMinutes ? (
                                <ul className="ps-4 m-0">
                                  <li>
                                    <span className="fs-8">{p.readMinutes} min read</span>
                                  </li>
                                </ul>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={`popup-search-overlay ${searchOpen ? 'active' : ''}`} onClick={() => setSearchOpen(false)} />

      {/* Off-canvas side menu (all widths; the only menu on mobile) */}
      <div className={`sidebar-left ${menuOpen ? 'active' : ''}`} aria-hidden={!menuOpen}>
        <div className="header-sidebar d-flex align-items-center justify-content-between py-3">
          <Link href="/" className="sidebar-brand" aria-label={`${SITE.name} home`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/bestlookingskin_logo.svg" width={150} height={31} alt={SITE.name} />
          </Link>
          <button type="button" className="close-sidebar border-0 bg-transparent" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={submitSearch} className="d-flex gap-2 mb-4 d-md-none" role="search">
          <input name="q" className="form-control fs-7" type="search" placeholder="Search" aria-label="Search" />
          <button className="btn btn-dark px-3" type="submit">
            Go
          </button>
        </form>
        <ul className="sidebar-nav list-unstyled ps-0">
          {nav.map((item) => {
            const children = item.groups ? item.groups.flatMap((g) => g.items) : item.children;
            if (!children) {
              return (
                <li className="nav-item" key={item.label}>
                  <Link className="nav-link mb-2" href={item.href!}>
                    {item.label}
                  </Link>
                </li>
              );
            }
            const open = openSection === item.label;
            return (
              <li className={`nav-item collapse ${open ? 'active' : ''}`} key={item.label}>
                <button
                  type="button"
                  className="nav-link mb-2 collapse-toggle border-0 bg-transparent w-100 text-start"
                  onClick={() => setOpenSection(open ? null : item.label)}
                  aria-expanded={open}
                >
                  {item.label}
                </button>
                <ul className="collapse-menu d-flex flex-column gap-1 list-unstyled" style={{ maxHeight: open ? `${(children.length + (item.href ? 1 : 0)) * 44}px` : undefined }}>
                  {/* On mobile the group header is a toggle button, so without this
                      row there is no way to reach the section's own page at all. */}
                  {item.href && (
                    <li>
                      <Link className="collapse-item fw-semi-bold" href={item.href}>
                        All {item.label.toLowerCase()}
                      </Link>
                    </li>
                  )}
                  {children.map((c) => (
                    <li key={c.href}>
                      <Link className="collapse-item" href={c.href}>
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
        <div className="text-center mt-4">
          <p className="fs-7">
            © {new Date().getFullYear()} <span className="text-dark">{SITE.name}</span>
          </p>
        </div>
      </div>
      <div className={`sidebar-overlay ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(false)} />
    </>
  );
}
