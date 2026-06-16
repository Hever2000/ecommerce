'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { XCircle, RefreshCw, ArrowLeft, HelpCircle } from 'lucide-react';

function FailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-28 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        >
          <XCircle className="mx-auto mb-6 h-16 w-16 text-red-400" strokeWidth={1.5} />
        </motion.div>

        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          Pago no concretado
        </h1>

        <p className="mt-4 text-sm text-ink-lighter">
          El pago no pudo procesarse. No se realizó ningún cargo.
          {orderId && (
            <span className="mt-2 block text-xs text-cream-300">
              Orden: #{orderId.slice(0, 8)}
            </span>
          )}
        </p>

        <div className="mt-8 space-y-3">
          <Link href={orderId ? `/checkout` : '/'}>
            <Button variant="primary" size="xl" className="w-full sm:w-auto">
              <RefreshCw size={16} strokeWidth={1.5} className="mr-2" />
              Intentar de nuevo
            </Button>
          </Link>

          <div>
            <Link href="/">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                <ArrowLeft size={16} strokeWidth={1.5} className="mr-2" />
                Volver al inicio
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-10 border-t border-cream-200 pt-8">
          <div className="flex items-start gap-3 text-left">
            <HelpCircle size={18} strokeWidth={1.5} className="mt-0.5 flex-shrink-0 text-ink-lighter" />
            <div>
              <p className="text-sm font-medium text-ink">¿Necesitás ayuda?</p>
              <p className="mt-1 text-xs text-ink-lighter">
                Si el problema persiste, probá con otro medio de pago o
                comunicate con soporte.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </Container>
  );
}

export default function FailedPage() {
  return (
    <Suspense fallback={
      <Container className="flex min-h-[60vh] items-center justify-center py-28">
        <div className="mx-auto h-8 w-48 animate-pulse bg-cream-200" />
      </Container>
    }>
      <FailedContent />
    </Suspense>
  );
}
