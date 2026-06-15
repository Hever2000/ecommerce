'use client';

import { motion } from 'framer-motion';
import Container from '@/components/ui/Container';
import { Star } from 'lucide-react';

const REVIEWS = [
  {
    name: 'Alex M.',
    text: 'The quality is unbelievable. I\'ve been wearing the same hoodie for 6 months and it still looks brand new. Worth every penny.',
    rating: 5,
  },
  {
    name: 'Sam T.',
    text: 'Finally, a brand that understands fit. Their size guide is spot-on and the fabric speaks for itself. My new go-to.',
    rating: 5,
  },
  {
    name: 'Jordan K.',
    text: 'Ordered three pieces and each one exceeded expectations. The packaging, the feel, the attention to detail — outstanding.',
    rating: 5,
  },
];

export default function Reviews() {
  return (
    <Container as="section" className="py-20 lg:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center"
      >
        <span className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
          Testimonials
        </span>
        <h2 className="font-display text-4xl font-bold text-ink lg:text-5xl">
          What Our Customers Say
        </h2>
      </motion.div>

      <div className="grid gap-8 md:grid-cols-3">
        {REVIEWS.map((review, i) => (
          <motion.div
            key={review.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="border border-cream-200 p-8"
          >
            <div className="mb-4 flex gap-1">
              {Array.from({ length: review.rating }).map((_, j) => (
                <Star key={j} className="h-4 w-4 fill-accent text-accent" strokeWidth={0} />
              ))}
            </div>
            <p className="mb-6 text-sm leading-relaxed text-ink-light italic">
              &ldquo;{review.text}&rdquo;
            </p>
            <p className="text-xs font-semibold tracking-wider uppercase text-ink">
              {review.name}
            </p>
          </motion.div>
        ))}
      </div>
    </Container>
  );
}
