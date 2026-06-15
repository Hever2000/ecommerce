'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GoogleLogin } from '@react-oauth/google';
import { api, ApiError } from '@/lib/api';
import { storeAuth, getRedirectPath } from '@/lib/auth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormValues) {
    setLoginError(null);
    try {
      const res = await api.post<any>('/auth/login', data);
      storeAuth(res);
      router.push(getRedirectPath(res.user.role));
    } catch (err) {
      if (err instanceof ApiError) {
        setLoginError(err.message);
      } else {
        setLoginError('Error al iniciar sesión');
      }
    }
  }

  async function handleGoogleSuccess(credentialResponse: any) {
    setLoginError(null);
    try {
      const res = await api.post<any>('/auth/google', {
        idToken: credentialResponse.credential,
      });
      storeAuth(res);
      router.push(getRedirectPath(res.user.role));
    } catch (err) {
      if (err instanceof ApiError) {
        setLoginError(err.message);
      } else {
        setLoginError('Error al iniciar sesión con Google');
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
              Iniciá sesión en tu cuenta
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            {loginError && (
              <p className="text-sm text-red-600 text-center">{loginError}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cream-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-ink-lighter">o continuá con</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setLoginError('Error al autenticar con Google')}
              size="large"
              shape="rectangular"
              theme="outline"
              text="signin_with"
            />
          </div>

          <p className="mt-8 text-center text-sm text-ink-light">
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="font-semibold text-accent hover:text-accent-dark transition-colors">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
