import Link from 'next/link';
import type { Metadata } from 'next';
import { listPosts, listProducts, type BlsPost, type BlsProduct } from '@/lib/strapi';
import ProductCard from '@/components/ProductCard';
import { toCard } from '@/lib/post-card';
import { TileCard } from '@/components/magzin/cards';
import Breadcrumb from '@/components/magzin/Breadcrumb';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Search',
  alternates: { canonical: '/search' },
};

type SearchParams = { q?: string; page?: string; type?: 'all' | 'posts' | 'products' };

const PAGE_SIZE = 12;

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { q, page: pageRaw, type: typeRaw } = await searchParams;
  const query = (q ?? '').trim();
  const page = Math.max(1, Number(pageRaw) || 1);
  const type: 'all' | 'posts' | 'products' = typeRaw === 'posts' || typeRaw === 'products' ? typeRaw : 'all';

  // Fetch in parallel; on the "all" tab fetch a small slice of each, on a
  // tab-specific tab paginate that one type fully.
  const wantPosts    = type === 'all' || type === 'posts';
  const wantProducts = type === 'all' || type === 'products';

  const [postsRes, productsRes] = await Promise.all([
    wantPosts
      ? listPosts({ q: query, page, pageSize: type === 'posts' ? PAGE_SIZE : 6 })
          .catch(() => null)
      : Promise.resolve(null),
    wantProducts
      ? listProducts({ q: query, page, pageSize: type === 'products' ? PAGE_SIZE : 8 })
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  const posts: BlsPost[] = postsRes?.data ?? [];
  const products: BlsProduct[] = productsRes?.data ?? [];
  const postsTotal = postsRes?.meta?.pagination?.total ?? 0;
  const productsTotal = productsRes?.meta?.pagination?.total ?? 0;
  const totalAll = postsTotal + productsTotal;

  // Pagination is only meaningful on type-specific tabs
  const pageCount =
    type === 'posts'
      ? postsRes?.meta?.pagination?.pageCount ?? 1
      : type === 'products'
        ? productsRes?.meta?.pagination?.pageCount ?? 1
        : 1;

  const tabs = [
    { key: 'all',      label: `All (${totalAll})` },
    { key: 'posts',    label: `Articles (${postsTotal})` },
    { key: 'products', label: `Products (${productsTotal})` },
  ] as const;

  const qs = encodeURIComponent(query);

  return (
    <div data-testid="search-page">
      <section className="sec-breadcumb">
        <div className="container">
          <Breadcrumb items={[{ label: 'Search' }]} />
          <div className="row align-items-end">
            <div className="col-lg-8 col-12">
              <div className="title">
                <p className="bls-eyebrow mb-2">Search</p>
                <h1 className="h3 mb-0">{query ? <>Results for “{query}”</> : 'Search'}</h1>

                <form action="/search" method="get" className="bls-search-form d-flex gap-2 mt-4">
                  <input
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder="Search articles, products, brands, ingredients…"
                    className="form-control"
                    aria-label="Search"
                  />
                  {/* Preserve current tab when re-submitting */}
                  {type !== 'all' && <input type="hidden" name="type" value={type} />}
                  <button type="submit" className="btn btn-dark bls-btn">
                    Search
                  </button>
                </form>

                {/* Type tabs */}
                {query && (
                  <nav className="block-tag d-flex flex-wrap align-items-center gap-2 mt-4" aria-label="Search filters">
                    {tabs.map((t) => {
                      const active = t.key === type;
                      const href = t.key === 'all' ? `/search?q=${qs}` : `/search?q=${qs}&type=${t.key}`;
                      return (
                        <Link
                          key={t.key}
                          href={href}
                          className={`tag-item bls-tag ${active ? 'is-active' : ''}`}
                          aria-current={active ? 'page' : undefined}
                        >
                          {t.label}
                        </Link>
                      );
                    })}
                  </nav>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container pb-70">
        {/* PRODUCTS — shown on All tab and on the dedicated products tab */}
        {wantProducts && products.length > 0 && (
          <section className="pt-5" data-testid="search-products">
            {type === 'all' && (
              <div className="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-4">
                <h2 className="h5 mb-0">Products</h2>
                {productsTotal > products.length && (
                  <Link href={`/search?q=${qs}&type=products`} className="bls-link fs-7 fw-semi-bold">
                    See all {productsTotal} →
                  </Link>
                )}
              </div>
            )}
            <div className="row g-4">
              {products.map((p) => (
                <div className="col-lg-3 col-md-6 col-12" key={p.id}>
                  <ProductCard product={p} variant="tile" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ARTICLES */}
        {wantPosts && posts.length > 0 && (
          <section className="pt-5" data-testid="search-posts">
            {type === 'all' && (
              <div className="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-4">
                <h2 className="h5 mb-0">Articles</h2>
                {postsTotal > posts.length && (
                  <Link href={`/search?q=${qs}&type=posts`} className="bls-link fs-7 fw-semi-bold">
                    See all {postsTotal} →
                  </Link>
                )}
              </div>
            )}
            <div className="row g-4">
              {posts.map((p) => {
                const card = toCard(p);
                return (
                  <div className="col-lg-4 col-md-6 col-12" key={card.key}>
                    <TileCard card={card} />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* No-results state */}
        {query && totalAll === 0 && (
          <div className="bls-empty mt-5">
            <p className="mb-0">
              No results for <span className="fw-semi-bold text-dark">“{query}”</span>.
            </p>
            <p className="fs-7 mt-2 mb-0">Try different keywords or browse from the home page.</p>
          </div>
        )}

        {/* Pagination — only on type-specific tabs */}
        {type !== 'all' && pageCount > 1 && (
          <nav className="d-flex flex-wrap align-items-center justify-content-center gap-3 mt-5" aria-label="Pages">
            {page > 1 && (
              <Link
                href={`/search?q=${qs}&type=${type}${page - 1 > 1 ? `&page=${page - 1}` : ''}`}
                className="tag-item bls-tag"
                rel="prev"
              >
                ← Previous
              </Link>
            )}
            <span className="fs-7 text-600">Page {page} of {pageCount}</span>
            {page < pageCount && (
              <Link href={`/search?q=${qs}&type=${type}&page=${page + 1}`} className="tag-item bls-tag" rel="next">
                Next →
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
