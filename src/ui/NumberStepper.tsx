import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

export interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const NumberStepper: React.FC<NumberStepperProps> = ({
  value,
  onChange,
  min = 0,
  max = 50,
  step = 1,
  label,
  className,
  disabled = false,
}) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(Math.max(min, value - step));
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(Math.min(max, value + step));
    }
  };

  return (
    <div className={cn('flex flex-col gap-1.5 text-left', className)}>
      {label && (
        <span className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
          {label}
        </span>
      )}
      <div className="flex items-center rounded-md border border-hairline bg-white shadow-xs">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          aria-label="Disminuir"
          className="flex h-11 w-11 items-center justify-center text-ink transition-colors hover:bg-paper-2 active:bg-paper disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span
          className="min-w-[48px] flex-1 text-center font-mono text-base font-semibold text-ink"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          aria-label="Aumentar"
          className="flex h-11 w-11 items-center justify-center text-ink transition-colors hover:bg-paper-2 active:bg-paper disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
