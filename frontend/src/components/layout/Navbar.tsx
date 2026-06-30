'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu, X, User, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { api } from '@/lib/api';
import CategoryMegaMenu from './CategoryMegaMenu';
import type { Category } from '@/types';

const NAV_ITEMS = [
  { label: 'Marcas', href: '/brands' },
  { label: 'Sobre Nosotros', href: '/about' },
  { label: 'Colaborá', href: '/collaborate' },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    api.get<Category[]>('/categories/tree').then(setCategories).catch(() => {});
  }, []);

  const isTransparent = isHome && !scrolled && !menuOpen;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        isTransparent
          ? 'bg-transparent'
          : 'bg-cream/85 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)]'
      }`}
    >
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="relative z-10">
          <span
            className={`font-display text-xl font-bold tracking-tight transition-colors duration-700 ${
              isTransparent ? 'text-cream' : 'text-ink'
            }`}
          >
            Premium Ballroom
          </span>
        </Link>

        <div className="hidden items-center gap-10 md:flex">
          <CategoryMegaMenu categories={categories} isTransparent={isTransparent} />
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[11px] font-semibold tracking-[0.15em] uppercase transition-colors duration-300 hover:text-gold ${
                isTransparent ? 'text-cream/85' : 'text-ink/70'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className={`transition-colors duration-300 hover:text-gold ${
              isTransparent ? 'text-cream/85' : 'text-ink/70'
            }`}
            aria-label="Iniciar sesión"
          >
            <User size={19} />
          </Link>

          <button
            className={`transition-colors duration-300 hover:text-gold ${
              isTransparent ? 'text-cream/85' : 'text-ink/70'
            }`}
            aria-label="Buscar"
          >
            <Search size={19} />
          </button>

          <Link
            href="/cart"
            className={`relative flex items-center gap-1 transition-colors duration-300 hover:text-gold ${
              isTransparent ? 'text-cream/85' : 'text-ink/70'
            }`}
          >
            <ShoppingBag size={19} />
            {mounted && itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-ink">
                {itemCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`relative z-10 md:hidden transition-colors duration-300 ${
              isTransparent ? 'text-cream/85' : 'text-ink/70'
            }`}
            aria-label="Menú"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-cream-200 bg-cream/95 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-1 px-6 py-8">
              <div>
                <button
                  onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                  className="flex w-full items-center justify-between py-3 font-display text-2xl text-ink hover:text-gold transition-colors"
                >
                  Categorías
                  <ChevronRight
                    size={20}
                    className={`transition-transform duration-200 ${
                      mobileCategoriesOpen ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {mobileCategoriesOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 space-y-3 border-l-2 border-cream-200 pl-4 pb-4">
                        {categories.map((gender) => (
                          <div key={gender.id}>
                            <Link
                              href={`/products/${gender.slug}`}
                              onClick={() => setMenuOpen(false)}
                              className="block py-1.5 text-base font-semibold text-ink hover:text-gold transition-colors"
                            >
                              {gender.name}
                            </Link>
                            <div className="ml-4 space-y-1">
                              {gender.children?.map((discipline) => (
                                <div key={discipline.id}>
                                  <Link
                                    href={`/products/${gender.slug}/${discipline.slug.replace(`${gender.slug}-`, '')}`}
                                    onClick={() => setMenuOpen(false)}
                                    className="block py-1 text-sm text-ink/70 hover:text-gold transition-colors"
                                  >
                                    {discipline.name}
                                  </Link>
                                  {discipline.children && discipline.children.length > 0 && (
                                    <div className="ml-4 space-y-0.5 border-l border-cream-100 pl-3">
                                      {discipline.children.map((child) => (
                                        <Link
                                          key={child.id}
                                          href={`/products/${gender.slug}/${discipline.slug.replace(`${gender.slug}-`, '')}/${child.slug.replace(`${discipline.slug}-`, '')}`}
                                          onClick={() => setMenuOpen(false)}
                                          className="block py-0.5 text-xs text-ink/40 hover:text-gold transition-colors"
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 font-display text-2xl text-ink hover:text-gold transition-colors"
                >
                  {item.label}
                </Link>
              ))}

              <div className="border-t border-cream-200 pt-4 mt-4">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 py-3 text-sm text-ink/50 hover:text-gold transition-colors"
                >
                  <User size={16} />
                  Iniciar sesión
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
