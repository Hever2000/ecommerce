'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const DISCIPLINES = [
  {
    title: 'Mujer',
    description: 'Descubrí nuestra colección completa para mujer.',
    href: '/products/mujer',
    image: '/mujer.jpg',
  },
  {
    title: 'Hombre',
    description: 'Descubrí nuestra colección completa para hombre.',
    href: '/products/hombre',
    image: '/hombre.avif',
  },
];

export default function DisciplineSelector() {
  return (
    <section className="bg-cream py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-14 text-center">
          <span className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
            Explorar
          </span>
          <h2 className="font-display text-3xl font-bold text-ink lg:text-4xl">
            Categorías
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {DISCIPLINES.map((discipline, i) => (
            <motion.div
              key={discipline.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
            >
              <Link
                href={discipline.href}
                className="group relative block aspect-[4/3] overflow-hidden md:aspect-[3/2]"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${discipline.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10 transition-opacity duration-500 group-hover:opacity-90" />
                <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-10">
                  <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                    Categoría
                  </span>
                  <h3 className="font-display text-3xl font-bold text-cream lg:text-4xl">
                    {discipline.title}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-cream/70">
                    {discipline.description}
                  </p>
                  <span className="mt-4 inline-block border-b border-cream/40 pb-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-cream transition-colors duration-300 group-hover:border-gold group-hover:text-gold">
                    Explorar colección
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
