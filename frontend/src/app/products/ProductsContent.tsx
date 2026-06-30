'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import ProductFilters from '@/components/products/ProductFilters';
import type { Product, Category, PaginatedResponse } from '@/types';

const SORT_OPTIONS = [
  { label: 'Más recientes', value: 'newest', sortBy: 'createdAt', sortOrder: 'desc' },
  { label: 'Precio: menor a mayor', value: 'price_asc', sortBy: 'basePrice', sortOrder: 'asc' },
  { label: 'Precio: mayor a menor', value: 'price_desc', sortBy: 'basePrice', sortOrder: 'desc' },
  { label: 'Nombre: A-Z', value: 'name_asc', sortBy: 'name', sortOrder: 'asc' },
  { label: 'Nombre: Z-A', value: 'name_desc', sortBy: 'name', sortOrder: 'desc' },
];

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface FlatCategory {
  name: string;
  parentSlug: string | null;
}

interface ProductsContentProps {
  segments: string[];
}

function buildCategoryMap(tree: Category[]): Map<string, FlatCategory> {
  const map = new Map<string, FlatCategory>();
  function walk(cats: Category[], parentSlug: string | null) {
    for (const cat of cats) {
      if (map.has(cat.slug)) continue;
      map.set(cat.slug, { name: cat.name, parentSlug });
      if (cat.children) walk(cat.children, cat.slug);
    }
  }
  walk(tree, null);
  return map;
}

function resolveCategory(slug: string, map: Map<string, FlatCategory>) {
  const info = map.get(slug);
  if (!info) return null;

  const ancestors: string[] = [];
  let current: string | null = slug;
  while (current) {
    ancestors.unshift(current);
    current = map.get(current)?.parentSlug ?? null;
  }

  const segments: string[] = [];
  for (let i = 0; i < ancestors.length; i++) {
    if (i === 0) {
      segments.push(ancestors[i]);
    } else {
      segments.push(ancestors[i].replace(`${ancestors[i - 1]}-`, ''));
    }
  }

  return { slug, name: info.name, segments, ancestors };
}

export default function ProductsContent({ segments }: ProductsContentProps) {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const currentPage = Number(searchParams.get('page')) || 1;
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'newest';

  const categoryMap = useMemo(() => buildCategoryMap(categoryTree), [categoryTree]);

  const resolved = useMemo(() => {
    if (segments.length === 0) return null;
    const slug = segments.join('-');
    return resolveCategory(slug, categoryMap);
  }, [segments, categoryMap]);

  const currentCategory = resolved
    ? { slug: resolved.slug, name: resolved.name }
    : null;

  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [{ label: 'Productos', href: '/products' }];
    if (!resolved) return items;
    for (let i = 0; i < resolved.segments.length; i++) {
      items.push({
        label: resolved.ancestors[i]
          ? (categoryMap.get(resolved.ancestors[i])?.name ?? resolved.segments[i])
          : resolved.segments[i],
        href: `/products/${resolved.segments.slice(0, i + 1).join('/')}`,
      });
    }
    return items;
  }, [resolved, categoryMap]);

  const navItems = useMemo((): Category[] => {
    if (!resolved) return categoryTree;
    const last = resolved.ancestors[resolved.ancestors.length - 1];
    const cat = (function find(tree: Category[]): Category | undefined {
      for (const c of tree) {
        if (c.slug === last) return c;
        if (c.children) {
          const found = find(c.children);
          if (found) return found;
        }
      }
      return undefined;
    })(categoryTree);
    return cat?.children ?? [];
  }, [resolved, categoryTree]);

  const sortOption = SORT_OPTIONS.find((s) => s.value === currentSort) ?? SORT_OPTIONS[0];

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('page', String(currentPage));
      query.set('limit', '12');
      if (currentCategory?.slug) query.set('categorySlug', currentCategory.slug);
      if (currentSearch) query.set('search', currentSearch);
      query.set('sortBy', sortOption.sortBy);
      query.set('sortOrder', sortOption.sortOrder);

      const [prodRes, catRes] = await Promise.all([
        api.get<PaginatedResponse<Product>>(`/products?${query.toString()}`),
        api.get<Category[]>('/categories'),
      ]);

      setProducts(prodRes.data ?? []);
      setTotal(prodRes.meta.total);
      setTotalPages(prodRes.meta.totalPages);

      if (categoryTree.length === 0) {
        const roots = Array.isArray(catRes) ? catRes : (catRes as unknown as { data: Category[] }).data ?? [];
        setCategoryTree(roots);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, currentCategory?.slug, currentSearch, sortOption.sortBy, sortOption.sortOrder]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const buildHref = (params: Record<string, string>) => {
    const sp = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value) sp.set(key, value);
      else sp.delete(key);
    });
    const base = resolved ? `/products/${resolved.segments.join('/')}` : '/products';
    const qs = sp.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const getPageTitle = () => {
    if (currentSearch) return `Resultados: "${currentSearch}"`;
    if (currentCategory) return currentCategory.name;
    return 'Toda la Colección';
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
      {breadcrumbs.length > 1 && (
        <nav className="mb-6 flex items-center gap-2 text-xs text-ink-lighter">
          {breadcrumbs.map((item, i) => (
            <span key={item.href} className="flex items-center gap-2">
              {i > 0 && <span>/</span>}
              {i < breadcrumbs.length - 1 ? (
                <Link href={item.href} className="hover:text-ink transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-ink">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold text-ink lg:text-5xl">
          {getPageTitle()}
        </h1>
        {!loading && (
          <p className="mt-2 text-sm text-ink-lighter">
            {total} producto{total !== 1 ? 's' : ''}
            {currentCategory && <> en {currentCategory.name}</>}
          </p>
        )}
      </div>

      {resolved && navItems.length > 0 && (
        <div className="mb-10 flex flex-wrap gap-2 border-b border-border pb-6">
          {resolved && (
            <Link
              href={resolved.segments.length > 1 ? `/products/${resolved.segments.slice(0, -1).join('/')}` : '/products'}
              className="rounded-full border border-cream-200 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-lighter transition-colors hover:border-ink hover:text-ink"
            >
              Todo
            </Link>
          )}
          {navItems.map((item) => {
            const relative = resolved
              ? item.slug.replace(`${resolved.slug}-`, '')
              : item.slug;
            const isActive = resolved && segments.length > resolved.segments.length
              ? segments[resolved.segments.length] === relative
              : false;
            const href = resolved
              ? `/products/${resolved.segments.join('/')}/${relative}`
              : `/products/${item.slug}`;
            return (
              <Link
                key={item.id}
                href={href}
                className={`rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors ${
                  isActive
                    ? 'border-gold bg-gold/10 text-ink'
                    : 'border-cream-200 text-ink-lighter hover:border-ink hover:text-ink'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
        <div className="hidden lg:block">
          <ProductFilters />
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
              <p className="font-display text-2xl text-ink-lighter">Sin productos</p>
              <p className="mt-2 text-sm text-ink-lighter">Probá ajustando los filtros.</p>
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
                      ← Anterior
                    </a>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <a
                      key={page}
                      href={buildHref({ page: String(page) })}
                      className={`flex h-10 w-10 items-center justify-center text-sm transition-colors ${
                        page === currentPage
                          ? 'bg-accent text-cream'
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
                      Siguiente →
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
