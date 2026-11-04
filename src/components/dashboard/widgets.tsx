import Link from 'next/link';
import {
  ArrowRight, BookMarked, BookOpen, CheckCircle2, Circle, ClipboardCheck, FileText, FolderOpen, Flame, Library,
  ListChecks, PlayCircle, Sparkles, Target, TrendingUp, Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeading } from '@/components/page-header';
import { SubjectTile } from '@/components/subjects/subject-card';
import { cn, formatLongDate, greeting, pct, plural, timeAgo } from '@/lib/utils';
import { subjectTone } from '@/lib/registry';
import type { ActivityItem, ContinueItem } from '@/lib/queries/student';
import type { Recommendation, StudentStats, SubjectCard } from '@/lib/types';

export function WelcomeCard({ name, stats }: { name: string; stats: StudentStats }) {
  const first = name.trim().split(/\s+/)[0] || 'there';
  const isNew = stats.completed_units === 0 && stats.quizzes_completed === 0 && stats.in_progress_units === 0;
  return (
    <Card className="relative overflow-hidden">
      <div aria-hidden className="absolute -right-10 -top-10 size-44 rounded-full bg-secondary/10 blur-2xl" />
      <CardContent className="relative flex h-full flex-col justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{formatLongDate()}</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting()}, {first}.
          </h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            {isNew ? 'Welcome to Zetora — pick a subject and open your first unit.' : 'Ready to learn something new?'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {stats.study_streak > 0 ? (
            <Badge variant="warning" className="px-3 py-1 text-[13px]">
              <Flame /> {plural(stats.study_streak, 'day')} streak
            </Badge>
          ) : (
            <Badge variant="muted" className="px-3 py-1 text-[13px]">
              <Flame /> Start a streak today
            </Badge>
          )}
          {stats.in_progress_units > 0 && (
            <Badge variant="default" className="px-3 py-1 text-[13px]">
              <BookOpen /> {plural(stats.in_progress_units, 'unit')} in progress
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function OverallProgress({ stats }: { stats: StudentStats }) {
  const overall = pct(stats.completed_units, stats.total_units);
  const items = [
    { label: 'Units completed', value: `${stats.completed_units}/${stats.total_units}`, icon: CheckCircle2 },
    { label: 'Quizzes completed', value: String(stats.quizzes_completed), icon: ListChecks },
    { label: 'Average quiz score', value: stats.avg_quiz_score != null ? `${Math.round(Number(stats.avg_quiz_score))}%` : '—', icon: Target },
  ];
  return (
    <Card>
      <CardContent className="space-y-5">
        <SectionHeading title="Overall progress" className="mb-0" />
        <div className="flex items-center gap-5">
          <ProgressRing value={overall} label="Overall learning completion" />
          <dl className="min-w-0 flex-1 space-y-3">
            {items.map((it) => (
              <div key={it.label} className="flex items-center gap-2.5">
                <it.icon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <dt className="truncate text-xs text-muted-foreground">{it.label}</dt>
                  <dd className="text-base font-semibold leading-tight tabular-nums">{it.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}

export function ContinueLearning({ item, fallback }: { item: ContinueItem | null; fallback: Recommendation | null }) {
  if (item && item.status === 'in_progress') {
    const href = `/subjects/${item.subject.slug}/units/${item.unit.id}?tab=summary`;
    return (
      <ContinueShell
        eyebrow="Continue learning"
        subject={item.subject.title}
        title={`Unit ${item.unit.number}: ${item.unit.title}`}
        progress={item.reading_progress}
        cta="Continue"
        href={href}
        meta={`${item.unit.estimated_minutes} min · last opened ${timeAgo(item.last_accessed_at)}`}
      />
    );
  }
  if (fallback) {
    return (
      <ContinueShell
        eyebrow={item ? 'Up next' : 'Start your first unit'}
        subject={fallback.subject_title}
        title={`Unit ${fallback.unit_number}: ${fallback.unit_title}`}
        progress={null}
        cta="Start unit"
        href={`/subjects/${fallback.subject_slug}/units/${fallback.unit_id}`}
        meta={`${fallback.estimated_minutes} min`}
      />
    );
  }
  return (
    <ContinueShell eyebrow="Get started" subject="" title="Choose a subject to begin" progress={null} cta="Browse subjects" href="/subjects" meta="Your last unit will appear here" />
  );
}

function ContinueShell({ eyebrow, subject, title, progress, cta, href, meta }: {
  eyebrow: string; subject: string; title: string; progress: number | null; cta: string; href: string; meta: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-midnight p-5 text-white shadow-[var(--shadow-card)] sm:p-7">
      <div aria-hidden className="absolute -right-16 -top-20 size-72 rounded-full bg-secondary/30 blur-3xl" />
      <div aria-hidden className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60">
            <PlayCircle className="size-4" /> {eyebrow}
          </p>
          {subject && <p className="mt-3 text-sm font-medium text-white/70">{subject}</p>}
          <h2 className="mt-0.5 text-xl font-bold leading-snug tracking-tight sm:text-2xl">{title}</h2>
          {progress !== null && (
            <div className="mt-4 flex max-w-sm items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Unit progress">
                <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs font-semibold tabular-nums">{progress}%</span>
            </div>
          )}
          <p className="mt-3 text-xs text-white/55">{meta}</p>
        </div>
        <Button asChild size="lg" className="w-full bg-white text-midnight hover:bg-white/90 sm:w-auto">
          <Link href={href}>{cta} <ArrowRight /></Link>
        </Button>
      </div>
    </div>
  );
}

export function MySubjects({ subjects }: { subjects: SubjectCard[] }) {
  return (
    <Card>
      <CardContent>
        <SectionHeading title="My subjects" action={<Link href="/subjects" className="text-sm font-medium text-primary hover:underline">View all</Link>} />
        {subjects.length === 0 ? (
          <EmptyState icon={<Library />} title="No subjects yet" description="Subjects will appear here as soon as they are published." className="border-0 bg-transparent py-8" />
        ) : (
          <ul className="divide-y">
            {subjects.map((s) => {
              const progress = pct(s.completed_units, s.unit_count);
              const tone = subjectTone(s.color);
              return (
                <li key={s.id}>
                  <Link href={`/subjects/${s.slug}`} className="group -mx-2 flex items-center gap-3.5 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60">
                    <SubjectTile icon={s.icon} color={s.color} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{s.title}</p>
                        <span className="shrink-0 text-xs font-semibold tabular-nums">{progress}%</span>
                      </div>
                      <Progress value={progress} className="mt-1.5 h-1.5" barClassName={tone.solid} aria-label={`${s.title} completion`} />
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {plural(s.unit_count, 'unit')} · {s.completed_units} completed
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function TodayActivity({ stats }: { stats: StudentStats }) {
  const t = stats.today ?? {};
  const goals = [
    { label: 'Open a unit', done: (t.unit_opened ?? 0) > 0, href: '/subjects', icon: BookOpen },
    { label: 'Read a summary', done: (t.summary_read ?? 0) > 0, href: '/subjects', icon: FileText },
    { label: 'Complete a quiz', done: (t.quiz_completed ?? 0) + (t.exam_completed ?? 0) > 0, href: '/subjects', icon: ListChecks },
  ];
  const done = goals.filter((g) => g.done).length;
  return (
    <Card>
      <CardContent>
        <SectionHeading title="Today’s study activity" action={<span className="text-xs font-semibold text-muted-foreground tabular-nums">{done}/{goals.length} done</span>} />
        <Progress value={(done / goals.length) * 100} className="mb-4 h-1.5" barClassName="bg-success" aria-label="Today's goals completed" />
        <ul className="space-y-1">
          {goals.map((g) => (
            <li key={g.label}>
              <Link href={g.href} className="flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60">
                {g.done ? <CheckCircle2 className="size-5 text-success" /> : <Circle className="size-5 text-muted-foreground/50" />}
                <span className={cn('flex-1 text-sm', g.done ? 'text-muted-foreground line-through decoration-muted-foreground/40' : 'font-medium')}>{g.label}</span>
                {!g.done && <g.icon className="size-4 text-muted-foreground/60" />}
              </Link>
            </li>
          ))}
        </ul>
        {done === goals.length && (
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm font-medium text-success">
            <Trophy className="size-4" /> All done for today — great work!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

const REASON: Record<Recommendation['reason'], { label: string; variant: 'default' | 'accent' | 'warning' }> = {
  resume: { label: 'Pick up where you left off', variant: 'accent' },
  next: { label: 'Start next', variant: 'default' },
  review: { label: 'Needs review', variant: 'warning' },
};

export function RecommendedSteps({ recs }: { recs: Recommendation[] }) {
  return (
    <Card>
      <CardContent>
        <SectionHeading title="Recommended next steps" />
        {recs.length === 0 ? (
          <EmptyState icon={<Sparkles />} title="You’re all caught up" description="New recommendations appear as you study and take quizzes." className="border-0 bg-transparent py-8" />
        ) : (
          <ul className="space-y-1">
            {recs.map((r) => (
              <li key={r.unit_id}>
                <Link href={`/subjects/${r.subject_slug}/units/${r.unit_id}`} className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60">
                  <SubjectTile icon={r.subject_icon} color={r.subject_color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">Unit {r.unit_number}: {r.unit_title}</p>
                    <p className="mt-0.5 flex items-center gap-2 truncate text-xs text-muted-foreground">
                      {r.subject_title}
                      <Badge variant={REASON[r.reason].variant} className="px-2 py-0 text-[10px]">{REASON[r.reason].label}</Badge>
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function describe(a: ActivityItem): { text: string; href: string | null; icon: typeof BookOpen } {
  const unitLabel = a.unit ? `Unit ${a.unit.number}: ${a.unit.title}` : (a.title ?? 'a unit');
  const unitHref = a.subject && a.unit_id ? `/subjects/${a.subject.slug}/units/${a.unit_id}` : null;
  switch (a.kind) {
    case 'unit_opened': return { text: `Opened ${unitLabel}`, href: unitHref, icon: BookOpen };
    case 'summary_read': return { text: `Read the summary of ${unitLabel}`, href: unitHref ? `${unitHref}?tab=summary` : null, icon: FileText };
    case 'unit_completed': return { text: `Completed ${unitLabel}`, href: unitHref, icon: CheckCircle2 };
    case 'resource_opened': return { text: `Opened “${a.title ?? 'a material'}”`, href: unitHref ? `${unitHref}?tab=materials` : null, icon: FolderOpen };
    case 'quiz_completed': return { text: `Finished “${a.title}” — ${Math.round(a.meta?.percentage ?? 0)}%`, href: a.ref_id ? `/attempts/${a.ref_id}/results` : null, icon: ListChecks };
    case 'exam_completed': return { text: `Finished exam “${a.title}” — ${Math.round(a.meta?.percentage ?? 0)}%`, href: a.ref_id ? `/attempts/${a.ref_id}/results` : null, icon: ClipboardCheck };
    default: return { text: a.title ?? 'Activity', href: null, icon: BookMarked };
  }
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardContent>
        <SectionHeading title="Recent activity" />
        {items.length === 0 ? (
          <EmptyState icon={<TrendingUp />} title="Nothing here yet" description="Your recently opened units, summaries and quiz results will show up here." className="border-0 bg-transparent py-8" />
        ) : (
          <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-border">
            {items.map((a) => {
              const d = describe(a);
              const inner = (
                <>
                  <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground"><d.icon className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug">{d.text}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{timeAgo(a.created_at)}</span>
                  </span>
                </>
              );
              return (
                <li key={a.id}>
                  {d.href ? (
                    <Link href={d.href} className="-m-1 flex gap-3 rounded-lg p-1 transition-colors hover:bg-muted/60">{inner}</Link>
                  ) : (
                    <div className="flex gap-3">{inner}</div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export function QuickActions({ continueHref }: { continueHref: string }) {
  const actions = [
    { href: '/subjects', label: 'Browse subjects', icon: Library },
    { href: continueHref, label: 'Continue learning', icon: PlayCircle },
    { href: '/subjects', label: 'Take a practice quiz', icon: ListChecks },
    { href: '/progress', label: 'View my progress', icon: TrendingUp },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {actions.map((a) => (
        <Link
          key={a.label}
          href={a.href}
          className="group flex min-h-14 items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-input hover:shadow-[var(--shadow-pop)]"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"><a.icon className="size-[18px]" /></span>
          <span className="text-sm font-semibold leading-tight">{a.label}</span>
        </Link>
      ))}
    </div>
  );
}
