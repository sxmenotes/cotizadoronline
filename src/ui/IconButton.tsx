import React from 'react';
import { cn } from '../lib/utils';
import { Button, type ButtonProps } from './Button';

export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon, size = 'md', ...props }, ref) => {
    const iconSizes = {
      sm: 'p-1.5 h-8 w-8 min-h-[36px] min-w-[36px]',
      md: 'p-2 h-10 w-10 min-h-[44px] min-w-[44px]',
      lg: 'p-2.5 h-12 w-12 min-h-[48px] min-w-[48px]',
    };

    return (
      <Button
        ref={ref}
        size={size}
        className={cn('rounded-full', iconSizes[size], className)}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';
