import React from 'react';
import { cn } from '../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 3, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    return (
      <div className="flex w-full flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-semibold tracking-wider text-ink-muted uppercase"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={cn(
            'w-full rounded-md border border-hairline bg-white px-3.5 py-2 text-base text-ink placeholder:text-ink-subtle',
            'transition-colors duration-150',
            'focus-visible:border-navy-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/20 focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:bg-paper-2 disabled:opacity-60',
            error && 'border-danger focus-visible:border-danger focus-visible:ring-danger/20',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-danger">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-ink-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
