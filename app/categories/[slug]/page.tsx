import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SITE } from '@/lib/site';
import { listProductCategories, listProducts, mediaUrl } from '@/lib/strapi';
import ProductCard from '@/components/ProductCard';

export const revalidate = 60;
export const dynamicParams = true;

type Params = { slug: string };

async function getCategory(slug: string) {
  const categories = await listProductCategories().catch(() => []);
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function generateStaticParams() {
  const categories = await listProductCategories().catch(() => []);
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: 'Category not found' };
  const description =
    category.description || `Compare ${category.name} products and prices at ${SITE.name}.`;
  return {
    title: `${category.name} — Products & Prices`,
    description,
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: { title: category.name, description, url: `${SITE.url}/categories/${category.slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  /* 100, not 48: the >=2-offer rule is applied after the fetch (offer count is a
     relation count the API cannot filter on), so the page must see the whole
     category or it drops qualifying products purely by position. Hyaluronic Acid
     holds 72, of which 5 qualify. */
  const products = (await listProducts({ category: slug, pageSize: 100 }).catch(() => null))?.data ?? [];
  const image = mediaUrl(category.image ?? null);

  return (
    <section className="bg-paper py-12 sm:py-16" data-testid={`category-page-${category.slug}`}>
      <div className="mx-auto max-w-7xl px-6">
        <nav className="text-sm text-ink/55" aria-label="Breadcrumb">
          <Link href="/products" className="hover:text-primary">Products</Link>
          <span className="px-1.5">/</span>
          <span className="text-ink/75">{category.name}</span>
        </nav>

        <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={category.name}
              className="h-16 w-16 shrink-0 rounded-lg bg-white object-contain p-2 ring-1 ring-ink/10"
            />
          )}
          <h1 className="font-display font-bold tracking-tight text-ink">{category.name}</h1>
        </header>

        {category.description && (
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink/70">{category.description}</p>
        )}

        {category.children && category.children.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {category.children.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/categories/${c.slug}`}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink/75 ring-1 ring-ink/10 transition hover:text-primary"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-10 font-display text-xl font-bold text-ink">
          {products.length > 0
            ? `${products.length} ${products.length === 1 ? 'product' : 'products'}`
            : 'Products'}
        </h2>
        {products.length > 0 ? (
          <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} variant="tile" />
            ))}
          </div>
        ) : (
          <p className="mt-6 italic text-ink/50">No products yet in this category.</p>
        )}
      </div>
    </section>
  );
}
