'use client';

import { useEffect, useRef, useState } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

interface MpWalletBrickProps {
  preferenceId: string;
}

export default function MpWalletBrick({ preferenceId }: MpWalletBrickProps) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initCalled = useRef(false);

  useEffect(() => {
    if (initCalled.current) return;
    initCalled.current = true;

    const pk = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
    if (!pk) {
      setError('Falta NEXT_PUBLIC_MP_PUBLIC_KEY');
      return;
    }

    try {
      initMercadoPago(pk, { locale: 'es-AR' });
    } catch {
      setError('Error al inicializar Mercado Pago');
    }
  }, []);

  if (error) {
    return <p className="text-xs text-red-500">{error}</p>;
  }

  return (
    <div>
      <Wallet
        initialization={{ preferenceId }}
        customization={{ valueProp: 'convenience_all' }}
        onReady={() => setReady(true)}
        onError={(e) => setError(e.message)}
      />
    </div>
  );
}
