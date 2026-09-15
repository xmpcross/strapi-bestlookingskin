import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SITE } from '@/lib/site';
import { listProductBrands, listProducts, mediaUrl } from '@/lib/strapi';
import ProductCard from '@/components/ProductCard';
import Breadcrumb from '@/components/magzin/Breadcrumb';

export const revalidate = 60;
export const dynamicParams = true;

type Params = { slug: string };

async function getBrand(slug: string) {
  const brands = await listProductBrands().catch(() => []);
  return brands.find((b) => b.slug === slug) ?? null;
}

export async function generateStaticParams() {
  const brands = await listProductBrands().catch(() => []);
  return brands.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrand(slug);
  if (!brand) return { title: 'Brand not found' };
  const description =
    brand.description || `Shop ${brand.name} skincare products and compare prices at ${SITE.name}.`;
  return {
    title: `${brand.name} — Products & Prices`,
    description,
    alternates: { canonical: `/brands/${brand.slug}` },
    openGraph: { title: brand.name, description, url: `${SITE.url}/brands/${brand.slug}` },
  };
}

export default async function BrandPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const brand = await getBrand(slug);
  if (!brand) notFound();

  const products = (await listProducts({ brand: slug, pageSize: 48 }).catch(() => null))?.data ?? [];
  const logo = mediaUrl(brand.logo ?? null);

  return (
    <div data-testid={`brand-${brand.slug}`}>
      <section className="sec-breadcumb">
        <div className="container">
          <Breadcrumb items={[{ label: 'Brands', href: '/brands' }, { label: brand.name }]} />
          <div className="row align-items-end">
            <div className="col-lg-8 col-12">
              <div className="title d-flex flex-column flex-sm-row align-items-sm-center gap-3">
                {logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt={`${brand.name} logo`} className="shop-logo" />
                )}
                <div>
                  <h1 className="h4 mb-0 ds-4">{brand.name}</h1>
                  {brand.websiteUrl && (
                    <a
                      href={brand.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shop-link d-inline-block fs-7 fw-medium mt-2"
                    >
                      Visit official site &rarr;
                    </a>
                  )}
                </div>
              </div>
              {brand.description && <p className="fs-7 mb-0 mt-3">{brand.description}</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="pt-5 pb-70">
        <div className="container">
          <h2 className="h5 mb-0">
            {products.length > 0
              ? `${products.length} ${products.length === 1 ? 'product' : 'products'}`
              : 'Products'}
          </h2>
          {products.length > 0 ? (
            <div className="row g-3 g-md-4 mt-2">
              {products.map((p) => (
                <div className="col-lg-3 col-sm-6 col-12" key={p.id}>
                  <ProductCard product={p} variant="tile" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-600 mt-4">No products yet for this brand.</p>
          )}
        </div>
      </section>
    </div>
  );
}
