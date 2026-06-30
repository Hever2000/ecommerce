'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api, ApiError } from '@/lib/api';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { ShoppingBag, RefreshCw } from 'lucide-react';
import type { Order } from '@/types';

const POLL_INTERVAL = 5000;

function PendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polls, setPolls] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

        if (res.status === 'PAID') {
          clearInterval(intervalRef.current!);
          router.push(`/success?orderId=${orderId}`);
          return;
        }

        if (res.status === 'FAILED' || res.status === 'CANCELLED') {
          clearInterval(intervalRef.current!);
          router.push(`/failed?orderId=${orderId}`);
          return;
        }

        setLoading(false);
        setPolls((p) => p + 1);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Error al verificar el pago');
        }
        setLoading(false);
      }
    }

    fetchOrder();

    intervalRef.current = setInterval(fetchOrder, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [orderId, router]);

  if (!orderId) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-28 text-center">
        <h1 className="font-display text-4xl font-bold text-ink">Error</h1>
        <p className="mt-3 text-ink-lighter">No se recibió el ID de la orden.</p>
        <a href="/" className="mt-8 inline-block">
          <Button variant="outline" size="lg">Volver al inicio</Button>
        </a>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-28 text-center">
        <h1 className="font-display text-4xl font-bold text-ink">Error</h1>
        <p className="mt-3 text-ink-lighter">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-8">
          <Button variant="outline" size="lg">Reintentar</Button>
        </button>
      </Container>
    );
  }

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-28 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative mx-auto mb-8 h-20 w-20">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-cream-300"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-t-ink border-r-transparent border-b-transparent border-l-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag size={24} strokeWidth={1} className="text-ink" />
          </div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display text-3xl font-bold text-ink sm:text-4xl"
        >
          Procesando tu pago
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mt-4 max-w-md text-sm text-ink-lighter"
        >
          Estamos esperando la confirmación del pago. No cierres esta página.
          {polls > 0 && (
            <span className="mt-2 block text-xs text-cream-300">
              Verificando... (intento {polls})
            </span>
          )}
        </motion.p>

        {order && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mx-auto mt-10 max-w-sm border border-cream-200 bg-cream-50/80 p-6"
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-lighter">Orden</span>
                <span className="font-medium text-ink">#{order.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-lighter">Total</span>
                <span className="font-semibold text-ink">${order.total.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-lighter">Estado</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-ink-lighter">
                  <RefreshCw size={12} className="animate-spin" />
                  Pendiente
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </Container>
  );
}

export default function PendingPage() {
  return (
    <Suspense fallback={
      <Container className="flex min-h-[60vh] items-center justify-center py-28">
        <div className="mx-auto h-8 w-48 animate-pulse bg-cream-200" />
      </Container>
    }>
      <PendingContent />
    </Suspense>
  );
}
