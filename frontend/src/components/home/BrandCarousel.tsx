'use client';

import { motion } from 'framer-motion';

const BRANDS = [
  { name: 'Chrisanne Clover', subtitle: 'London Est. 1928' },
  { name: 'DSI London', subtitle: 'Dance Sport International' },
  { name: 'Supadance', subtitle: 'Since 1970' },
  { name: 'International Dance Shoes', subtitle: 'IDS London' },
  { name: 'Grand Prix', subtitle: 'Ballroom Couture' },
  { name: 'Aida Dance', subtitle: 'Wear Your Passion' },
  { name: 'TPCP', subtitle: 'Handmade' },
  { name: 'Sasuel', subtitle: 'Made in Italy' },
];

export default function BrandCarousel() {
  return (
    <section className="bg-cream py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-14 text-center">
          <span className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
            Marcas oficiales
          </span>
          <h2 className="font-display text-3xl font-bold text-ink lg:text-4xl">
            The World&apos;s Finest Brands
          </h2>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-cream to-transparent" />
        <div className="absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-cream to-transparent" />

        <motion.div
          className="flex gap-16"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        >
          {[...BRANDS, ...BRANDS].map((brand, i) => (
            <div
              key={`${brand.name}-${i}`}
              className="group flex w-[200px] flex-shrink-0 flex-col items-center justify-center py-8"
            >
              <span className="font-display text-xl font-bold tracking-wide text-ink/20 transition-colors duration-500 group-hover:text-ink/80 lg:text-2xl">
                {brand.name}
              </span>
              <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.15em] text-ink/10 transition-colors duration-500 group-hover:text-gold">
                {brand.subtitle}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
