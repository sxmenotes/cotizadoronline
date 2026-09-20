import React from 'react';
import * as TooltipPrimitives from '@radix-ui/react-tooltip';
import { cn } from '../lib/utils';

export const TooltipProvider = TooltipPrimitives.Provider;
export const Tooltip = TooltipPrimitives.Root;
export const TooltipTrigger = TooltipPrimitives.Trigger;

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitives.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitives.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-md border border-hairline bg-navy-900 px-3 py-1.5 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95',
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitives.Content.displayName;

export const SimpleTooltip: React.FC<{
  content: React.ReactNode;
  children: React.ReactNode;
}> = ({ content, children }) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
