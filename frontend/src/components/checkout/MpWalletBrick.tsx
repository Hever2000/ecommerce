'use client';

import { useEffect, useRef, useState } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

interface MpWalletBrickProps {
  preferenceId: string;
  orderId: string;
  onError: (error: string) => void;
}

export default function MpWalletBrick({ preferenceId, orderId, onError }: MpWalletBrickProps) {
  const [initialized, setInitialized] = useState(false);
  const [brickError, setBrickError] = useState<string | null>(null);
  const initCalled = useRef(false);

  useEffect(() => {
    if (initCalled.current) return;
    initCalled.current = true;

    const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
    if (!publicKey) {
      const msg = 'NEXT_PUBLIC_MP_PUBLIC_KEY no está configurada';
      setBrickError(msg);
      onError(msg);
      return;
    }

    try {
      initMercadoPago(publicKey, { locale: 'es-AR' });
      setInitialized(true);
    } catch {
      const msg = 'Error al inicializar Mercado Pago';
      setBrickError(msg);
      onError(msg);
    }
  }, [onError]);

  if (brickError) {
    return (
      <p className="text-xs text-red-600">{brickError}</p>
    );
  }

  if (!initialized) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink border-t-transparent" />
      </div>
    );
  }

  return (
    <Wallet
      initialization={{ preferenceId }}
      customization={{ valueProp: 'convenience_all' }}
      onReady={() => setBrickError(null)}
    />
  );
}
