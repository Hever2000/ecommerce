'use client';

import { useAuth } from '@/context/AuthContext';
import { getRedirectPath } from '@/lib/auth';
import { redirect } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cream-200 border-t-ink" />
      </div>
    );
  }

  if (!isAuthenticated) {
    redirect('/login');
  }

  if (requiredRole && user?.role !== requiredRole) {
    redirect(getRedirectPath(user?.role || ''));
  }

  return <>{children}</>;
}
