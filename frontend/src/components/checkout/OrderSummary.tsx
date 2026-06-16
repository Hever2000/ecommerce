'use client';

import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import type { CartItem } from '@/types';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shippingMethod: string;
}

export default function OrderSummary({ items, subtotal, shippingMethod, children }: OrderSummaryProps & { children?: React.ReactNode }) {
  const shippingLabel =
    shippingMethod === 'pickup' ? 'Gratis' : 'A calcular';
  const shippingValue = shippingMethod === 'pickup' ? 0 : null;

  return (
    <div className="lg:sticky lg:top-32">
      <div className="border border-cream-200 bg-cream-50/80">
        <div className="border-b border-cream-200 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Package size={18} strokeWidth={1.5} className="text-ink-lighter" />
            <h2 className="font-display text-lg font-bold text-ink">
              Resumen de Compra
            </h2>
          </div>
        </div>

        <div className="space-y-5 p-6 sm:p-8">
          {items.map((item, index) => {
            const image = item.variant.image || item.product.images[0];
            const variantLabel = Object.values(item.variant.attributes).join(', ');

            return (
              <motion.div
                key={item.variant.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-4"
              >
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden bg-cream-200">
                  {image ? (
                    <div
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package size={20} strokeWidth={1} className="text-cream-300" />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {item.product.name}
                    </p>
                    {variantLabel && (
                      <p className="truncate text-xs text-ink-lighter">
                        {variantLabel}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-ink-lighter">
                      Cant: {item.quantity}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-sm font-semibold text-ink">
                    ${(item.variant.price * item.quantity).toLocaleString('es-AR')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="border-t border-cream-200 p-6 sm:p-8">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-lighter">Subtotal</span>
              <span className="font-medium text-ink">
                ${subtotal.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-lighter">Envío</span>
              <span className={shippingMethod === 'pickup' ? 'font-medium text-green-600' : 'font-medium text-ink-lighter'}>
                {shippingLabel}
              </span>
            </div>

            <div className="border-t border-cream-200 pt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-ink">Total</span>
                <span className="font-bold text-ink">
                  ${subtotal.toLocaleString('es-AR')}
                </span>
              </div>
              <p className="mt-1 text-right text-[10px] text-ink-lighter">
                {shippingMethod === 'pickup'
                  ? 'Sin costo de envío'
                  : 'El costo de envío se calculará al finalizar'}
              </p>
            </div>
          </div>

          {shippingMethod === 'home_delivery' && (
            <div className="mt-4 rounded bg-cream-200/50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-ink-lighter">
                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                <span>El envío se calcula según la provincia de destino.</span>
              </div>
            </div>
          )}

          {children && (
            <div className="mt-6">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
