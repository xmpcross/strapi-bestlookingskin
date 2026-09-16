import Link from 'next/link';
import type { Metadata } from 'next';
import { listAllPostRows, type BlsPostRow } from '@/lib/strapi';
import { SITE } from '@/lib/site';
import { fmtMonthYear, fmtShortDate, postPath, primaryCategorySlug } from '@/lib/format';
import Breadcrumb from '@/components/magzin/Breadcrumb';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'All Posts',
  description: `Every article on ${SITE.name} in one list, newest first.`,
  alternates: { canonical: '/posts' },
};

/* A complete index, not an archive page: no pagination and no images, so the whole corpus stays scannable in one
   screenful of scrolling. The magazine treatment (feature tiles, strips, sidebar) lives on /informative-articles --
   it reorders the newest posts by whether they have a cover, which is exactly what this page must not do. */

type MonthGroup = { key: string; label: string; posts: BlsPostRow[] };

function groupByMonth(posts: BlsPostRow[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const post of posts) {
    /* Posts arrive newest-first, so a month is contiguous and only the last group can match. */
    const key = post.publishedAt.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.posts.push(post);
    else groups.push({ key, label: fmtMonthYear(post.publishedAt), posts: [post] });
  }
  return groups;
}

export default async function AllPostsPage() {
  const posts = await listAllPostRows().catch(() => [] as BlsPostRow[]);
  const groups = groupByMonth(posts);

  return (
    <div data-testid="posts-page">
      <section className="sec-breadcumb">
        <div className="container">
          <Breadcrumb items={[{ label: 'All Posts' }]} />
          <div className="row align-items-end">
            <div className="col-lg-8 col-12">
              <div className="title">
                <p className="bls-eyebrow mb-3">Newest first</p>
                <h1 className="h4 mb-0 ds-4">
                  All Posts{' '}
                  <span className="text-600 fw-regular fs-6 bg-white rounded-8 p-2 align-middle">
                    {posts.length} {posts.length === 1 ? 'article' : 'articles'}
                  </span>
                </h1>
                <p className="fs-7 mb-0 mt-3">
                  Every article published on {SITE.name}, most recent first. Browse by topic on{' '}
                  <Link href="/informative-articles" className="bls-link">
                    All Articles
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-5 pb-70">
        <div className="container">
          {posts.length === 0 ? (
            <div className="shop-empty">
              <p className="mb-0">No articles are available yet.</p>
            </div>
          ) : (
            groups.map((group, i) => (
              <section className={`row g-3 ${i > 0 ? 'posts-month pt-4 mt-4' : ''}`} key={group.key}>
                <div className="col-md-3 col-12">
                  <h2 className="h5 mb-0 posts-month-label">{group.label}</h2>
                  <p className="fs-8 text-600 mb-0 mt-1">
                    {group.posts.length} {group.posts.length === 1 ? 'article' : 'articles'}
                  </p>
                </div>
                <div className="col-md-9 col-12">
                  <ul className="list-unstyled m-0 p-0">
                    {group.posts.map((post) => {
                      const cat = post.categories?.find((c) => c.slug === primaryCategorySlug(post)) ?? null;
                      return (
                        <li className="posts-row" key={post.documentId ?? post.id}>
                          <Link href={postPath(post)} className="posts-row-link">
                            <time className="posts-row-date fs-8 text-600" dateTime={post.publishedAt}>
                              {fmtShortDate(post.publishedAt)}
                            </time>
                            <span className="posts-row-title fs-7">{post.title}</span>
                          </Link>
                          {cat && (
                            <Link href={`/${cat.slug}`} className="posts-row-cat fs-8 text-600">
                              {cat.name}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </section>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
