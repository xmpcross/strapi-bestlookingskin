import Link from 'next/link';
import { mediaUrl, type BlsProduct } from '@/lib/strapi';
import { plainShortDescription } from '@/lib/product-attributes';

type Variant = 'tile' | 'compact';

/*
 * Product tile in the Magzin card language: a white square thumbnail with a hairline border (product shots are
 * on white, so the frame reads the same in both themes), then brand, name, price. `thumbBg="bg-transparent"`
 * drops the frame for rows where the tiles sit on the page rather than in boxes.
 */
export default function ProductCard({
  product,
  variant = 'tile',
  thumbBg = 'bg-white',
  showCategory = true,
}: {
  product: BlsProduct;
  variant?: Variant;
  thumbBg?: string;
  showCategory?: boolean;
}) {
  const img = mediaUrl(product.primaryImage ?? null);
  const href = `/products/${product.slug}`;
  const cat = product.categories?.[0];
  const brandName = product.brandRef?.name || product.brand;
  const hasDiscount =
    product.originalPrice && product.currentPrice && product.originalPrice > product.currentPrice;
  const thumbClass = `shop-thumb ${thumbBg === 'bg-transparent' ? 'is-plain' : ''}`;

  if (variant === 'compact') {
    return (
      <article className="product-card" data-testid={`product-${product.slug}`}>
        <Link href={href} className="product-compact">
          <span className={thumbClass}>
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt={product.name} loading="lazy" />
            ) : (
              <span className="shop-thumb-empty" aria-hidden />
            )}
          </span>
          <span className="d-block" style={{ minWidth: 0 }}>
            {brandName && <span className="product-brand d-block">{brandName}</span>}
            <span className="product-name d-block mt-1 text-truncate-2">{product.name}</span>
            {product.currentPrice !== undefined && (
              <span className="product-price d-block fs-7 mt-2">
                {formatPrice(product.currentPrice, product.currency)}
              </span>
            )}
          </span>
        </Link>
      </article>
    );
  }

  // tile (default)
  return (
    <article className="product-card" data-testid={`product-${product.slug}`}>
      <Link href={href} className={thumbClass}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={product.name} loading="lazy" />
        ) : (
          <span className="shop-thumb-empty" aria-hidden />
        )}
      </Link>
      <div className="d-flex flex-column flex-grow-1 mt-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          {brandName && <p className="product-brand m-0">{brandName}</p>}
          {showCategory && cat && <p className="fs-8 text-500 m-0">{cat.name}</p>}
        </div>
        <Link href={href} className="mt-2">
          <h3 className="product-name m-0 text-truncate-2">{product.name}</h3>
        </Link>
        {product.shortDescription && (
          <p className="fs-7 text-600 mt-2 mb-0 text-truncate-2">{plainShortDescription(product.shortDescription)}</p>
        )}
        <div className="d-flex flex-wrap align-items-baseline gap-2 mt-3">
          {product.currentPrice !== undefined && (
            <span className="product-price fs-5">
              {formatPrice(product.currentPrice, product.currency)}
            </span>
          )}
          {hasDiscount && (
            <span className="fs-7 shop-was">
              {formatPrice(product.originalPrice!, product.currency)}
            </span>
          )}
          {hasDiscount && (
            <span className="shop-discount">
              -{Math.round((1 - product.currentPrice! / product.originalPrice!) * 100)}%
            </span>
          )}
        </div>
        {product.rating !== undefined && product.rating > 0 && (
          <p className="fs-8 text-600 mt-2 mb-0">
            <span className="shop-star-on" aria-hidden>★</span> {product.rating.toFixed(1)}
            {/* Imported aggregate counts are ratings, not written reviews: the product page labels them the same way. */}
            {product.ratingCount ? ` · ${product.ratingCount} ratings` : ''}
          </p>
        )}
      </div>
    </article>
  );
}

function formatPrice(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
