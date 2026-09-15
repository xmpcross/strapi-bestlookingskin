import Link from 'next/link';
import type { Metadata } from 'next';
import { listPostSummaries } from '@/lib/strapi';
import { SECTIONS, SITE } from '@/lib/site';
import { toCard } from '@/lib/post-card';
import { TileCard } from '@/components/magzin/cards';
import Breadcrumb from '@/components/magzin/Breadcrumb';

export const metadata: Metadata = {
  title: 'Page not found',
  description: `The page you're looking for doesn't exist on ${SITE.name}. Browse our skincare guides, reviews and top-rated products instead.`,
  robots: { index: false, follow: true },
};

export default async function NotFound() {
  // Pull a few recent posts so a 404 isn't a dead end.
  const recent = await listPostSummaries({ pageSize: 4 })
    .then((r) => r.data ?? [])
    .catch(() => []);

  return (
    <div data-testid="not-found">
      {/* Magzin 404: breadcrumb, a centred message with a search box, then links to keep browsing. */}
      <div className="container">
        <Breadcrumb items={[{ label: 'Page not found' }]} />
        <div className="row pt-4 pb-70">
          <div className="col-lg-7 col-md-9 col-12 text-center mx-auto">
            <p className="bls-404-code mb-3">404</p>
            <h1 className="h4 mb-0">That page wandered off</h1>
            <p className="bls-page-lead mt-3 mb-0">
              The page you’re looking for doesn’t exist, has been moved, or never made it past the editor’s desk. Use the search below — or pick a section to keep browsing.
            </p>

            <form action="/search" method="get" role="search" className="bls-search-form d-flex gap-2 mt-4">
              <label htmlFor="not-found-search" className="visually-hidden">
                Search {SITE.name}
              </label>
              <input
                id="not-found-search"
                type="search"
                name="q"
                placeholder="Search products, ingredients, guides…"
                className="form-control"
              />
              <button type="submit" className="btn btn-dark bls-btn">
                Search
              </button>
            </form>

            <div className="block-tag d-flex flex-wrap justify-content-center gap-2 mt-4">
              <Link href="/" className="tag-item bls-tag is-active">
                Home
              </Link>
              <Link href="/products" className="tag-item bls-tag">
                All products
              </Link>
              {SECTIONS.filter((s) => !s.redirectTo).map((s) => (
                <Link key={s.slug} href={`/${s.slug}`} className="tag-item bls-tag">
                  {s.short}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {recent.length > 0 && (
        <section className="pb-70">
          <div className="container">
            <p className="bls-eyebrow mb-2">Read instead</p>
            <h2 className="h5 mb-0">Latest from {SITE.name}</h2>
            <div className="row g-4 mt-2">
              {recent.map((p) => {
                const card = toCard(p);
                return (
                  <div className="col-lg-3 col-md-6 col-12" key={card.key}>
                    <TileCard card={card} />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
