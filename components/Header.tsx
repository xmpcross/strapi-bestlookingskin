import Link from 'next/link';
import { SECTIONS, SITE } from '@/lib/site';
import { listCategories } from '@/lib/strapi';
import StickyHeaderShadow from '@/components/StickyHeaderShadow';

type NavChild = { label: string; href: string; heading?: false } | { label: string; heading: true };

/** One column of the Topics mega menu: a group heading and its hubs. */
type NavGroup = { label: string; items: { label: string; href: string }[] };

type NavItem = {
  label: string;
  href?: string;
  children?: NavChild[];
  /** Present instead of `children` when the item opens a mega menu. */
  groups?: NavGroup[];
};

export default async function Header() {
  /*
   * Topic hubs come from the CMS; the format buckets in SECTIONS stay hardcoded.
   *
   * These are two different axes and the nav had only ever shown one. SECTIONS
   * is how a post is written -- comparison, review, how-to -- and it is fixed by
   * the postType enum, so a constant is the right home for it. The hubs are what
   * a reader browses by, they are editorial, and they get added in Strapi: the
   * fifteen created on 11 Sep reached the footer, which reads listCategories(),
   * and never reached the header, which did not. Driving this from the CMS means
   * the next one added needs no deploy.
   */
  const sectionSlugs = new Set<string>(SECTIONS.map((section) => section.slug));
  const allCategories = await listCategories().catch(() => []);

  /*
   * Topics are grouped by their parent category: product type, skin concern,
   * cross-cutting. The grouping lives in the CMS as bls-category parent/child,
   * which the type already supported, so it needed no schema change and no
   * rebuild -- and a hub moved between groups in Strapi moves here too.
   *
   * The three group rows are headings, not destinations: they exist to organise
   * fifteen hubs that were otherwise one flat list. A hub with no parent still
   * shows: anything unassigned falls into a trailing "More" group rather
   * than vanishing from the nav, which is the failure mode that hid these
   * categories in the first place.
   */
  const groupOrder = ['product-type-hubs', 'skin-concern-hubs', 'cross-cutting-hubs'];
  const isGroupRow = (slug: string) => groupOrder.includes(slug);
  const hubs = allCategories.filter(
    (category) => !sectionSlugs.has(category.slug) && !isGroupRow(category.slug),
  );

  const groupLabel = new Map(
    allCategories.filter((c) => isGroupRow(c.slug)).map((c) => [c.slug, c.name]),
  );
  const topicGroups: NavGroup[] = [];
  for (const groupSlug of groupOrder) {
    const members = hubs.filter((h) => h.parent?.slug === groupSlug);
    if (!members.length) continue;
    topicGroups.push({
      label: groupLabel.get(groupSlug) ?? groupSlug,
      items: members.map((m) => ({ label: m.name, href: `/${m.slug}` })),
    });
  }
  const ungrouped = hubs.filter((h) => !h.parent || !isGroupRow(h.parent.slug));
  if (ungrouped.length) {
    topicGroups.push({
      label: 'More',
      items: ungrouped.map((m) => ({ label: m.name, href: `/${m.slug}` })),
    });
  }

  const nav: NavItem[] = [
    { label: 'Products', href: '/products' },
    { label: 'Brands', href: '/brands' },
    ...(topicGroups.length ? [{ label: 'Topics', groups: topicGroups }] : []),
    {
      label: 'Articles',
      href: '/informative-articles',
      children: [
        { label: 'All Articles', href: '/informative-articles' },
        ...SECTIONS.map((section) => ({
          label: section.title,
          href: `/${section.slug}`,
        })),
      ],
    },
    { label: 'Get in Touch', href: '/contact' },
  ];

  return (
    <header
      className="sticky top-0 z-50 border-b border-ink/10 bg-white backdrop-blur transition-shadow duration-200"
      data-testid="site-header"
    >
      <StickyHeaderShadow />
      {/* Single row: logo + search (next to logo) + nav (right-aligned). On
          smaller screens (< lg) the nav drops to a second row underneath so
          everything stays usable on tablet/mobile. */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3">
        <Link
          href="/"
          className="block shrink-0 text-ink"
          data-testid="logo-link"
          aria-label={`${SITE.name} home`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bestlookingskin_logo.svg"
            alt={SITE.name}
            width={320}
            height={100}
            className="h-12 w-auto sm:h-14"
          />
        </Link>

        <form
          action="/search"
          method="get"
          role="search"
          className="hidden md:flex h-10 w-full max-w-sm items-center gap-2 rounded-full border border-ink/15 bg-white px-4 transition focus-within:border-primary"
          data-testid="header-search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0 text-ink/50"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <label htmlFor="header-search-input" className="sr-only">Search {SITE.name}</label>
          <input
            id="header-search-input"
            type="search"
            name="q"
            placeholder="Search products, ingredients, guides…"
            className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/45"
            data-testid="header-search-input"
          />
        </form>

        {/* Category nav: dropdowns are visible on desktop; smaller screens keep
            horizontal scrolling so the top bar remains usable. */}
        <nav
          className="order-3 ml-auto w-full overflow-x-auto lg:order-none lg:w-auto lg:overflow-visible"
          data-testid="primary-nav"
          aria-label="Categories"
        >
          <ul className="flex min-w-max items-center justify-end gap-x-8 !text-[16px] !font-semibold capitalize tracking-normal">
            {nav.map((item) => {
              const testId = `nav-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
              const linkClass =
                'inline-flex items-center gap-1 whitespace-nowrap rounded-md px-0 py-2 font-semibold tracking-[0.2px] text-ink/85 transition-colors hover:text-primary';
              if (!item.children && !item.groups) {
                return (
                  <li key={item.label}>
                    <Link href={item.href!} className={linkClass} data-testid={testId}>
                      {item.label}
                    </Link>
                  </li>
                );
              }
              // Dropdown — open on hover or keyboard focus-within. Pure CSS,
              // no client component needed.
              return (
                <li key={item.label} className="group relative">
                  <button
                    type="button"
                    aria-haspopup="menu"
                    className={linkClass}
                    data-testid={testId}
                  >
                    {item.label}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                      className="transition-transform group-hover:rotate-180 group-focus-within:rotate-180"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <span className="absolute left-0 right-0 top-full hidden h-2 lg:block" aria-hidden />
                  {item.groups ? (
                    /*
                     * Mega menu. Fifteen hubs in a single scrolling dropdown
                     * meant the last group sat below the fold; side-by-side
                     * columns show every group at once, and the reader can see
                     * the shape of the taxonomy rather than one long list.
                     *
                     * flex-wrap rather than a fixed column count: the groups are
                     * built from the CMS, so the number of them is not known
                     * here, and a narrow window wraps a column instead of
                     * pushing the panel off-screen. Right-anchored and capped at
                     * the viewport width for the same reason -- Topics sits near
                     * the right end of the nav.
                     */
                    <div
                      role="menu"
                      className="invisible absolute right-0 top-[calc(100%+0.5rem)] z-20 flex max-w-[calc(100vw-3rem)] flex-wrap gap-x-10 gap-y-6 rounded-md border border-ink/10 bg-paper px-6 py-5 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                      data-testid={`${testId}-megamenu`}
                    >
                      {item.groups.map((group) => (
                        <div key={group.label} className="min-w-[11rem]">
                          <p className="pb-2 text-xs font-bold uppercase tracking-wider text-ink/45">
                            {group.label}
                          </p>
                          <ul role="none" className="space-y-1">
                            {group.items.map((child) => (
                              <li key={child.href} role="none">
                                <Link
                                  href={child.href}
                                  role="menuitem"
                                  className="block whitespace-nowrap rounded px-2 py-1.5 text-base !font-medium text-ink/85 transition-colors hover:bg-muted hover:text-primary"
                                  data-testid={`nav-${child.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
                                >
                                  {child.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                  <ul
                    role="menu"
                    className="invisible absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-[14rem] rounded-md border border-ink/10 bg-paper py-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                    data-testid={`${testId}-dropdown`}
                  >
                    {item.children!.map((child) => (
                      child.heading ? (
                        <li key={`h-${child.label}`} role="presentation">
                          <span className="block px-4 pb-1 pt-3 text-xs font-bold uppercase tracking-wider text-ink/45">
                            {child.label}
                          </span>
                        </li>
                      ) : (
                      <li key={child.label} role="none">
                        <Link
                          href={child.href}
                          role="menuitem"
                          className="block whitespace-nowrap px-4 py-2 text-base !font-medium text-ink/85 transition-colors hover:bg-muted hover:text-primary"
                          data-testid={`nav-${child.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
                        >
                          {child.label}
                        </Link>
                      </li>
                      )
                    ))}
                  </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
