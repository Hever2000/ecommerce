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
  const hasDiscount = product.comparePrice && product.comparePrice > lowestPrice;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-cream-200">
        {product.images[0] ? (
          <div
            className="h-full w-full bg-cover bg-center transition-all duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${product.images[0]})` }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-lighter">
            <span className="text-xs uppercase tracking-wider">No Image</span>
          </div>
        )}

        {product.images[1] && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-0 transition-all duration-700 group-hover:opacity-100"
            style={{ backgroundImage: `url(${product.images[1]})` }}
          />
        )}

        {hasDiscount && (
          <span className="absolute left-3 top-3 bg-accent px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-ink">
            Sale
          </span>
        )}
      </div>

      <div className="mt-4 space-y-1">
        {product.category && (
          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-ink-lighter">
            {product.category.name}
          </p>
        )}
        <h3 className="text-sm font-medium text-ink transition-colors group-hover:text-accent">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">
            ${(lowestPrice ?? 0).toLocaleString('es-AR')}
          </span>
          {hasDiscount && product.comparePrice != null && (
            <span className="text-xs text-ink-lighter line-through">
              ${product.comparePrice.toLocaleString('es-AR')}
            </span>
          )}
        </div>
        <p className={`text-[10px] font-medium uppercase tracking-wider ${
          totalStock > 0 ? 'text-ink-lighter' : 'text-red-500'
        }`}>
          {totalStock > 0 ? 'In Stock' : 'Out of Stock'}
        </p>
      </div>
    </Link>
  );
}
