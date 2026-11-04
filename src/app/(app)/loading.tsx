import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <Skeleton className="h-44 lg:col-span-2" />
        <Skeleton className="h-44" />
      </div>
      <Skeleton className="h-36 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
