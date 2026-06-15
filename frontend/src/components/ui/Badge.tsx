import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'outline';
  className?: string;
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-block px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]',
        variant === 'default' && 'bg-cream-200 text-ink',
        variant === 'accent' && 'bg-accent text-cream-50',
        variant === 'outline' && 'border border-ink text-ink',
        className
      )}
    >
      {children}
    </span>
  );
}
