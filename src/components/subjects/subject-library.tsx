'use client';
import { useMemo, useState } from 'react';
import { Library, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { SubjectCard } from './subject-card';
import { cn } from '@/lib/utils';
import type { SubjectCard as SubjectCardData } from '@/lib/types';

type Filter = 'all' | 'in_progress' | 'not_started' | 'completed';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'not_started', label: 'Not started' },
  { id: 'completed', label: 'Completed' },
];

function statusOf(s: SubjectCardData): Filter {
  if (s.unit_count > 0 && s.completed_units >= s.unit_count) return 'completed';
  if (s.completed_units > 0) return 'in_progress';
  return 'not_started';
}

export function SubjectLibrary({ subjects }: { subjects: SubjectCardData[] }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: subjects.length, in_progress: 0, not_started: 0, completed: 0 };
    subjects.forEach((s) => { c[statusOf(s)]++; });
    return c;
  }, [subjects]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return subjects.filter((s) => {
      if (filter !== 'all' && statusOf(s) !== filter) return false;
      if (!term) return true;
      return s.title.toLowerCase().includes(term) || s.description.toLowerCase().includes(term);
    });
  }, [subjects, q, filter]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search subjects…" aria-label="Search subjects" className="pl-9 pr-9" />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label="Clear search" className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          )}
        </div>
        <div role="group" aria-label="Filter by status" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={cn(
                'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors sm:h-9',
                filter === f.id ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
              <span className={cn('text-xs tabular-nums', filter === f.id ? 'text-primary-foreground/80' : 'text-muted-foreground/70')}>{counts[f.id]}</span>
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Library />}
          title={subjects.length === 0 ? 'No subjects published yet' : 'No subjects match'}
          description={subjects.length === 0 ? 'Check back soon — new subjects are added regularly.' : 'Try a different search or filter.'}
          action={subjects.length > 0 ? <Button variant="outline" onClick={() => { setQ(''); setFilter('all'); }}>Clear filters</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((s) => <SubjectCard key={s.id} subject={s} href={`/subjects/${s.slug}`} />)}
        </div>
      )}
    </div>
  );
}
