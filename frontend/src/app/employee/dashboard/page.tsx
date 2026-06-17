'use client';

import { useAuth } from '@/context/AuthContext';
import { ShoppingCart, Package } from 'lucide-react';

const STATS = [
  { label: 'Active Orders', value: '—', icon: ShoppingCart },
  { label: 'Inventory Items', value: '—', icon: Package },
];

export default function EmployeeDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Employee Dashboard</h1>
        <p className="mt-1 text-sm text-ink-light">Welcome, {user?.firstName}!</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
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

      <div className="rounded-xl border border-cream-200 bg-white p-6 shadow-sm">
        <h3 className="font-display text-lg font-bold text-ink">Pending Tasks</h3>
        <p className="mt-2 text-sm text-ink-light">No pending tasks to display.</p>
      </div>
    </div>
  );
}
