'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import ProductFilters from '@/components/products/ProductFilters';
import type { Product, Category, PaginatedResponse } from '@/types';

export default function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const currentPage = Number(searchParams.get('page')) || 1;
  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentPriceRange = searchParams.get('priceRange') || '';

  const priceRanges = [
    { label: 'All Prices', value: '' },
    { label: 'Under $25', value: '0-25' },
    { label: '$25 — $50', value: '25-50' },
    { label: '$50 — $100', value: '50-100' },
    { label: '$100 — $200', value: '100-200' },
    { label: '$200+', value: '200-' },
  ];

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('page', String(currentPage));
      query.set('limit', '12');
      query.set('published', 'true');
      if (currentCategory) query.set('categorySlug', currentCategory);
      if (currentSearch) query.set('search', currentSearch);
      if (currentPriceRange) {
        const [min, max] = currentPriceRange.split('-');
        if (min) query.set('minPrice', min);
        if (max) query.set('maxPrice', max);
      }

      const [prodRes, catRes] = await Promise.all([
        api.get<PaginatedResponse<Product>>(`/products?${query.toString()}`),
        api.get<PaginatedResponse<Category>>('/categories'),
      ]);

      setProducts(prodRes.data ?? []);
      setTotal(prodRes.meta.total);
      setTotalPages(prodRes.meta.totalPages);
      setCategories(catRes.data ?? []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentCategory, currentSearch, currentPriceRange]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const buildHref = (params: Record<string, string>) => {
    const sp = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value) sp.set(key, value);
      else sp.delete(key);
    });
    const qs = sp.toString();
    return `/products${qs ? `?${qs}` : ''}`;
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-28 lg:px-8">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold text-ink lg:text-5xl">
          {currentSearch ? `Search: "${currentSearch}"` : currentCategory ? currentCategory : 'All Products'}
        </h1>
        {!loading && (
          <p className="mt-2 text-sm text-ink-lighter">
            {total} product{total !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
        <div className="hidden lg:block">
          <ProductFilters categories={categories} />
        </div>

        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse bg-cream-200" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="font-display text-2xl text-ink-lighter">No products found</p>
              <p className="mt-2 text-sm text-ink-lighter">Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6"
              >
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 },
                    }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>

              {totalPages > 1 && (
                <div className="mt-16 flex items-center justify-center gap-3">
                  {currentPage > 1 && (
                    <a
                      href={buildHref({ page: String(currentPage - 1) })}
                      className="px-4 py-2 text-sm text-ink-lighter hover:text-ink transition-colors"
                    >
                      ← Prev
                    </a>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <a
                      key={page}
                      href={buildHref({ page: String(page) })}
                      className={`flex h-10 w-10 items-center justify-center text-sm transition-colors ${
                        page === currentPage
                          ? 'bg-ink text-cream-50'
                          : 'text-ink-lighter hover:text-ink hover:bg-cream-200'
                      }`}
                    >
                      {page}
                    </a>
                  ))}
                  {currentPage < totalPages && (
                    <a
                      href={buildHref({ page: String(currentPage + 1) })}
                      className="px-4 py-2 text-sm text-ink-lighter hover:text-ink transition-colors"
                    >
                      Next →
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
