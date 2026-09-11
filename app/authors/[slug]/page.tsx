import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAuthor, listAuthors, listPosts } from '@/lib/strapi';
import { SITE } from '@/lib/site';
import PostCard from '@/components/PostCard';

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
    title: author.name,
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
    worksFor: { '@type': 'Organization', name: SITE.name, url: SITE.url },
  };

  return (
    <div className="mx-auto max-w-7xl px-6 pb-16 pt-6" data-testid={`author-${author.slug}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />

      <nav className="flex items-center gap-2 py-0 text-[12px] font-semibold text-ink/55" aria-label="Breadcrumb">
        <Link href="/" className="shrink-0 font-semibold text-primary hover:text-primary-highlight">Home</Link>
        <span className="shrink-0">/</span>
        <span className="min-w-0 truncate text-ink/75" aria-current="page">{author.name}</span>
      </nav>

      <header className="mt-8 flex gap-5">
        <div aria-hidden className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-ink text-xl font-bold text-white">
          {author.name.trim().charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink/45">Author</p>
          <h1 className="font-display text-[2rem] font-bold leading-tight tracking-tight text-ink">{author.name}</h1>
          {author.bio && <p className="mt-3 max-w-2xl text-base leading-7 text-ink/70">{author.bio}</p>}
        </div>
      </header>

      <section className="mt-12">
        <h2 className="font-display text-xl font-bold text-ink">
          {posts.length > 0 ? `Articles by ${author.name}` : 'No articles yet'}
        </h2>
        {posts.length > 0 && (
          <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
