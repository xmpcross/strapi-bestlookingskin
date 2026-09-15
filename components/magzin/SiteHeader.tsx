import Link from 'next/link';
import { SITE } from '@/lib/site';
import { getNav } from '@/lib/nav';
import HeaderClient from './HeaderClient';

/* Magzin header style 2: menu left, logo centred, search / theme / side-menu toggle right. Menus open on hover (CSS). */
export default async function SiteHeader() {
  const { nav, topics } = await getNav();
  const LinkText = ({ label }: { label: string }) => (
    <>
      <span className="text-1">{label}</span>
      <span className="text-2">{label}</span>
    </>
  );
  return (
    <header data-testid="site-header">
      <nav className="navbar style-2" aria-label="Main">
        <div className="navbar-collapse d-none d-lg-block">
          <ul className="navbar-nav">
            {nav.map((item) =>
              item.groups ? (
                <li key={item.label} className="nav-item mega-menu-item">
                  <a className="nav-link dropdown-toggle dropdown-mega-menu link-effect-1" href="#" aria-haspopup="true">
                    <LinkText label={item.label} />
                  </a>
                  <div className="sub-mega-menu">
                    <div className="container">
                      <div className="row g-4">
                        {item.groups.map((group) => (
                          <div className="col-lg-3 col-6" key={group.slug}>
                            <h6 className="mb-3">{group.label}</h6>
                            <ul className="list-unstyled ps-0 d-flex flex-column gap-2">
                              {group.items.map((link) => (
                                <li key={link.href}>
                                  <Link className="text-600 hover-dark" href={link.href}>
                                    {link.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </li>
              ) : item.children ? (
                <li key={item.label} className="nav-item dropdown">
                  <Link className="nav-link dropdown-toggle link-effect-1" href={item.href ?? '#'}>
                    <LinkText label={item.label} />
                  </Link>
                  <ul className="dropdown-menu">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link className="dropdown-item" href={child.href}>
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={item.label} className="nav-item">
                  <Link className="nav-link link-effect-1" href={item.href!}>
                    <LinkText label={item.label} />
                  </Link>
                </li>
              ),
            )}
          </ul>
        </div>
        <Link className="navbar-brand" href="/" aria-label={`${SITE.name} home`} data-testid="logo-link">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="dark-mode-invert" src="/bestlookingskin_logo.svg" width={150} height={47} alt={SITE.name} />
        </Link>
        <HeaderClient nav={nav} topics={topics} />
      </nav>
    </header>
  );
}
