'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, ApiError } from '@/lib/api';
import { storeAuth } from '@/lib/auth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const registerSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirmá tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [registerError, setRegisterError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormValues) {
    setRegisterError(null);
    try {
      const res = await api.post<any>('/auth/register', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      storeAuth(res);
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setRegisterError(err.message);
      } else {
        setRegisterError('Error al registrarse');
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 px-4 pt-20">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="rounded-xl border border-cream-200 bg-white p-8 shadow-sm">
          <div className="text-center mb-8">
            <Link href="/" className="font-display text-3xl font-bold text-ink tracking-tight">
              STORE
            </Link>
            <p className="mt-2 text-sm text-ink-light">
              Creá tu cuenta
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nombre"
                placeholder="Juan"
                {...register('firstName')}
                error={errors.firstName?.message}
              />
              <Input
                label="Apellido"
                placeholder="Pérez"
                {...register('lastName')}
                error={errors.lastName?.message}
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />

            {registerError && (
              <p className="text-sm text-red-600 text-center">{registerError}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-light">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="font-semibold text-accent hover:text-accent-dark transition-colors">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
