'use client';

import Link from 'next/link';
import type { Product } from '@/types';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const lowestPrice = product.variants.length > 0
    ? Math.min(...product.variants.map((v) => v.price))
    : product.price;

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <Link href={`/producto/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-cream-200">
        {product.images[0] ? (
          <div
            className="h-full w-full bg-cover transition-all duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${product.images[0].url})`, backgroundPosition: 'center 15%' }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-lighter">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">Sin imagen</span>
          </div>
        )}

        {product.images[1] && (
          <div
            className="absolute inset-0 bg-cover opacity-0 transition-all duration-700 group-hover:opacity-100"
            style={{ backgroundImage: `url(${product.images[1].url})`, backgroundPosition: 'center 15%' }}
          />
        )}

        {totalStock === 0 && (
          <span className="absolute left-3 top-3 bg-accent px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-cream">
            Sin stock
          </span>
        )}
      </div>

      <div className="mt-4 space-y-1">
        {product.category && (
          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-ink-lighter">
            {product.category.name}
          </p>
        )}
        <h3 className="text-sm font-medium text-ink transition-colors group-hover:text-gold">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">
            ${(lowestPrice ?? 0).toLocaleString('es-AR')}
          </span>
        </div>
        <p className={`text-[10px] font-medium uppercase tracking-wider ${
          totalStock > 0 ? 'text-ink-lighter' : 'text-accent'
        }`}>
          {totalStock > 0 ? 'En stock' : 'Sin stock'}
        </p>
      </div>
    </Link>
  );
}
