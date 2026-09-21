import React from 'react';
import { cn } from '../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'navy' | 'brass' | 'success' | 'warning' | 'danger' | undefined;
  size?: 'sm' | 'md' | undefined;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-paper-2 text-ink border-hairline',
    navy: 'bg-navy-50 text-navy-700 border-navy-100',
    brass: 'bg-brass-100 text-brass border-amber-200/50',
    success: 'bg-emerald-50 text-success border-emerald-200',
    warning: 'bg-amber-50 text-warning border-amber-200',
    danger: 'bg-red-50 text-danger border-red-200',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium tracking-wide uppercase select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
