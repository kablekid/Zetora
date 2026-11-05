import { Skeleton } from '@/components/ui/skeleton';
import { getT } from '@/i18n/server';

export default async function Loading() {
  const t = await getT('common');
  return (
    <div className="space-y-6" aria-busy="true" aria-label={t('a11y.loading')}>
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      <Skeleton className="h-72" />
    </div>
  );
}
