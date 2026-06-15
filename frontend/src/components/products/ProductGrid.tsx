import type { ReactNode } from 'react';

interface ProductGridProps {
  children: ReactNode;
}

export default function ProductGrid({ children }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
      {children}
    </div>
  );
}
