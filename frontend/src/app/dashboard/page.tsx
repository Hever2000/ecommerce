'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (user?.role === 'EMPLOYEE') {
      router.push('/employee/dashboard');
    } else {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 pt-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-cream-200 border-t-ink" />
    </div>
  );
}
