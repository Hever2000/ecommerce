'use client';

import { motion } from 'framer-motion';
import Container from '@/components/ui/Container';
import { Truck, RotateCcw, ShieldCheck } from 'lucide-react';

const BENEFITS = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On all orders over $150. Fast, tracked delivery worldwide.',
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    description: '30-day return policy. No questions asked, free return shipping.',
  },
  {
    icon: ShieldCheck,
    title: 'Premium Quality',
    description: 'Every piece inspected for fit, finish, and durability before shipping.',
  },
];

export default function Benefits() {
  return (
    <Container as="section" className="py-20 lg:py-32">
      <div className="grid gap-8 md:grid-cols-3">
        {BENEFITS.map((benefit, i) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="border border-cream-200 p-8 text-center"
          >
            <benefit.icon className="mx-auto mb-4 h-8 w-8 text-ink" strokeWidth={1} />
            <h3 className="mb-2 font-display text-xl font-bold text-ink">
              {benefit.title}
            </h3>
            <p className="text-sm leading-relaxed text-ink-light">
              {benefit.description}
            </p>
          </motion.div>
        ))}
      </div>
    </Container>
  );
}
