'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api, ApiError } from '@/lib/api';
import { ShoppingCart, Package, AlertTriangle, ExternalLink } from 'lucide-react';

interface LowStockItem {
  id: string;
  sku: string;
  stock: number;
  product: { id: string; name: string; slug: string };
}

interface RecentOrder {
  id: string;
  guestFirstName: string;
  guestLastName: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const [activeOrders, setActiveOrders] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersRes, productsRes, lowStockRes] = await Promise.all([
          api.get<{ data: RecentOrder[]; meta: { total: number } }>('/orders?status=PENDING&limit=3'),
          api.get<{ data: unknown[]; meta: { total: number } }>('/products?limit=1'),
          api.get<LowStockItem[]>('/inventory/low-stock'),
        ]);

        setActiveOrders(ordersRes.meta.total);
        setRecentOrders(ordersRes.data);
        setTotalProducts(productsRes.meta.total);
        setLowStockItems(lowStockRes);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Error loading dashboard');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    SHIPPED: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Employee Dashboard</h1>
        <p className="mt-1 text-sm text-ink-light">Welcome, {user?.firstName}!</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/employee/orders"
          className="rounded-xl border border-cream-200 bg-white p-6 shadow-sm transition-colors hover:border-accent/30"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink-light">Active Orders</p>
            <ShoppingCart size={20} className="text-accent" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-ink">
            {isLoading ? (
              <span className="inline-block h-8 w-12 animate-pulse rounded bg-cream-200" />
            ) : (
              activeOrders
            )}
          </p>
        </Link>

        <Link
          href="/employee/inventory"
          className="rounded-xl border border-cream-200 bg-white p-6 shadow-sm transition-colors hover:border-accent/30"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink-light">Inventory Items</p>
            <Package size={20} className="text-accent" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-ink">
            {isLoading ? (
              <span className="inline-block h-8 w-12 animate-pulse rounded bg-cream-200" />
            ) : (
              totalProducts
            )}
          </p>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-cream-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-ink">Pending Orders</h3>
            <Link
              href="/employee/orders"
              className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-dark"
            >
              View all <ExternalLink size={12} />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-cream-200" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-ink-light">No pending orders.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-cream-200 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {order.guestFirstName} {order.guestLastName}
                    </p>
                    <p className="text-xs text-ink-light">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="text-sm font-semibold text-ink">
                      ${Number(order.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-cream-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-ink">Low Stock Alerts</h3>
            <Link
              href="/employee/inventory"
              className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-dark"
            >
              View all <ExternalLink size={12} />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-cream-200" />
              ))}
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <Package size={24} className="text-green-500" />
              <p className="mt-2 text-sm text-ink-light">All items well stocked!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-cream-200 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-ink-light">SKU: {item.sku}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-500" />
                    <span className="text-sm font-semibold text-red-600">{item.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
