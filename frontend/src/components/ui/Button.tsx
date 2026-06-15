'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-cream-50 hover:bg-brand-light active:bg-brand',
  secondary: 'bg-cream-200 text-ink hover:bg-cream-300',
  outline: 'border-2 border-ink text-ink hover:bg-ink hover:text-cream-50',
  ghost: 'text-ink hover:bg-cream-200',
};

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-xs tracking-widest uppercase',
  md: 'px-6 py-3 text-sm tracking-wider uppercase',
  lg: 'px-8 py-4 text-sm tracking-wider uppercase',
  xl: 'px-10 py-5 text-sm tracking-wider uppercase',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center font-semibold transition-all duration-300',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100',
        !disabled && 'hover:scale-[1.02] active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);

Button.displayName = 'Button';
export default Button;
