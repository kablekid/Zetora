'use client';
import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

export function Progress({
  className,
  value = 0,
  barClassName,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { barClassName?: string }) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <ProgressPrimitive.Root
      value={v}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn('h-full rounded-full bg-primary transition-[width] duration-700 ease-out', barClassName)}
        style={{ width: `${v}%` }}
      />
    </ProgressPrimitive.Root>
  );
}
