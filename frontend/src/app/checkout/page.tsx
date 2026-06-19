'use client';

import { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, ShieldCheck, ChevronLeft } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { useCheckoutStore } from '@/lib/checkout-store';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/checkout/ProgressBar';
import PersonalInfo from '@/components/checkout/PersonalInfo';
import ShippingAddress from '@/components/checkout/ShippingAddress';
import ShippingMethod from '@/components/checkout/ShippingMethod';
import PaymentMethod from '@/components/checkout/PaymentMethod';
import OrderSummary from '@/components/checkout/OrderSummary';
import MpWalletBrick from '@/components/checkout/MpWalletBrick';
import type { Order } from '@/types';

const baseSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(6, 'Teléfono inválido'),
  street: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  shippingMethod: z.enum(['pickup', 'home_delivery']),
});

const schema = baseSchema.superRefine((data, ctx) => {
  if (data.shippingMethod === 'home_delivery') {
    if (!data.street) ctx.addIssue({ code: 'custom', path: ['street'], message: 'La dirección es obligatoria' });
    if (!data.city) ctx.addIssue({ code: 'custom', path: ['city'], message: 'La ciudad es obligatoria' });
    if (!data.province) ctx.addIssue({ code: 'custom', path: ['province'], message: 'La provincia es obligatoria' });
    if (!data.postalCode) ctx.addIssue({ code: 'custom', path: ['postalCode'], message: 'El código postal es obligatorio' });
  }
});

type FormData = z.infer<typeof schema>;

const PROGRESS_STEPS = [
  { number: 1, label: 'Información' },
  { number: 2, label: 'Dirección' },
  { number: 3, label: 'Envío' },
  { number: 4, label: 'Pago' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const clearCheckout = useCheckoutStore((s) => s.clearCheckout);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [initPoint, setInitPoint] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);

  const defaults = useRef({
    firstName: useCheckoutStore.getState().personalInfo.firstName || '',
    lastName: useCheckoutStore.getState().personalInfo.lastName || '',
    email: useCheckoutStore.getState().personalInfo.email || '',
    phone: useCheckoutStore.getState().personalInfo.phone || '',
    street: useCheckoutStore.getState().address.street || '',
    city: useCheckoutStore.getState().address.city || '',
    province: useCheckoutStore.getState().address.province || '',
    postalCode: useCheckoutStore.getState().address.postalCode || '',
    shippingMethod: useCheckoutStore.getState().shippingMethod,
  }).current;

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const shippingMethod = watch('shippingMethod');
  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const email = watch('email');
  const phone = watch('phone');
  const street = watch('street');
  const city = watch('city');
  const province = watch('province');
  const postalCode = watch('postalCode');

  const completedSteps = useMemo(() => {
    const completed = new Set<number>();

    if (firstName && lastName && email && phone) {
      completed.add(1);
    }

    if (shippingMethod === 'pickup') {
      completed.add(2);
      completed.add(3);
    } else if (shippingMethod === 'home_delivery') {
      if (street && city && province && postalCode) {
        completed.add(2);
        completed.add(3);
      }
    }

    return completed;
  }, [firstName, lastName, email, phone, shippingMethod, street, city, province, postalCode]);

  const nextIncomplete = PROGRESS_STEPS.find((s) => !completedSteps.has(s.number));
  const currentStep = nextIncomplete?.number ?? PROGRESS_STEPS.length;

  async function onSubmit(data: FormData) {
    if (items.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const order = await api.post<{ id: string } & Order>('/orders', {
        guestEmail: data.email,
        guestFirstName: data.firstName,
        guestLastName: data.lastName,
        guestPhone: data.phone,
        guestAddress: data.shippingMethod === 'home_delivery' ? data.street : '',
        guestCity: data.shippingMethod === 'home_delivery' ? data.city : '',
        guestProvince: data.shippingMethod === 'home_delivery' ? data.province : '',
        guestPostalCode: data.shippingMethod === 'home_delivery' ? data.postalCode : '',
        shippingType: data.shippingMethod === 'pickup' ? 'PICKUP' : 'HOME_DELIVERY',
        items: items.map((item) => ({
          variantId: item.variant.id,
          quantity: item.quantity,
        })),
      });

      const preference = await api.post<{ preferenceId: string; initPoint: string }>(
        `/payments/${order.id}/preference`
      );

      clearCart();
      clearCheckout();

      setPreferenceId(preference.preferenceId);
      setInitPoint(preference.initPoint);
      setCurrentOrderId(order.id);
      setSubmitting(false);
      setPaymentStep(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Ocurrió un error. Intentalo de nuevo.');
      }
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-28 text-center">
        <ShoppingBag className="mb-6 h-12 w-12 text-ink-lighter" strokeWidth={1} />
        <h1 className="font-display text-4xl font-bold text-ink">
          No hay productos en tu carrito
        </h1>
        <p className="mt-3 text-ink-lighter">
          Agregá productos antes de iniciar el checkout.
        </p>
        <Link href="/products" className="mt-8">
          <Button variant="outline" size="lg">
            Ver Productos
          </Button>
        </Link>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100/50">
      <Container className="py-8 sm:py-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 lg:mb-12"
        >
          <Link
            href="/cart"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ink-lighter transition-colors hover:text-ink"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Volver al carrito
          </Link>

          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl lg:text-5xl">
            Checkout
          </h1>
          <p className="mt-2 text-sm text-ink-lighter">
            Completá tus datos para finalizar la compra
          </p>
        </motion.div>

        <ProgressBar
          steps={PROGRESS_STEPS}
          completedSteps={paymentStep ? new Set([1, 2, 3, 4]) : completedSteps}
        />

        {paymentStep ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 lg:mt-12"
          >
            <div className="lg:grid lg:grid-cols-5 lg:gap-10 xl:gap-14">
              <div className="space-y-6 lg:col-span-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentStep(false)}
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-ink-lighter transition-colors hover:text-ink"
                  >
                    <ChevronLeft size={14} strokeWidth={1.5} />
                    Volver
                  </button>
                </div>

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
                      <p className="mb-4 text-sm text-white/80">
                        Seleccioná tu método de pago
                      </p>
                    </div>

                    <div className="p-6 sm:p-8">
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3"
                        >
                          <div className="flex items-start gap-2">
                            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            <p className="text-xs text-red-600 whitespace-pre-line">{error}</p>
                          </div>
                        </motion.div>
                      )}

                      {preferenceId && (
                        <MpWalletBrick preferenceId={preferenceId} />
                      )}

                      {initPoint && (
                        <div className="mt-6 text-center">
                          <p className="mb-3 text-xs text-ink-lighter">
                            Si el botón de pago no aparece, hacé clic acá:
                          </p>
                          <Button
                            variant="primary"
                            size="lg"
                            className="w-full"
                            onClick={() => { window.location.href = initPoint; }}
                          >
                            Ir a pagar en Mercado Pago
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.section>
              </div>

              <div className="mt-8 lg:col-span-2 lg:mt-0">
                <OrderSummary
                  items={items}
                  subtotal={subtotal}
                  shippingMethod={shippingMethod}
                >
                  <div className="flex items-center justify-center gap-2 text-[11px] text-ink-lighter">
                    <ShieldCheck size={14} strokeWidth={1.5} />
                    <span>Pago 100% seguro vía Mercado Pago</span>
                  </div>
                </OrderSummary>
              </div>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-10 lg:mt-12">
            <div className="lg:grid lg:grid-cols-5 lg:gap-10 xl:gap-14">
              <div className="space-y-6 lg:col-span-3">
                <PersonalInfo
                  register={register}
                  errors={errors}
                  watch={watch}
                />

                <ShippingAddress
                  register={register}
                  errors={errors}
                  watch={watch}
                  visible={shippingMethod === 'home_delivery'}
                />

                <ShippingMethod
                  register={register}
                  errors={errors}
                  watch={watch}
                />

                <PaymentMethod />
              </div>

              <div className="mt-8 lg:col-span-2 lg:mt-0">
                <OrderSummary
                  items={items}
                  subtotal={subtotal}
                  shippingMethod={shippingMethod}
                >
                  <div className="space-y-4">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded border border-red-200 bg-red-50 px-4 py-3"
                      >
                        <div className="flex items-start gap-2">
                          <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                          <p className="text-xs text-red-600 whitespace-pre-line">{error}</p>
                        </div>
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      size="xl"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Procesando...
                        </span>
                      ) : (
                        'Continuar al pago'
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-[11px] text-ink-lighter">
                      <ShieldCheck size={14} strokeWidth={1.5} />
                      <span>Pago 100% seguro vía Mercado Pago</span>
                    </div>
                  </div>
                </OrderSummary>
              </div>
            </div>
          </form>
        )}
      </Container>
    </div>
  );
}
