'use client';

import { motion } from 'framer-motion';
import { CreditCard, Landmark, Smartphone, Building, CheckCircle } from 'lucide-react';

export default function PaymentMethod() {
  const features = [
    { icon: <CreditCard size={16} strokeWidth={1.5} />, label: 'Tarjetas de crédito' },
    { icon: <CreditCard size={16} strokeWidth={1.5} />, label: 'Tarjetas de débito' },
    { icon: <Landmark size={16} strokeWidth={1.5} />, label: 'Transferencia bancaria' },
    { icon: <Smartphone size={16} strokeWidth={1.5} />, label: 'Saldo Mercado Pago' },
    { icon: <Building size={16} strokeWidth={1.5} />, label: 'Cuotas disponibles' },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-cream-200 bg-cream-50/80 p-6 sm:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-cream-50 text-xs font-bold">
          4
        </div>
        <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
          Método de Pago
        </h2>
      </div>

      <div className="overflow-hidden border border-cream-200 bg-cream-50">
        <div className="bg-gradient-to-br from-[#00a1e0] to-[#0093d0] p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <svg viewBox="0 0 30 30" className="h-8 w-8" fill="white">
              <path d="M15 0C6.716 0 0 6.716 0 15s6.716 15 15 15 15-6.716 15-15S23.284 0 15 0zm7.35 11.4c-.3.75-1.05 2.55-1.5 3.6-.15.45-.45.45-.6.15-.15-.3-.6-1.05-.75-1.35-.15-.3-.45-.15-.45.15v.6c0 .3-.15.6-.45.75l-2.25 1.05c-.45.15-.75-.15-.6-.6l.9-2.55c.15-.3.3-.6.45-.9.15-.45.3-1.05.45-1.5.15-.6.15-1.05-.15-1.2-.3-.15-.75 0-1.05.15l-3.75 2.4c-.45.3-.9.45-1.2.45-.3 0-.6-.15-.9-.45-.3-.3-.45-.6-.45-.9 0-.45.15-.9.6-1.35l.75-.6c.3-.3.6-.45.75-.6.15-.15.3-.3.45-.45.45-.45.75-.75.9-1.05.15-.3.15-.6 0-.75-.15-.15-.6-.15-1.05 0l-3.15 1.35c-.3.15-.6.15-.9.15-.3 0-.6 0-.9-.15L8.55 14.4c-.3-.15-.45-.45-.3-.75.15-.3.45-.45.75-.3l.6.15c.3.15.45.3.6.6.15.3.3.6.3.9 0 .3-.15.6-.3.9-.15.3-.3.6-.45.75-.15.15-.3.3-.45.45-.45.45-.75.75-.9 1.05-.15.3-.15.6 0 .75.15.15.6.15 1.05 0l3.15-1.35c.3-.15.6-.15.9-.15.3 0 .6 0 .9.15l.6.3c.3.15.45.45.3.75-.15.3-.45.45-.75.3l-.6-.15c-.3-.15-.45-.3-.6-.6-.15-.3-.3-.6-.3-.9 0-.3.15-.6.3-.9.15-.3.3-.6.45-.75.15-.15.3-.3.45-.45.45-.45.75-.75.9-1.05.15-.3.15-.6 0-.75-.15-.15-.6-.15-1.05 0l-3.15 1.35c-.3.15-.6.15-.9.15-.3 0-.6 0-.9-.15L.9 10.35C2.4 4.35 8.1 0 15 0c6.9 0 12.6 4.35 14.1 10.35l-2.85 1.35c-.3.15-.6.15-.9.15-.3 0-.6-.15-.9-.3z" />
            </svg>
            <span className="font-display text-xl font-bold text-white">
              Mercado Pago
            </span>
          </div>

          <p className="mb-4 text-sm text-white/80">Pagá con:</p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.label} className="flex items-center gap-2 text-sm text-white/90">
                <CheckCircle size={14} className="text-white/70" />
                {feature.icon}
                <span>{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
