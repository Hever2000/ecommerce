import type { ReactNode } from 'react';
import clsx from 'clsx';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
}

export default function Container({ children, className, as: Tag = 'div' }: ContainerProps) {
  return (
    <Tag className={clsx('mx-auto max-w-7xl px-6 lg:px-8', className)}>
      {children}
    </Tag>
  );
}
