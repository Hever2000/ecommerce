'use client';

import { motion } from 'framer-motion';
import { Search, Shield, Star } from 'lucide-react';

const VALUES = [
  {
    icon: Search,
    title: 'Búsqueda Experta',
    description:
      'Buscá por tipos de taco, reglamento de competición, tela y talla. Todo lo que necesitás para encontrar la pieza exacta que tu performance exige.',
  },
  {
    icon: Shield,
    title: 'Catálogo 100% Oficial',
    description:
      'Redirigimos directo a los fabricantes de élite mundial. Garantizamos autenticidad en cada prenda: lo que ves es lo que bailás.',
  },
  {
    icon: Star,
    title: 'Para Cada Nivel',
    description:
      'Desde el competidor profesional que pisa el podio de Blackpool hasta el amateur apasionado que baila por el placer de hacerlo.',
  },
];

export default function ValueProposition() {
  return (
    <section className="bg-ink py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-16 text-center">
          <span className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
            ¿Por qué Premium Ballroom?
          </span>
          <h2 className="font-display text-3xl font-bold text-cream lg:text-4xl">
            Más que una tienda
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-cream/50">
            Unificamos lo mejor del ballroom mundial para que vos te concentres
            en lo que importa: bailar.
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-3 md:gap-12">
          {VALUES.map((value, i) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center md:text-left"
            >
              <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center border border-gold/30 md:mx-0">
                <value.icon size={20} className="text-gold" />
              </div>
              <h3 className="font-display text-xl font-semibold text-cream">
                {value.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-cream/50">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
