'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Container from '@/components/ui/Container';

const CATEGORIES = [
  {
    name: 'Hombre — Latin',
    slug: 'hombres-latin',
    image: 'https://images.unsplash.com/photo-1571749322778-fb7b0e018552?w=800&q=80',
  },
  {
    name: 'Mujer — Latin',
    slug: 'mujeres-latin',
    image: 'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=800&q=80',
  },
  {
    name: 'Ropa de Práctica',
    slug: 'mujeres-latin-ropa-practica',
    image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800&q=80',
  },
];

export default function FeaturedCategories() {
  return (
    <Container as="section" className="py-20 lg:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <span className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
          Categorías
        </span>
        <h2 className="font-display text-4xl font-bold text-ink lg:text-5xl">
          Explorá por Estilo
        </h2>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.slug}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
          >
            <Link
              href={`/products?category=${cat.slug}`}
              className="group relative block aspect-[3/4] overflow-hidden bg-cream-200"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${cat.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="font-display text-2xl font-bold text-cream">
                  {cat.name}
                </h3>
                <span className="mt-1 inline-block text-sm text-cream/70 transition-colors group-hover:text-gold">
                  Explorar →
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </Container>
  );
}
