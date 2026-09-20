import React from 'react';
import { cn } from '../lib/utils';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string = string>({
  value,
  onChange,
  options,
  label,
  className,
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    <div className={cn('flex flex-col gap-1.5 text-left', className)}>
      {label && (
        <span className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
          {label}
        </span>
      )}
      <div
        role="radiogroup"
        className={cn(
          'inline-flex rounded-lg border border-hairline bg-paper-2 p-1 text-ink shadow-xs',
          size === 'sm' ? 'min-h-[36px]' : 'min-h-[44px]'
        )}
      >
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={opt.disabled}
              onClick={() => onChange(opt.value)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-md px-3 font-medium transition-all duration-150 select-none',
                size === 'sm' ? 'py-1 text-xs' : 'py-2 text-sm',
                isSelected
                  ? 'bg-white text-navy-900 font-semibold shadow-xs'
                  : 'text-ink-muted hover:text-ink hover:bg-white/50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500',
                'disabled:pointer-events-none disabled:opacity-40'
              )}
            >
              {opt.icon && <span className="h-4 w-4 shrink-0">{opt.icon}</span>}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
