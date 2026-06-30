'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { Category } from '@/types';

interface CategoryMegaMenuProps {
  categories: Category[];
  isTransparent: boolean;
}

function getRelativeSlug(category: Category, parent?: Category): string {
  if (!parent) return category.slug;
  return category.slug.replace(`${parent.slug}-`, '');
}

function buildCategoryPath(category: Category, parent?: Category, grandparent?: Category): string {
  if (!parent) return `/products/${category.slug}`;
  if (!grandparent) return `/products/${parent.slug}/${getRelativeSlug(category, parent)}`;
  return `/products/${grandparent.slug}/${getRelativeSlug(parent, grandparent)}/${getRelativeSlug(category, parent)}`;
}

export default function CategoryMegaMenu({ categories, isTransparent }: CategoryMegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setIsOpen(false);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`text-[11px] font-semibold tracking-[0.15em] uppercase transition-colors duration-300 hover:text-gold ${
          isTransparent ? 'text-cream/85' : 'text-ink/70'
        } ${isOpen ? 'text-gold' : ''}`}
      >
        Categorías
      </button>

      {isOpen && (
        <>
          <div
            className="absolute left-1/2 top-full z-50 mt-2 w-[500px] -translate-x-1/2"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="rounded-sm border border-cream-200 bg-cream/95 backdrop-blur-xl shadow-xl">
              <div className="flex divide-x divide-cream-200">
                {categories.map((gender) => (
                  <div key={gender.id} className="flex-1 px-6 py-6">
                    <Link
                      href={`/products/${gender.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="mb-4 block text-xs font-semibold uppercase tracking-[0.15em] text-ink hover:text-gold transition-colors"
                    >
                      {gender.name}
                    </Link>

                    <div className="space-y-1">
                      {gender.children?.map((discipline) => (
                        <div key={discipline.id}>
                          <Link
                            href={buildCategoryPath(discipline, gender)}
                            onClick={() => setIsOpen(false)}
                            className="block py-1.5 text-[11px] font-medium text-ink/60 hover:text-gold transition-colors"
                          >
                            {discipline.name}
                          </Link>

                          {discipline.children && discipline.children.length > 0 && (
                            <div className="ml-3 space-y-0.5 border-l border-cream-200 pl-3">
                              {discipline.children.map((child) => (
                                <Link
                                  key={child.id}
                                  href={buildCategoryPath(child, discipline, gender)}
                                  onClick={() => setIsOpen(false)}
                                  className="block py-1 text-[10px] text-ink/40 hover:text-gold transition-colors"
                                >
                                  {child.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  );
}
