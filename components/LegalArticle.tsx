import { Children, cloneElement, isValidElement } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import ReadingRail from '@/components/ReadingRail';
import type { TocItem } from '@/lib/toc';

const NAV: { key: 'terms' | 'privacy' | 'cookies' | 'disclosure'; label: string; href: string }[] = [
  { key: 'terms',      label: 'Terms and Conditions', href: '/legal/terms' },
  { key: 'privacy',    label: 'Privacy Policy',       href: '/legal/privacy' },
  { key: 'cookies',    label: 'Cookie Policy',        href: '/legal/cookies' },
  { key: 'disclosure', label: 'Affiliate Disclosure', href: '/legal/disclosure' },
];

export type LegalKey = (typeof NAV)[number]['key'];


/** Flatten a JSX subtree to its text, so a heading containing <strong> or a
    link still yields a usable label. */
function textOf(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement(node)) return textOf((node.props as { children?: React.ReactNode }).children);
  return '';
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);

/**
 * Build the contents from the page's own headings.
 *
 * These pages are JSX, not an HTML string, so lib/toc.ts (which parses markup)
 * does not apply -- the headings are walked as React children instead and given
 * their ids here. That keeps the list automatic: a section added to any legal
 * page appears in its contents with nothing else to update, and a list typed
 * out by hand would drift the first time one was edited.
 *
 * Ids are deduplicated because two pages do repeat a heading, and a duplicate
 * id silently sends every link to the first one.
 */
function withContents(children: React.ReactNode): { nodes: React.ReactNode; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Set<string>();

  const nodes = Children.map(children, (child) => {
    if (!isValidElement(child) || child.type !== 'h3') return child;
    const text = textOf((child.props as { children?: React.ReactNode }).children).trim();
    if (!text) return child;

    let id = slugify(text) || `section-${toc.length + 1}`;
    let n = 2;
    while (used.has(id)) { id = `${slugify(text)}-${n}`; n += 1; }
    used.add(id);

    toc.push({ id, text, level: 2 });
    return cloneElement(child as React.ReactElement<{ id?: string }>, { id });
  });

  return { nodes, toc };
}

export default function LegalArticle({
  pageKey,
  title,
  modified,
  children,
}: {
  pageKey: LegalKey;
  title: string;
  /** ISO date, e.g. "2026-05-02" */
  modified: string;
  children: React.ReactNode;
}) {
  const { nodes, toc } = withContents(children);

  let modifiedLabel = '';
  try { modifiedLabel = format(parseISO(modified), 'MMM d, yyyy'); } catch { /* ignore */ }

  return (
    <div data-testid={`legal-${pageKey}`}>
      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Legal</p>
          <h1 className="mt-4 font-display font-bold leading-tight tracking-tight text-ink">
            {title}
          </h1>
          {modifiedLabel && (
            <p className="mt-3 text-sm text-ink/55">Last updated {modifiedLabel}</p>
          )}

          {/* Operator attribution — present on every legal page */}
          <p className="mt-5 max-w-3xl text-sm leading-6 text-ink/70" data-testid="operator-attribution">
            This website, <a href="https://www.bestlooking.skin" className="font-medium text-ink hover:text-primary">www.bestlooking.skin</a>, is owned and operated by{' '}
            <strong className="text-ink">FXN Holdings</strong>, a registered business in Australia.
          </p>

          <nav className="mt-6 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider" aria-label="Legal pages">
            {NAV.map((n) => {
              const active = n.key === pageKey;
              return (
                <Link
                  key={n.key}
                  href={n.href}
                  className={
                    active
                      ? 'rounded-full bg-primary px-4 py-2 text-white'
                      : 'rounded-full border border-ink/15 px-4 py-2 text-ink transition hover:border-primary hover:text-primary'
                  }
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      <section className="bg-white py-12">
        {/* Contents rail left, policy right. The rail is the same component the
            articles use, so the scroll-spy and active highlight come with it. */}
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
          {toc.length > 1 ? (
            <ReadingRail toc={toc} targetId="legal-body" />
          ) : (
            <div aria-hidden />
          )}

        <article className="min-w-0" id="legal-body">
          <div
            className="legal-content space-y-5 text-base leading-7 text-ink/80
                       [&_h3]:mt-10 [&_h3]:mb-3 [&_h3]:font-display [&_h3]:font-bold [&_h3]:text-ink
                       [&_h4]:mt-6  [&_h4]:mb-2 [&_h4]:font-display [&_h4]:font-bold [&_h4]:text-ink
                       [&_p]:my-3
                       [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1
                       [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1
                       [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline
                       [&_strong]:text-ink"
          >
            {nodes}
          </div>
        </article>
        </div>
      </section>
    </div>
  );
}
