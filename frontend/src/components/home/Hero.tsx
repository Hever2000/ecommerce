'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/fondoo.jpg)' }}
        />
      <div className="relative z-20 mx-auto max-w-4xl px-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 inline-block text-[10px] font-semibold uppercase tracking-[0.3em] text-gold"
        >
          La elegancia del movimiento
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-display text-display-sm font-bold text-cream sm:text-display"
        >
          Premium
          <br />
          <span className="italic text-gold">Ballroom</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cream/80"
        >
          La colección definitiva de las marcas más prestigiosas del mundo,
          unificada en un solo lugar.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-10"
        >
          <Link
            href="/products"
            className="group relative inline-block border border-gold/50 px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold transition-all duration-500 hover:bg-gold hover:text-ink"
          >
            <span className="relative z-10">
              Explorar el Catálogo
            </span>
          </Link>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 h-10 bg-gradient-to-t from-cream to-transparent" />
    </section>
  );
}
