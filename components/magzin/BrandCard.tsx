'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getBrandMeta, type BrandMeta } from '@/lib/brand-data';

interface BrandCardProps {
  name: string;
  slug: string;
  productCount?: number;
  featured?: boolean;
}

export default function BrandCard({
  name,
  slug,
  productCount,
  featured = false,
}: BrandCardProps) {
  const meta: BrandMeta = getBrandMeta(name);
  const [imageError, setImageError] = useState(false);

  // Generate initials for monogram fallback
  const initials = name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  return (
    <Link
      href={`/brands/${encodeURIComponent(slug)}`}
      className={`brand-card group ${featured ? 'brand-card--featured' : ''}`}
      data-testid={`brand-card-${slug.toLowerCase()}`}
    >
      <div className="brand-card__inner">
        {/* Top bar with Category & Product Count */}
        <div className="brand-card__top">
          <span className="brand-card__category">{meta.category}</span>
          {typeof productCount === 'number' && (
            <span className="brand-card__count">
              {productCount} {productCount === 1 ? 'Product' : 'Products'}
            </span>
          )}
        </div>

        {/* Center Logo Showcase */}
        <div className="brand-card__logo-wrap">
          {!imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={meta.logo}
              alt={`${meta.name} logo`}
              className="brand-card__logo"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="brand-card__monogram" aria-hidden="true">
              {initials}
            </div>
          )}
        </div>

        {/* Brand Information */}
        <div className="brand-card__details">
          <div className="brand-card__title-row">
            <h3 className="brand-card__title">{meta.name}</h3>
            <svg
              className="brand-card__arrow"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="brand-card__tagline">{meta.tagline}</p>
        </div>

        {meta.origin && (
          <div className="brand-card__footer">
            <span className="brand-card__origin">
              <span className="brand-card__dot" />
              {meta.origin}
            </span>
            <span className="brand-card__view">Explore collection &rarr;</span>
          </div>
        )}
      </div>
    </Link>
  );
}
