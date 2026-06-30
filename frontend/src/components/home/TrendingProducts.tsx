'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { Product } from '@/types';

interface TrendingProductsProps {
  products: Product[];
}

export default function TrendingProducts({ products }: TrendingProductsProps) {
  if (!products.length) return null;

  return (
    <section className="bg-cream py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <span className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
            Curated Trends
          </span>
          <h2 className="font-display text-3xl font-bold text-ink lg:text-4xl">
            Últimas Novedades <br className="md:hidden" />
            de la Pista
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-lighter">
            Una selección editorial de las piezas más impactantes de la temporada.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-6 lg:gap-8">
          {products.slice(0, 8).map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <EditorialCard product={product} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-14 text-center"
        >
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 border border-gold/50 px-8 py-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold transition-all duration-500 hover:bg-gold hover:text-ink"
          >
            <span>Ver colección completa</span>
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function EditorialCard({ product }: { product: Product }) {
  const lowestPrice =
    product.variants.length > 0
      ? Math.min(...product.variants.map((v) => v.price))
      : product.price;

  const brandName = product.category?.name ?? 'Colección Exclusiva';

  return (
    <div className="group">
      <Link href={`/producto/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-cream-100">
          {product.images[0] ? (
            <div
              className="h-full w-full bg-cover transition-all duration-700 group-hover:scale-[1.04]"
              style={{ backgroundImage: `url(${product.images[0].url})`, backgroundPosition: 'center 15%' }}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-ink-lighter">
                Sin imagen
              </span>
            </div>
          )}

          <span className="absolute left-4 top-4 text-[9px] font-medium uppercase tracking-[0.15em] text-cream/80 drop-shadow-sm">
            Available at {brandName}
          </span>
        </div>
      </Link>

      <div className="mt-5 space-y-1">
        <Link href={`/producto/${product.slug}`}>
          <h3 className="text-sm font-medium text-ink transition-colors group-hover:text-gold">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm font-semibold text-ink">
          ${(lowestPrice ?? 0).toLocaleString('es-AR')}
        </p>
      </div>

      <div className="mt-4">
        <Link
          href={`/producto/${product.slug}`}
          className="inline-block border border-gold/50 px-5 py-2.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-gold transition-all duration-500 hover:bg-gold hover:text-ink"
        >
          Ver en Tienda Oficial
        </Link>
      </div>
    </div>
  );
}
