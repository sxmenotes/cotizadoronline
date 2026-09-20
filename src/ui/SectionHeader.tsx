import React from 'react';
import { cn } from '../lib/utils';

export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  hasHairline?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  action,
  className,
  hasHairline = true,
}) => {
  return (
    <div className={cn('flex flex-col gap-1 text-left', className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <span className="text-[11px] font-semibold tracking-widest text-ink-muted uppercase">
              {eyebrow}
            </span>
          )}
          <h2 className="font-serif text-xl font-semibold text-navy-900 sm:text-2xl">
            {title}
          </h2>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {description && (
        <p className="mt-1 text-sm text-ink-muted leading-relaxed">
          {description}
        </p>
      )}
      {hasHairline && <div className="mt-3 h-[1px] w-full bg-hairline" />}
    </div>
  );
};
