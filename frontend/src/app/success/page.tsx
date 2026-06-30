'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api, ApiError } from '@/lib/api';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import type { Order } from '@/types';

const statusStyles: Record<string, string> = {
  PENDING: 'bg-cream-200 text-ink',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-600',
  CANCELLED: 'bg-red-100 text-red-600',
  SHIPPED: 'bg-brand/10 text-brand',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  FAILED: 'Rechazado',
  CANCELLED: 'Cancelado',
  SHIPPED: 'Enviado',
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('No se recibió el ID de la orden');
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const res = await api.get<Order>(`/orders/${orderId}`);
        setOrder(res);
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
        else setError('Error al cargar la orden');
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

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
        <p className="mt-3 text-ink-lighter">{error ?? 'Orden no encontrada'}</p>
        <Link href="/" className="mt-8">
          <Button variant="outline" size="lg">Volver al inicio</Button>
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
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        >
          <CheckCircle className="mx-auto mb-6 h-16 w-16 text-green-500" strokeWidth={1.5} />
        </motion.div>
        <h1 className="font-display text-4xl font-bold text-ink lg:text-5xl">
          ¡Pago Confirmado!
        </h1>
        <p className="mt-3 text-ink-lighter">
          Tu orden fue procesada correctamente.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-auto mt-12 max-w-2xl border border-cream-200 bg-cream-50/80 p-8"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-lighter">
              Orden #{order.id.slice(0, 8)}
            </p>
            <p className="mt-1 text-xs text-ink-lighter">
              {new Date(order.createdAt).toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${statusStyles[order.status] || 'bg-cream-200 text-ink'}`}
          >
            {statusLabels[order.status] || order.status}
          </span>
        </div>

        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium text-ink">{item.variant?.product?.name ?? 'Producto'}</p>
                  <p className="text-xs text-ink-lighter">
                    {item.variant?.sku ?? ''} x{item.quantity}
                  </p>
                </div>
              </div>
              <span className="font-medium text-ink">
                ${(item.unitPrice * item.quantity).toLocaleString('es-AR')}
              </span>
            </div>
          ))}
        </div>

        <div className="my-6 border-t border-cream-200" />

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-lighter">Subtotal</span>
            <span className="font-medium text-ink">${order.subtotal.toLocaleString('es-AR')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-lighter">Envío</span>
            <span className="font-medium text-ink-lighter">
              ${order.shippingCost.toLocaleString('es-AR')}
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
          <Button variant="outline" size="lg" className="group">
            Seguir Comprando
            <ArrowRight size={16} strokeWidth={1.5} className="ml-2 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-lighter">
          <Package size={14} strokeWidth={1.5} />
          <span>Recibirás un email de confirmación en breve.</span>
        </div>
      </motion.div>
    </Container>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <Container className="flex min-h-[60vh] items-center justify-center py-28">
        <div className="mx-auto h-8 w-48 animate-pulse bg-cream-200" />
      </Container>
    }>
      <SuccessContent />
    </Suspense>
  );
}
