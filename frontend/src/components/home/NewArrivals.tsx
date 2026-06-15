'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import type { Product } from '@/types';
import ProductCard from '@/components/products/ProductCard';

interface NewArrivalsProps {
  products: Product[];
}

export default function NewArrivals({ products }: NewArrivalsProps) {
  if (!products.length) return null;

  return (
    <Container as="section" className="py-20 lg:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12 flex items-end justify-between"
      >
        <div>
          <span className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
            Fresh Drops
          </span>
          <h2 className="font-display text-4xl font-bold text-ink lg:text-5xl">
            New Arrivals
          </h2>
        </div>
        <Link
          href="/products?sort=newest"
          className="hidden text-sm font-medium tracking-wider uppercase text-ink transition-colors hover:text-accent md:block"
        >
          View All →
        </Link>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {products.slice(0, 8).map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-10 text-center md:hidden"
      >
        <Link
          href="/products?sort=newest"
          className="text-sm font-medium tracking-wider uppercase text-ink underline underline-offset-4 hover:text-accent"
        >
          View All →
        </Link>
      </motion.div>
    </Container>
  );
}
