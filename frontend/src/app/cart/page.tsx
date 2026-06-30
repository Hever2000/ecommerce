'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCartStore } from '@/lib/cart-store';
import CartItemComponent from '@/components/cart/CartItem';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { ShoppingBag } from 'lucide-react';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const total = items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-28 text-center">
        <ShoppingBag className="mb-6 h-12 w-12 text-ink-lighter" strokeWidth={1} />
        <h1 className="font-display text-4xl font-bold text-ink">Your cart is empty</h1>
        <p className="mt-3 text-ink-lighter">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/products" className="mt-8">
          <Button variant="outline" size="lg">Shop Now</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-4xl font-bold text-ink lg:text-5xl">Cart</h1>
          <p className="mt-2 text-sm text-ink-lighter">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold uppercase tracking-wider text-ink-lighter hover:text-ink transition-colors"
        >
          Clear All
        </button>
      </motion.div>

      <div className="lg:grid lg:grid-cols-3 lg:gap-12">
        <div className="lg:col-span-2 space-y-6">
          {items.map((item, i) => (
            <motion.div
              key={item.variant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <CartItemComponent item={item} />
            </motion.div>
          ))}
        </div>

        <div className="mt-10 lg:mt-0">
          <div className="border border-cream-200 p-8 lg:sticky lg:top-32">
            <h2 className="mb-6 font-display text-2xl font-bold text-ink">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-lighter">Subtotal</span>
                <span className="font-medium text-ink">${total.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-lighter">Shipping</span>
                <span className="font-medium text-ink-lighter">Calculated at checkout</span>
              </div>
              <div className="border-t border-cream-200 pt-3">
                <div className="flex justify-between text-base">
                  <span className="font-semibold text-ink">Total</span>
                  <span className="font-bold text-ink">${total.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>

            <Link href="/checkout" className="mt-6 block">
              <Button variant="primary" size="xl" className="w-full">
                Checkout
              </Button>
            </Link>

            <Link
              href="/products"
              className="mt-4 block text-center text-xs font-semibold uppercase tracking-wider text-ink-lighter hover:text-ink transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}
