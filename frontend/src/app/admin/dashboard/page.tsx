'use client';

import { useAuth } from '@/context/AuthContext';
import { Package, ShoppingCart, Users, DollarSign } from 'lucide-react';

const STATS = [
  { label: 'Total Products', value: '—', icon: Package },
  { label: 'Total Orders', value: '—', icon: ShoppingCart },
  { label: 'Total Users', value: '—', icon: Users },
  { label: 'Revenue', value: '—', icon: DollarSign },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-ink-light">Welcome, {user?.firstName}!</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-cream-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink-light">{stat.label}</p>
              <stat.icon size={20} className="text-accent" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-cream-200 bg-white p-6 shadow-sm">
          <h3 className="font-display text-lg font-bold text-ink">Recent Orders</h3>
          <p className="mt-2 text-sm text-ink-light">No recent orders to display.</p>
        </div>
        <div className="rounded-xl border border-cream-200 bg-white p-6 shadow-sm">
          <h3 className="font-display text-lg font-bold text-ink">Popular Products</h3>
          <p className="mt-2 text-sm text-ink-light">No data available yet.</p>
        </div>
      </div>
    </div>
  );
}
