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
      const msg = 'Falta NEXT_PUBLIC_MP_PUBLIC_KEY en el entorno';
      console.error('[MpWalletBrick]', msg);
      setError(msg);
      return;
    }

    console.log('[MpWalletBrick] Inicializando SDK con Public Key:', pk.slice(0, 8) + '...');
    try {
      initMercadoPago(pk, { locale: 'es-AR' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al inicializar Mercado Pago';
      console.error('[MpWalletBrick] Error initMercadoPago:', err);
      setError(msg);
    }
  }, []);

  if (error) {
    return (
      <div className="rounded border border-red-200 bg-red-50 px-4 py-3">
        <p className="text-xs text-red-600">Error de pago: {error}</p>
        <p className="mt-1 text-[10px] text-red-400">
          Verificá que NEXT_PUBLIC_MP_PUBLIC_KEY esté configurada correctamente.
        </p>
      </div>
    );
  }

  return (
    <div>
      {!ready && (
        <div className="flex items-center justify-center py-6">
          <svg className="h-5 w-5 animate-spin text-ink-lighter" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="ml-3 text-xs text-ink-lighter">Cargando medio de pago...</span>
        </div>
      )}
      <Wallet
        initialization={{ preferenceId }}
        customization={{ valueProp: 'convenience_all' }}
        onReady={() => {
          console.log('[MpWalletBrick] Wallet Brick listo');
          setReady(true);
        }}
        onError={(e) => {
          console.error('[MpWalletBrick] Wallet Brick error:', e);
          setError(e?.message || 'Error al cargar el botón de pago');
        }}
      />
    </div>
  );
}
