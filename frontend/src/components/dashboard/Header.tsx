'use client';

import { useAuth } from '@/context/AuthContext';
import { LogOut, User } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-cream-200 bg-white px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-cream-50">
          <User size={16} />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">
            {user?.firstName} {user?.lastName}
          </p>
          <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-dark">
            {user?.role}
          </span>
        </div>
      </div>
      <button
        onClick={logout}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-light transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>
    </header>
  );
}
