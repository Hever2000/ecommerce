'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package } from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
  { label: 'Orders', href: '/employee/orders', icon: ShoppingCart },
  { label: 'Inventory', href: '/employee/inventory', icon: Package },
];

export default function EmployeeSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-cream-200 bg-white">
      <div className="flex h-16 items-center border-b border-cream-200 px-6">
        <Link href="/" className="font-display text-xl font-bold text-ink">
          STORE
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand text-cream-50'
                  : 'text-ink-light hover:bg-cream-100 hover:text-ink'
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
