'use client';

import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Truck, Store } from 'lucide-react';
import type { ShippingMethod as ShippingMethodType } from '@/types';

interface ShippingMethodProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  watch: (name: any) => string;
}

const methods: {
  value: ShippingMethodType;
  label: string;
  description: string;
  icon: React.ReactNode;
  eta: string;
}[] = [
  {
    value: 'home_delivery',
    label: 'Envío a domicilio',
    description: 'Recibilo en la puerta de tu casa',
    icon: <Truck size={20} strokeWidth={1.5} />,
    eta: '3-7 días hábiles',
  },
  {
    value: 'pickup',
    label: 'Retiro en sucursal',
    description: 'Sin costo — retirás cuando quieras',
    icon: <Store size={20} strokeWidth={1.5} />,
    eta: 'Disponible en 24-48 hs',
  },
];

export default function ShippingMethod({ register, errors, watch }: ShippingMethodProps) {
  const selected = watch('shippingMethod');

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-cream-200 bg-cream-50/80 p-6 sm:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-cream-50 text-xs font-bold">
          3
        </div>
        <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
          Método de Envío
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {methods.map((method) => {
          const isSelected = selected === method.value;

          return (
            <label
              key={method.value}
              className={clsx(
                'relative flex cursor-pointer flex-col gap-3 border p-5 transition-all duration-200',
                isSelected
                  ? 'border-ink bg-ink/5'
                  : 'border-cream-200 bg-cream-50 hover:border-cream-300'
              )}
            >
              <input
                type="radio"
                value={method.value}
                {...register('shippingMethod')}
                className="sr-only"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      'flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200',
                      isSelected ? 'bg-ink text-cream-50' : 'bg-cream-200 text-ink-lighter'
                    )}
                  >
                    {method.icon}
                  </div>
                  <div>
                    <p
                      className={clsx(
                        'text-sm font-semibold transition-colors duration-200',
                        isSelected ? 'text-ink' : 'text-ink'
                      )}
                    >
                      {method.label}
                    </p>
                    <p className="text-xs text-ink-lighter">{method.description}</p>
                  </div>
                </div>

                <div
                  className={clsx(
                    'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200',
                    isSelected ? 'border-ink' : 'border-cream-300'
                  )}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="shipping-dot"
                      className="h-2.5 w-2.5 rounded-full bg-ink"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-ink-lighter">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {method.eta}
              </div>

              {isSelected && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink origin-left"
                />
              )}
            </label>
          );
        })}
      </div>

      {errors.shippingMethod && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-xs text-red-500"
        >
          {errors.shippingMethod.message as string}
        </motion.p>
      )}
    </motion.section>
  );
}
