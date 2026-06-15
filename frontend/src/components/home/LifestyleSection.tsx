'use client';

import { motion } from 'framer-motion';

export default function LifestyleSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative aspect-[2/1] overflow-hidden bg-cream-200 lg:aspect-[3/1]"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&q=80)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand/70 via-brand/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.2em] text-accent"
            >
              Editorial
            </motion.span>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="font-display text-3xl font-bold text-white lg:text-5xl"
            >
              Designed for Life
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-3 max-w-lg text-sm leading-relaxed text-white/70 lg:text-base"
            >
              From the boardroom to the weekend. Versatile pieces that transition seamlessly
              with your lifestyle.
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
