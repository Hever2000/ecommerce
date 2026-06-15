'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api, ApiError } from '@/lib/api';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import type { Order } from '@/types';
import { CheckCircle, Package } from 'lucide-react';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const res = await api.get<Order>(`/orders/${orderId}`);
        setOrder(res);
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
        else setError('Error loading order');
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  const statusStyles: Record<string, string> = {
    pending: 'bg-cream-200 text-ink',
    confirmed: 'bg-accent/20 text-accent-dark',
    processing: 'bg-brand/10 text-brand',
    shipped: 'bg-brand/10 text-brand',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-600',
  };

  if (loading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center py-28">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-cream-200" />
          <div className="mx-auto h-8 w-48 animate-pulse bg-cream-200" />
        </div>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-28 text-center">
        <h1 className="font-display text-4xl font-bold text-ink">Error</h1>
        <p className="mt-3 text-ink-lighter">{error ?? 'Order not found'}</p>
        <Link href="/" className="mt-8">
          <Button variant="outline" size="lg">Back Home</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl text-center"
      >
        <CheckCircle className="mx-auto mb-6 h-16 w-16 text-ink" strokeWidth={1} />
        <h1 className="font-display text-4xl font-bold text-ink lg:text-5xl">Order Confirmed</h1>
        <p className="mt-3 text-ink-lighter">Your order has been placed successfully.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-auto mt-12 max-w-2xl border border-cream-200 p-8"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-lighter">Order #{order.orderNumber}</p>
            <p className="mt-1 text-xs text-ink-lighter">
              {new Date(order.createdAt).toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusStyles[order.status] || 'bg-cream-200 text-ink'}`}>
            {order.status}
          </span>
        </div>

        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div>
                <p className="font-medium text-ink">{item.productName}</p>
                <p className="text-xs text-ink-lighter">{item.variantLabel} x{item.quantity}</p>
              </div>
              <span className="font-medium text-ink">
                ${(item.unitPrice * item.quantity).toLocaleString('es-AR')}
              </span>
            </div>
          ))}
        </div>

        <div className="my-6 border-t border-cream-200" />

        <div className="space-y-3 text-sm">
          {order.customerInfo && (
            <div className="flex justify-between">
              <span className="text-ink-lighter">Customer</span>
              <span className="font-medium text-ink">
                {order.customerInfo.firstName} {order.customerInfo.lastName}
              </span>
            </div>
          )}
          {order.shippingAddress && (
            <div className="flex justify-between">
              <span className="text-ink-lighter">Shipping to</span>
              <span className="max-w-[250px] text-right font-medium text-ink">
                {order.shippingAddress.street}, {order.shippingAddress.city}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-ink-lighter">Method</span>
            <span className="font-medium text-ink">
              {order.shippingMethod === 'pickup' ? 'Store Pickup' : 'Home Delivery'}
            </span>
          </div>
        </div>

        <div className="my-6 border-t border-cream-200" />

        <div className="flex justify-between">
          <span className="font-display text-xl font-bold text-ink">Total</span>
          <span className="font-display text-xl font-bold text-ink">
            ${order.total.toLocaleString('es-AR')}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mx-auto mt-10 max-w-2xl text-center"
      >
        <Link href="/products">
          <Button variant="outline" size="lg">
            Continue Shopping
          </Button>
        </Link>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-lighter">
          <Package size={14} strokeWidth={1.5} />
          <span>You&apos;ll receive a confirmation email shortly.</span>
        </div>
      </motion.div>
    </Container>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <Container className="flex min-h-[60vh] items-center justify-center py-28">
        <div className="mx-auto h-8 w-48 animate-pulse bg-cream-200" />
      </Container>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
