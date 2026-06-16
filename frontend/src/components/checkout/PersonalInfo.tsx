'use client';

import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { User, Mail, Phone } from 'lucide-react';

interface PersonalInfoProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  watch: (name: any) => string;
}

export default function PersonalInfo({ register, errors, watch }: PersonalInfoProps) {

  const fields: {
    name: string;
    label: string;
    type?: string;
    placeholder: string;
    icon?: React.ReactNode;
  }[] = [
    {
      name: 'firstName',
      label: 'Nombre',
      placeholder: 'Tu nombre',
      icon: <User size={14} strokeWidth={1.5} />,
    },
    {
      name: 'lastName',
      label: 'Apellido',
      placeholder: 'Tu apellido',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'tu@email.com',
      icon: <Mail size={14} strokeWidth={1.5} />,
    },
    {
      name: 'phone',
      label: 'Teléfono',
      type: 'tel',
      placeholder: '+54 11 1234-5678',
      icon: <Phone size={14} strokeWidth={1.5} />,
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-cream-200 bg-cream-50/80 p-6 sm:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-cream-50 text-xs font-bold">
          1
        </div>
        <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
          Información Personal
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const error = errors[field.name]?.message as string | undefined;
          const value = watch(field.name) || '';
          const hasValue = value.length > 0;

          return (
            <div key={field.name}>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-ink-lighter">
                {field.label}
              </label>
              <div className="relative">
                {field.icon && (
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-lighter">
                    {field.icon}
                  </div>
                )}
                <input
                  {...register(field.name)}
                  type={field.type || 'text'}
                  placeholder={field.placeholder}
                  className={clsx(
                    'w-full border bg-cream-50 px-4 py-3 text-sm text-ink placeholder:text-cream-300 transition-all duration-200',
                    'focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink/10',
                    error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
                    !error && hasValue && 'border-green-400/60',
                    !error && !hasValue && 'border-cream-200',
                    field.icon && 'pl-9'
                  )}
                />
                {hasValue && !error && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 text-xs text-red-500"
                >
                  {error}
                </motion.p>
              )}
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
