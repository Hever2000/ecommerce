'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api, ApiError } from '@/lib/api';
import { Package, ShoppingCart, Users, DollarSign, ExternalLink } from 'lucide-react';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  revenue: number;
}

interface RecentOrder {
  id: string;
  guestEmail: string;
  guestFirstName: string;
  guestLastName: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, ordersRes, usersRes] = await Promise.all([
          api.get<{ data: unknown[]; meta: { total: number } }>('/products?limit=1'),
          api.get<{ data: RecentOrder[]; meta: { total: number } }>('/orders?limit=5'),
          api.get<{ data: unknown[]; meta: { total: number } }>('/users?limit=1'),
        ]);

        const revenue = ordersRes.data.reduce((sum, o) => sum + Number(o.total), 0);

        setStats({
          totalProducts: productsRes.meta.total,
          totalOrders: ordersRes.meta.total,
          totalUsers: usersRes.meta.total,
          revenue,
        });
        setRecentOrders(ordersRes.data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Error loading dashboard');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const STATS_CARDS = [
    {
      label: 'Total Products',
      value: stats?.totalProducts ?? '—',
      icon: Package,
      href: '/admin/products',
    },
    {
      label: 'Total Orders',
      value: stats?.totalOrders ?? '—',
      icon: ShoppingCart,
      href: '/admin/orders',
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? '—',
      icon: Users,
      href: '/admin/users',
    },
    {
      label: 'Revenue',
      value: stats ? `$${stats.revenue.toFixed(2)}` : '—',
      icon: DollarSign,
    },
  ];

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
        <h1 className="font-display text-3xl font-bold text-ink">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-ink-light">Welcome, {user?.firstName}!</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STATS_CARDS.map((stat) => {
          const Icon = stat.icon;
          const content = (
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink-light">{stat.label}</p>
              <Icon size={20} className="text-accent" />
            </div>
          );
          const value = (
            <p className="mt-2 font-display text-3xl font-bold text-ink">
              {isLoading ? (
                <span className="inline-block h-8 w-16 animate-pulse rounded bg-cream-200" />
              ) : (
                stat.value
              )}
            </p>
          );

          if (stat.href) {
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="rounded-xl border border-cream-200 bg-white p-6 shadow-sm transition-colors hover:border-accent/30"
              >
                {content}
                {value}
              </Link>
            );
          }

          return (
            <div
              key={stat.label}
              className="rounded-xl border border-cream-200 bg-white p-6 shadow-sm"
            >
              {content}
              {value}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-cream-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-ink">Recent Orders</h3>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-dark"
            >
              View all <ExternalLink size={12} />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-cream-200" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-ink-light">No recent orders to display.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-cream-200 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
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
          <h3 className="font-display text-lg font-bold text-ink">Quick Actions</h3>
          <div className="mt-4 space-y-3">
            <Link
              href="/admin/products"
              className="flex items-center gap-3 rounded-lg border border-cream-200 px-4 py-3 text-sm text-ink-light transition-colors hover:border-accent/30 hover:text-ink"
            >
              <Package size={16} className="text-accent" />
              Manage Products
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center gap-3 rounded-lg border border-cream-200 px-4 py-3 text-sm text-ink-light transition-colors hover:border-accent/30 hover:text-ink"
            >
              <ShoppingCart size={16} className="text-accent" />
              View Orders
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 rounded-lg border border-cream-200 px-4 py-3 text-sm text-ink-light transition-colors hover:border-accent/30 hover:text-ink"
            >
              <Users size={16} className="text-accent" />
              Manage Users
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
