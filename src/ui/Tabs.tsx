import React from 'react';
import * as TabsPrimitives from '@radix-ui/react-tabs';
import { cn } from '../lib/utils';

export const Tabs = TabsPrimitives.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitives.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitives.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitives.List
    ref={ref}
    className={cn(
      'inline-flex h-11 items-center justify-center rounded-lg border border-hairline bg-paper-2 p-1 text-ink-muted',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitives.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitives.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitives.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitives.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-sm font-medium transition-all select-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500',
      'disabled:pointer-events-none disabled:opacity-40',
      'data-[state=active]:bg-white data-[state=active]:text-navy-900 data-[state=active]:font-semibold data-[state=active]:shadow-xs',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitives.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitives.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitives.Content
    ref={ref}
    className={cn(
      'mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitives.Content.displayName;
