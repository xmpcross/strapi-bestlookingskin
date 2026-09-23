'use client';

import { useState, useMemo } from 'react';
import BrandCard from '@/components/magzin/BrandCard';
import { BRAND_CATEGORIES, getBrandMeta, type BrandCategory } from '@/lib/brand-data';

export type BrandItem = {
  id: number;
  name: string;
  slug: string;
  productCount?: number;
};

interface BrandSearchFilterProps {
  initialBrands: BrandItem[];
}

export default function BrandSearchFilter({ initialBrands }: BrandSearchFilterProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BrandCategory>('All');
  const [selectedLetter, setSelectedLetter] = useState<string>('All');

  // Compute available letters from initial brands
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    initialBrands.forEach((b) => {
      const first = (b.name[0] || '').toUpperCase();
      if (/^[A-Z]$/.test(first)) {
        letters.add(first);
      } else {
        letters.add('#');
      }
    });
    return Array.from(letters).sort();
  }, [initialBrands]);

  // Filter brands based on search, category, and letter
  const filteredBrands = useMemo(() => {
    const q = search.trim().toLowerCase();

    return initialBrands.filter((brand) => {
      const meta = getBrandMeta(brand.name);

      // Search query check
      if (q) {
        const matchesName = brand.name.toLowerCase().includes(q);
        const matchesCategory = meta.category.toLowerCase().includes(q);
        const matchesTagline = meta.tagline.toLowerCase().includes(q);
        const matchesOrigin = (meta.origin || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesTagline && !matchesOrigin) {
          return false;
        }
      }

      // Category check
      if (selectedCategory !== 'All' && meta.category !== selectedCategory) {
        return false;
      }

      // Letter check
      if (selectedLetter !== 'All') {
        const first = (brand.name[0] || '').toUpperCase();
        if (selectedLetter === '#') {
          if (/^[A-Z]$/.test(first)) return false;
        } else if (first !== selectedLetter) {
          return false;
        }
      }

      return true;
    });
  }, [initialBrands, search, selectedCategory, selectedLetter]);

  // Group filtered brands by letter if no search query is active
  const groupedBrands = useMemo(() => {
    if (search.trim() || selectedLetter !== 'All') {
      return null;
    }
    const map = new Map<string, BrandItem[]>();
    for (const b of filteredBrands) {
      const first = (b.name[0] || '').toUpperCase();
      const letter = /^[A-Z]$/.test(first) ? first : '#';
      map.set(letter, [...(map.get(letter) || []), b]);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredBrands, search, selectedLetter]);

  const handleReset = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedLetter('All');
  };

  return (
    <div className="brand-directory" data-testid="brand-directory">
      {/* Controls Container */}
      <div className="brand-controls">
        {/* Search Bar */}
        <div className="brand-search-box">
          <svg
            className="brand-search-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            className="brand-search-input"
            placeholder="Search skincare brands, formulas, origins (e.g. CeraVe, Korean, Retinol)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search skincare brands"
          />
          {search && (
            <button
              type="button"
              className="brand-search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="brand-categories-scroll">
          <div className="brand-categories-pills">
            {BRAND_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`brand-pill-btn ${selectedCategory === cat ? 'brand-pill-btn--active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Alphabet Navigation Bar */}
        <div className="brand-alphabet-bar">
          <span className="brand-alphabet-label">A–Z</span>
          <div className="brand-alphabet-list">
            <button
              type="button"
              className={`brand-alphabet-btn ${selectedLetter === 'All' ? 'brand-alphabet-btn--active' : ''}`}
              onClick={() => setSelectedLetter('All')}
            >
              All
            </button>
            {availableLetters.map((letter) => (
              <button
                key={letter}
                type="button"
                className={`brand-alphabet-btn ${selectedLetter === letter ? 'brand-alphabet-btn--active' : ''}`}
                onClick={() => setSelectedLetter(letter)}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>

        {/* Result Counter & Active Filters Summary */}
        <div className="brand-summary-row">
          <span className="brand-summary-count">
            Showing <strong>{filteredBrands.length}</strong> {filteredBrands.length === 1 ? 'brand' : 'brands'}
            {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
            {selectedLetter !== 'All' ? ` starting with "${selectedLetter}"` : ''}
            {search.trim() ? ` matching "${search}"` : ''}
          </span>
          {(search || selectedCategory !== 'All' || selectedLetter !== 'All') && (
            <button
              type="button"
              className="brand-reset-btn"
              onClick={handleReset}
            >
              Reset filters &times;
            </button>
          )}
        </div>
      </div>

      {/* Brand Grid or Grouped Sections */}
      {filteredBrands.length === 0 ? (
        <div className="brand-empty-state">
          <div className="brand-empty-icon">🔍</div>
          <h3 className="brand-empty-title">No matching brands found</h3>
          <p className="brand-empty-desc">
            We couldn&apos;t find any skincare brands matching your current search or filters.
          </p>
          <button type="button" className="btn btn-outline-dark shop-btn" onClick={handleReset}>
            View All {initialBrands.length} Brands
          </button>
        </div>
      ) : groupedBrands ? (
        // Grouped by Alphabet Letter
        <div className="brand-grouped-sections">
          {groupedBrands.map(([letter, brands]) => (
            <section key={letter} className="brand-letter-section" id={`letter-${letter}`}>
              <div className="brand-letter-header">
                <span className="brand-letter-badge">{letter}</span>
                <div className="brand-letter-line" />
                <span className="brand-letter-count">{brands.length} {brands.length === 1 ? 'brand' : 'brands'}</span>
              </div>
              <div className="brand-grid">
                {brands.map((brand) => (
                  <BrandCard
                    key={brand.slug}
                    name={brand.name}
                    slug={brand.slug}
                    productCount={brand.productCount}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        // Flat Grid for Active Search or Single Letter Filter
        <div className="brand-grid">
          {filteredBrands.map((brand) => (
            <BrandCard
              key={brand.slug}
              name={brand.name}
              slug={brand.slug}
              productCount={brand.productCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
