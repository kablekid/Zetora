'use client';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/client';

export function Spinner({ className, label }: { className?: string; label?: string }) {
  const t = useT('common');
  return (
    <span role="status" aria-label={label ?? t('a11y.loading')} className="inline-flex">
      <Loader2 className={cn('size-5 animate-spin text-muted-foreground', className)} />
    </span>
  );
}
