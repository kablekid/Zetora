import Link from 'next/link';
import { CheckCircle2, ChevronRight, Clock, FileText, FolderOpen, ListChecks } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { subjectTone } from '@/lib/registry';
import type { UnitRow } from '@/lib/types';

function Avail({ on, icon: Icon, label }: { on: boolean; icon: typeof FileText; label: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-xs', on ? 'text-foreground/80' : 'text-muted-foreground/50 line-through decoration-muted-foreground/30')}
      title={on ? `${label} available` : `${label} not available yet`}
    >
      <Icon className="size-3.5" />
      {label}
      <span className="sr-only">{on ? 'available' : 'not available yet'}</span>
    </span>
  );
}

export function UnitListItem({ unit, slug, color, highlight }: { unit: UnitRow; slug: string; color: string; highlight?: boolean }) {
  const tone = subjectTone(color);
  const done = unit.status === 'completed';
  const progress = done ? 100 : unit.reading_progress;
  return (
    <li>
      <Link
        href={`/subjects/${slug}/units/${unit.id}`}
        className={cn(
          'group flex gap-4 rounded-xl border bg-card p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:border-input hover:shadow-[var(--shadow-pop)] sm:p-5',
          highlight && 'ring-2 ring-primary/30',
        )}
      >
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl text-base font-bold',
            done ? 'bg-success-soft text-success' : cn(tone.tile, tone.text),
          )}
          aria-hidden
        >
          {done ? <CheckCircle2 className="size-5" /> : unit.number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h3 className="text-[15px] font-semibold leading-snug tracking-tight">
              <span className="text-muted-foreground">Unit {unit.number} · </span>{unit.title}
            </h3>
            {done ? <Badge variant="success">Completed</Badge> : unit.status === 'in_progress' ? <Badge variant="accent">In progress</Badge> : highlight ? <Badge>Start here</Badge> : null}
          </div>
          {unit.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{unit.description}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <Avail on={unit.has_summary} icon={FileText} label="Summary" />
            <Avail on={unit.resource_count > 0} icon={FolderOpen} label={unit.resource_count > 1 ? `${unit.resource_count} files` : 'PDF'} />
            <Avail on={unit.quiz_count > 0} icon={ListChecks} label="Quiz" />
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="size-3.5" />{unit.estimated_minutes} min</span>
          </div>
          {(progress > 0 || unit.best_percentage != null) && (
            <div className="mt-3 flex items-center gap-3">
              <Progress value={progress} className="h-1.5 flex-1" barClassName={done ? 'bg-success' : tone.solid} aria-label={`Unit ${unit.number} progress`} />
              <span className="w-9 text-right text-xs font-semibold tabular-nums">{progress}%</span>
              {unit.best_percentage != null && <span className="hidden text-xs text-muted-foreground sm:inline">Best quiz {Math.round(Number(unit.best_percentage))}%</span>}
            </div>
          )}
        </div>
        <ChevronRight className="my-auto size-5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}
