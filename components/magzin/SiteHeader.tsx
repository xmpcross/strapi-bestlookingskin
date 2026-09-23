import Link from 'next/link';
import { getNav } from '@/lib/nav';
import { toCard } from '@/lib/post-card';
import { listPostSummaries, type BlsPostSummary } from '@/lib/strapi';
import HeaderClient, { type SearchPick, type SearchTag } from './HeaderClient';

const none = { data: [] as BlsPostSummary[], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

/*
 * Magzin header style 4 (the "Personal" home): logo left, the menu in a rounded pill in the middle, search / theme /
 * side-menu toggle right. Menus open on hover (CSS). The menu is rendered here on the server and handed to
 * HeaderClient, which owns the layout and the interactive panels.
 */
/*
 * Two copies of the label, because the hover effect slides one out as the other
 * comes in.
 *
 * The second is aria-hidden. Without it the accessible name and the anchor text
 * a crawler extracts are both doubled -- "ProductsProducts", "ContactContact" --
 * and anchor text is a signal about the page being linked to, so every primary
 * nav link was sending a garbled one.
 */
function LinkText({ label }: { label: string }) {
  return (
    <>
      <span className="text-1">{label}</span>
      <span className="text-2" aria-hidden="true">
        {label}
      </span>
    </>
  );
}

export default async function SiteHeader() {
  const { nav, topics } = await getNav();
  /*
   * Search panel data. Same queries as the home page's topic chips and guide grid, so the fetch cache serves both.
   * Counts are real post totals per hub; the picks are the newest authored guides with a cover.
   */
  const hubs = topics.flatMap((g) => g.items);
  const [hubData, guides] = await Promise.all([
    Promise.all(hubs.map((h) => listPostSummaries({ category: h.href.replace(/^\//, ''), pageSize: 1, withCover: true }).catch(() => none))),
    listPostSummaries({ authored: true, withCover: true, pageSize: 40 }).catch(() => none),
  ]);
  const searchTags: SearchTag[] = hubs
    .map((h, i) => ({ ...h, count: hubData[i].meta.pagination.total }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 9);
  const searchPicks: SearchPick[] = guides.data
    .map(toCard)
    .filter((c) => c.image)
    .slice(0, 3)
    .map((c) => ({ href: c.href, title: c.title, image: c.image!, date: c.date, readMinutes: c.readMinutes }));
  const menu = (
    <ul className="navbar-nav">
      {nav.map((item) =>
        item.groups ? (
          <li key={item.label} className="nav-item mega-menu-item">
            {/* A real destination, not href="#": the menu opens on hover, and the
                link is where the crawler and a keyboard user both end up. */}
            <Link
              className="nav-link dropdown-toggle dropdown-mega-menu link-effect-1"
              href={item.href ?? '#'}
              aria-haspopup="true"
            >
              <LinkText label={item.label} />
            </Link>
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
  );
  return <HeaderClient nav={nav} menu={menu} searchTags={searchTags} searchPicks={searchPicks} />;
}
