'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu, X, LogIn } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';

const NAV_ITEMS = [
  { label: 'Shop', href: '/products' },
  { label: 'New In', href: '/products?sort=newest' },
  { label: 'Collections', href: '/collections' },
  { label: 'About', href: '/about' },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        !isHome || scrolled || menuOpen
          ? 'bg-cream-50/95 backdrop-blur-md shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="relative z-10">
          <span
            className={`font-display text-2xl font-bold tracking-tight transition-colors duration-500 ${
              isHome && !scrolled && !menuOpen ? 'text-white' : 'text-ink'
            }`}
          >
            STORE
          </span>
        </Link>

        <div className="hidden items-center gap-10 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium tracking-wider uppercase transition-colors duration-300 hover:text-accent ${
                isHome && !scrolled && !menuOpen ? 'text-white/90' : 'text-ink'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className={`hidden sm:block transition-colors duration-300 hover:text-accent ${
              isHome && !scrolled && !menuOpen ? 'text-white/90' : 'text-ink'
            }`}
            aria-label="Admin Login"
          >
            <LogIn size={20} />
          </Link>

          <button
            className={`transition-colors duration-300 hover:text-accent ${
              isHome && !scrolled && !menuOpen ? 'text-white/90' : 'text-ink'
            }`}
            aria-label="Search"
          >
            <Search size={20} />
          </button>

          <Link
            href="/cart"
            className={`relative flex items-center gap-1 transition-colors duration-300 hover:text-accent ${
              isHome && !scrolled && !menuOpen ? 'text-white/90' : 'text-ink'
            }`}
          >
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-cream-50">
                {itemCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`relative z-10 md:hidden transition-colors duration-300 ${
              !isHome || scrolled || menuOpen ? 'text-ink' : 'text-white/90'
            }`}
            aria-label="Menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-cream-200 bg-cream-50 md:hidden"
          >
            <div className="space-y-1 px-6 py-8">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 font-display text-2xl text-ink hover:text-accent transition-colors"
                >
                  {item.label}
                </Link>
              ))}

              <div className="border-t border-cream-200 pt-4 mt-4">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 py-3 text-sm text-ink/50 hover:text-accent transition-colors"
                >
                  <LogIn size={16} />
                  Admin Login
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
