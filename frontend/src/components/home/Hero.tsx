'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-brand/40 via-brand/20 to-brand/60 z-10" />
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&q=80)',
          filter: 'brightness(0.7)',
        }}
      />
      <div className="relative z-20 mx-auto max-w-4xl px-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 inline-block text-[10px] font-semibold uppercase tracking-[0.3em] text-accent"
        >
          Summer Collection 2026
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-display text-display-sm font-bold text-white sm:text-display"
        >
          Define Your
          <br />
          <span className="italic text-accent">Style</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/80"
        >
          Premium apparel designed for those who refuse to blend in.
          Quality that speaks, fits that feel like they were made for you.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-10 flex items-center justify-center gap-4"
        >
          <Link href="/products">
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-ink">
              Shop Now
            </Button>
          </Link>
          <Link href="/collections">
            <Button variant="ghost" size="lg" className="text-white/80 hover:bg-white/10 hover:text-white">
              Explore
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
