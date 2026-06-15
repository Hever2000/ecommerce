'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function BrandStory() {
  return (
    <section className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="aspect-[4/5] overflow-hidden bg-cream-200"
          >
            <div
              className="h-full w-full bg-cover bg-center transition-transform duration-700 hover:scale-105"
              style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&q=80)',
              }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="mb-4 block text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
              Our Story
            </span>
            <h2 className="font-display text-4xl font-bold leading-tight text-ink lg:text-5xl">
              Crafted for Those
              <br />
              <span className="italic">Who Demand More</span>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-ink-light">
              We believe clothing should be more than just fabric. Every piece is designed with
              intention — from the weight of the material to the precision of the stitch.
              We don&apos;t follow trends. We set standards.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-light">
              Our commitment: uncompromising quality, timeless design, and a fit that feels like
              it was made for you. Because you deserve better than fast fashion.
            </p>
            <div className="mt-8">
              <Link href="/about">
                <Button variant="outline" size="md">
                  Read Our Story
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
