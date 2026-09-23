import type { Metadata } from 'next';
import { seoTitle } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { getAuthor, listAuthors, listPosts } from '@/lib/strapi';
import { SITE, publisherJsonLd } from '@/lib/site';
import AuthorAvatar from '@/components/AuthorAvatar';
import { toCard } from '@/lib/post-card';
import { WideCard } from '@/components/magzin/cards';
import Breadcrumb from '@/components/magzin/Breadcrumb';

export const revalidate = 300;

/**
 * Author page.
 *
 * Exists because the byline and the author card on every post link here, and a
 * byline pointing at a 404 is worse for a reviewer than no byline at all: it
 * looks like attribution without anything behind it. This gives each name a
 * real page with their bio and their work, and a Person entity for search.
 */
export async function generateStaticParams() {
  const authors = await listAuthors().catch(() => []);
  return authors.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthor(slug).catch(() => null);
  if (!author) return { title: 'Author not found' };
  return {
    // The root layout's template already appends the site name.
    title: seoTitle(author.name),
    description: author.bio?.slice(0, 160) || `Articles written by ${author.name} for ${SITE.name}.`,
    alternates: { canonical: `${SITE.url}/authors/${author.slug}` },
  };
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = await getAuthor(slug).catch(() => null);
  if (!author) notFound();

  const { data: posts } = await listPosts({ author: slug, pageSize: 24 }).catch(() => ({ data: [] }));

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    description: author.bio || undefined,
    url: `${SITE.url}/authors/${author.slug}`,
    worksFor: publisherJsonLd(),
  };

  return (
    <div data-testid={`author-${author.slug}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />

      <div className="container">
        <Breadcrumb items={[{ label: author.name }]} />

        {/* Magzin "Author" header: a centred card with the avatar, name and bio. bls-author has no social
            profiles, so the template's social icons are left out. */}
        <div className="row pt-4">
          <div className="col-lg-8 col-xl-7 col-12 mx-auto">
            <header className="author-card bls-author-hero text-center">
              <div className="d-flex justify-content-center mb-4">
                <AuthorAvatar name={author.name} src={author.avatarUrl} size={120} />
              </div>
              <p className="bls-eyebrow mb-2">Author</p>
              <h1 className="h3 mb-0">{author.name}</h1>
              {author.bio && <p className="fs-7 mt-3 mb-0">{author.bio}</p>}
            </header>
          </div>
        </div>
      </div>

      <section className="sec-1-author pt-70 pb-70">
        <div className="container">
          <h2 className="h5 mb-0">{posts.length > 0 ? `Articles by ${author.name}` : 'No articles yet'}</h2>
          {posts.length > 0 && (
            <div className="row mt-2 g-4">
              {posts.map((p) => (
                <div className="col-12" key={p.slug}>
                  <WideCard card={toCard(p)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
