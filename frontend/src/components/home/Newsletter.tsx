'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('success');
    setEmail('');
    setTimeout(() => setStatus('idle'), 3000);
  }

  return (
    <section className="border-t border-cream-200 bg-brand py-20 lg:py-32">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="mb-4 block text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
            Stay Connected
          </span>
          <h2 className="font-display text-4xl font-bold text-white lg:text-5xl">
            Join the Inner Circle
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-cream-300/70">
            Be the first to know about new drops, exclusive collections, and member-only pricing.
          </p>

          <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 border-2 border-cream-300/20 bg-transparent px-4 py-3 text-sm text-white placeholder:text-cream-300/40 focus:border-accent focus:outline-none"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="bg-accent text-ink hover:bg-accent-light"
            >
              {status === 'success' ? 'Subscribed ✓' : 'Subscribe'}
            </Button>
          </form>

          {status === 'success' && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-accent"
            >
              You&apos;re in. Welcome to the inner circle.
            </motion.p>
          )}
        </motion.div>
      </Container>
    </section>
  );
}
