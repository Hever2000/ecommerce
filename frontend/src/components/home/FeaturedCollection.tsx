'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import type { Product } from '@/types';
import ProductCard from '@/components/products/ProductCard';

interface FeaturedCollectionProps {
  products: Product[];
}

export default function FeaturedCollection({ products }: FeaturedCollectionProps) {
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
            Curated Selection
          </span>
          <h2 className="font-display text-4xl font-bold text-ink lg:text-5xl">
            Featured Collection
          </h2>
        </div>
        <Link
          href="/products?featured=true"
          className="hidden text-sm font-medium tracking-wider uppercase text-ink transition-colors hover:text-accent md:block"
        >
          Shop Collection →
        </Link>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {products.slice(0, 4).map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </Container>
  );
}
