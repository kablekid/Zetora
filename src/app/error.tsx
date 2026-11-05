'use client';
import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n/client';

export default function GlobalRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT('common');
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive-soft text-destructive">
        <AlertTriangle className="size-7" />
      </div>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">{t('pages.error.heading')}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{t('pages.error.body')}</p>
      {error.digest && <p className="mt-2 text-xs text-muted-foreground/70">{t('pages.error.reference', { digest: error.digest })}</p>}
      <Button className="mt-6" onClick={reset}>
        {t('actions.tryAgain')}
      </Button>
    </div>
  );
}
