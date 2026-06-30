export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'SHIPPED';

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded';

export type ShippingMethod = 'pickup' | 'home_delivery';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  price: number;
  images: Array<{ id: string; url: string; alt: string | null; order: number }>;
  categoryId?: string;
  category?: Category;
  variants: ProductVariant[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
  attributes: Record<string, string>;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  parent?: { id: string; name: string; slug: string } | null;
  children?: Category[];
}

export interface Order {
  id: string;
  guestEmail: string;
  guestFirstName: string;
  guestLastName: string;
  guestPhone: string;
  guestAddress: string;
  guestCity: string;
  guestProvince: string;
  guestPostalCode: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  subtotal: number;
  shippingCost: number;
  shippingType: 'PICKUP' | 'HOME_DELIVERY';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variant?: {
    id: string;
    sku: string;
    price: number;
    product: { id: string; name: string; slug: string };
  };
}

export interface Payment {
  id: string;
  orderId: string;
  mpPreferenceId?: string;
  mpPaymentId?: string;
  mpStatus?: string;
  mpStatusDetail?: string;
  amount: number;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  shippingMethod: ShippingMethod;
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  module: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
