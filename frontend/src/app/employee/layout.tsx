'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import EmployeeSidebar from '@/components/dashboard/EmployeeSidebar';
import Header from '@/components/dashboard/Header';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <div className="flex min-h-screen bg-cream-50 pt-20">
        <EmployeeSidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
