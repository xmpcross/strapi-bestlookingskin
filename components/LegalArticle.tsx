import { Children, cloneElement, isValidElement } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import ReadingRail from '@/components/ReadingRail';
import Breadcrumb from '@/components/magzin/Breadcrumb';
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
      <section className="sec-breadcumb">
        <div className="container">
          <Breadcrumb items={[{ label: title }]} />
          <div className="row align-items-end">
            <div className="col-lg-9 col-12">
              <div className="title">
                <p className="bls-eyebrow mb-3">Legal</p>
                <h1 className="h3 mb-0">{title}</h1>
                {modifiedLabel && <p className="fs-7 text-600 mt-2 mb-0">Last updated {modifiedLabel}</p>}

                {/* Operator attribution — present on every legal page */}
                <p className="fs-7 mt-3 mb-0" data-testid="operator-attribution">
                  This website, <a href="https://www.bestlooking.skin" className="bls-link fw-medium">www.bestlooking.skin</a>, is owned and operated by{' '}
                  <strong className="text-dark">FXN Holdings</strong>, a registered business in Australia.
                </p>

                <nav className="block-tag d-flex flex-wrap gap-2 mt-4" aria-label="Legal pages">
                  {NAV.map((n) => {
                    const active = n.key === pageKey;
                    return (
                      <Link
                        key={n.key}
                        href={n.href}
                        className={`tag-item bls-tag ${active ? 'is-active' : ''}`}
                        aria-current={active ? 'page' : undefined}
                      >
                        {n.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-5 pb-70">
        {/* Contents rail left, policy right. The rail is the same component the
            articles use, so the scroll-spy and active highlight come with it. */}
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-3 col-12">
              {toc.length > 1 ? (
                <div className="post-sticky">
                  <ReadingRail toc={toc} targetId="legal-body" />
                </div>
              ) : (
                <div aria-hidden />
              )}
            </div>

            <article className="col-lg-9 col-12" id="legal-body">
              <div className="legal-content legal-body">{nodes}</div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
