'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ShippingMethod } from '@/types';

export interface PersonalInfoData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface AddressData {
  street: string;
  city: string;
  province: string;
  postalCode: string;
}

interface CheckoutState {
  personalInfo: PersonalInfoData;
  address: AddressData;
  shippingMethod: ShippingMethod;
  setPersonalInfo: (data: Partial<PersonalInfoData>) => void;
  setAddress: (data: Partial<AddressData>) => void;
  setShippingMethod: (method: ShippingMethod) => void;
  clearCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      personalInfo: { firstName: '', lastName: '', email: '', phone: '' },
      address: { street: '', city: '', province: '', postalCode: '' },
      shippingMethod: 'home_delivery',

      setPersonalInfo: (data) =>
        set((s) => ({ personalInfo: { ...s.personalInfo, ...data } })),

      setAddress: (data) =>
        set((s) => ({ address: { ...s.address, ...data } })),

      setShippingMethod: (method) => set({ shippingMethod: method }),

      clearCheckout: () =>
        set({
          personalInfo: { firstName: '', lastName: '', email: '', phone: '' },
          address: { street: '', city: '', province: '', postalCode: '' },
          shippingMethod: 'home_delivery',
        }),
    }),
    { name: 'checkout-storage' }
  )
);
