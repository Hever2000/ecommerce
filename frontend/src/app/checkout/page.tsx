'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api, ApiError } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import type { Order } from '@/types';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(6, 'Invalid phone'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  province: z.string().min(1, 'Province is required'),
  postalCode: z.string().min(3, 'Invalid postal code'),
  shippingMethod: z.enum(['pickup', 'home_delivery']),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { shippingMethod: 'home_delivery' },
  });

  const shippingMethod = watch('shippingMethod');

  async function onSubmit(data: FormData) {
    if (items.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const order = await api.post<Order>('/orders', {
        items: items.map((item) => ({
          productId: item.product.id,
          variantId: item.variant.id,
          quantity: item.quantity,
          unitPrice: item.variant.price,
        })),
        customerInfo: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
        },
        shippingAddress: {
          street: data.address,
          city: data.city,
          province: data.province,
          postalCode: data.postalCode,
        },
        shippingMethod: data.shippingMethod,
        notes: data.notes || undefined,
      });

      clearCart();
      router.push(`/confirmation?id=${order.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-28 text-center">
        <h1 className="font-display text-4xl font-bold text-ink">Nothing to checkout</h1>
        <p className="mt-3 text-ink-lighter">Add some items to your cart first.</p>
        <Link href="/products" className="mt-8">
          <Button variant="outline" size="lg">Shop Now</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="font-display text-4xl font-bold text-ink lg:text-5xl">Checkout</h1>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="lg:grid lg:grid-cols-3 lg:gap-12">
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="border border-cream-200 p-8"
            >
              <h2 className="mb-6 font-display text-xl font-bold text-ink">Personal Information</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-lighter">First Name</label>
                  <input {...register('firstName')} className="w-full border border-cream-200 bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink-lighter focus:border-ink focus:outline-none" />
                  {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-lighter">Last Name</label>
                  <input {...register('lastName')} className="w-full border border-cream-200 bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink-lighter focus:border-ink focus:outline-none" />
                  {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-lighter">Email</label>
                  <input type="email" {...register('email')} className="w-full border border-cream-200 bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink-lighter focus:border-ink focus:outline-none" />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-lighter">Phone</label>
                  <input type="tel" {...register('phone')} className="w-full border border-cream-200 bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink-lighter focus:border-ink focus:outline-none" />
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="border border-cream-200 p-8"
            >
              <h2 className="mb-6 font-display text-xl font-bold text-ink">Shipping Address</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-lighter">Address</label>
                  <input {...register('address')} className="w-full border border-cream-200 bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink-lighter focus:border-ink focus:outline-none" />
                  {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-lighter">City</label>
                    <input {...register('city')} className="w-full border border-cream-200 bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink-lighter focus:border-ink focus:outline-none" />
                    {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-lighter">Province</label>
                    <input {...register('province')} className="w-full border border-cream-200 bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink-lighter focus:border-ink focus:outline-none" />
                    {errors.province && <p className="mt-1 text-xs text-red-500">{errors.province.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-lighter">Postal Code</label>
                    <input {...register('postalCode')} className="w-full border border-cream-200 bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink-lighter focus:border-ink focus:outline-none" />
                    {errors.postalCode && <p className="mt-1 text-xs text-red-500">{errors.postalCode.message}</p>}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="border border-cream-200 p-8"
            >
              <h2 className="mb-6 font-display text-xl font-bold text-ink">Shipping Method</h2>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-4 border border-cream-200 p-4 transition-colors has-[:checked]:border-ink">
                  <input type="radio" value="home_delivery" {...register('shippingMethod')} className="accent-ink" />
                  <div>
                    <span className="text-sm font-medium text-ink">Home Delivery</span>
                    <p className="text-xs text-ink-lighter">Delivered to your door</p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-center gap-4 border border-cream-200 p-4 transition-colors has-[:checked]:border-ink">
                  <input type="radio" value="pickup" {...register('shippingMethod')} className="accent-ink" />
                  <div>
                    <span className="text-sm font-medium text-ink">Store Pickup</span>
                    <p className="text-xs text-ink-lighter">Pick up from our location</p>
                  </div>
                </label>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="border border-cream-200 p-8"
            >
              <h2 className="mb-6 font-display text-xl font-bold text-ink">Notes (Optional)</h2>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full border border-cream-200 bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink-lighter focus:border-ink focus:outline-none resize-none"
                placeholder="Special instructions..."
              />
            </motion.div>
          </div>

          <div className="mt-10 lg:mt-0">
            <div className="border border-cream-200 p-8 lg:sticky lg:top-32">
              <h2 className="mb-6 font-display text-xl font-bold text-ink">Order Summary</h2>
              <div className="space-y-3 text-sm">
                {items.map((item) => (
                  <div key={item.variant.id} className="flex justify-between">
                    <span className="truncate max-w-[200px] text-ink-lighter">
                      {item.product.name} x{item.quantity}
                    </span>
                    <span className="font-medium text-ink">
                      ${(item.variant.price * item.quantity).toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
                <div className="border-t border-cream-200 pt-3" />
                <div className="flex justify-between">
                  <span className="text-ink-lighter">Subtotal</span>
                  <span className="font-medium text-ink">${total.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-lighter">Shipping</span>
                  <span className="font-medium text-ink-lighter">
                    {shippingMethod === 'pickup' ? 'Free' : 'Calculated at checkout'}
                  </span>
                </div>
                <div className="border-t border-cream-200 pt-3">
                  <div className="flex justify-between text-base">
                    <span className="font-semibold text-ink">Total</span>
                    <span className="font-bold text-ink">${total.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-500">{error}</p>
              )}

              <Button type="submit" className="mt-6 w-full" size="xl" disabled={submitting}>
                {submitting ? 'Processing...' : 'Place Order'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Container>
  );
}
