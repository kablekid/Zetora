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
import { cn, pct } from '@/lib/utils';
import { getFormat, getT } from '@/i18n/server';
import { subjectTone } from '@/lib/registry';
import type { ActivityItem, ContinueItem } from '@/lib/queries/student';
import type { Recommendation, StudentStats, SubjectCard } from '@/lib/types';

export async function WelcomeCard({ name, stats }: { name: string; stats: StudentStats }) {
  const [t, tc, f] = await Promise.all([getT('dashboard'), getT('common'), getFormat()]);
  const first = name.trim().split(/\s+/)[0] || t('welcome.there');
  const isNew = stats.completed_units === 0 && stats.quizzes_completed === 0 && stats.in_progress_units === 0;
  return (
    <Card className="relative overflow-hidden">
      <div aria-hidden className="absolute -end-10 -top-10 size-44 rounded-full bg-secondary/10 blur-2xl" />
      <CardContent className="relative flex h-full flex-col justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{f.longDate()}</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
            {t('welcome.line', { greeting: f.greeting(), name: first })}
          </h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            {isNew ? t('welcome.newUser') : t('welcome.returning')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {stats.study_streak > 0 ? (
            <Badge variant="warning" className="px-3 py-1 text-[13px]">
              <Flame /> {t('welcome.streak', { count: stats.study_streak })}
            </Badge>
          ) : (
            <Badge variant="muted" className="px-3 py-1 text-[13px]">
              <Flame /> {t('welcome.startStreak')}
            </Badge>
          )}
          {stats.in_progress_units > 0 && (
            <Badge variant="default" className="px-3 py-1 text-[13px]">
              <BookOpen /> {t('welcome.inProgress', { units: tc('count.unit', { count: stats.in_progress_units }) })}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export async function OverallProgress({ stats }: { stats: StudentStats }) {
  const t = await getT('dashboard');
  const overall = pct(stats.completed_units, stats.total_units);
  const items = [
    { label: t('overall.unitsCompleted'), value: `${stats.completed_units}/${stats.total_units}`, icon: CheckCircle2 },
    { label: t('overall.quizzesCompleted'), value: String(stats.quizzes_completed), icon: ListChecks },
    { label: t('overall.avgQuiz'), value: stats.avg_quiz_score != null ? `${Math.round(Number(stats.avg_quiz_score))}%` : '—', icon: Target },
  ];
  return (
    <Card>
      <CardContent className="space-y-5">
        <SectionHeading title={t('overall.title')} className="mb-0" />
        <div className="flex items-center gap-5">
          <ProgressRing value={overall} label={t('overall.ring')} />
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

export async function ContinueLearning({ item, fallback }: { item: ContinueItem | null; fallback: Recommendation | null }) {
  const [t, tc, f] = await Promise.all([getT('dashboard'), getT('common'), getFormat()]);
  if (item && item.status === 'in_progress') {
    const href = `/subjects/${item.subject.slug}/units/${item.unit.id}?tab=summary`;
    return (
      <ContinueShell
        eyebrow={t('continue.eyebrow')}
        subject={item.subject.title}
        title={t('continue.unitLine', { n: item.unit.number, title: item.unit.title })}
        progress={item.reading_progress}
        cta={t('continue.cta')}
        href={href}
        meta={t('continue.meta', { min: tc('time.minutes', { m: item.unit.estimated_minutes }), when: f.timeAgo(item.last_accessed_at) })}
        progressLabel={t('continue.unitProgress')}
      />
    );
  }
  if (fallback) {
    return (
      <ContinueShell
        eyebrow={item ? t('continue.upNext') : t('continue.startFirst')}
        subject={fallback.subject_title}
        title={t('continue.unitLine', { n: fallback.unit_number, title: fallback.unit_title })}
        progress={null}
        cta={t('continue.startUnit')}
        href={`/subjects/${fallback.subject_slug}/units/${fallback.unit_id}`}
        meta={tc('time.minutes', { m: fallback.estimated_minutes })}
        progressLabel={t('continue.unitProgress')}
      />
    );
  }
  return (
    <ContinueShell eyebrow={t('continue.getStarted')} subject="" title={t('continue.chooseSubject')} progress={null} cta={t('continue.browse')} href="/subjects" meta={t('continue.lastUnitHint')} progressLabel={t('continue.unitProgress')} />
  );
}

function ContinueShell({ eyebrow, subject, title, progress, cta, href, meta, progressLabel }: {
  eyebrow: string; subject: string; title: string; progress: number | null; cta: string; href: string; meta: string; progressLabel: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-midnight p-5 text-white shadow-[var(--shadow-card)] sm:p-7">
      <div aria-hidden className="absolute -end-16 -top-20 size-72 rounded-full bg-secondary/30 blur-3xl" />
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
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={progressLabel}>
                <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs font-semibold tabular-nums">{progress}%</span>
            </div>
          )}
          <p className="mt-3 text-xs text-white/55">{meta}</p>
        </div>
        <Button asChild size="lg" className="w-full bg-white text-midnight hover:bg-white/90 sm:w-auto">
          <Link href={href}>{cta} <ArrowRight className="rtl:rotate-180" /></Link>
        </Button>
      </div>
    </div>
  );
}

export async function MySubjects({ subjects }: { subjects: SubjectCard[] }) {
  const [t, tc] = await Promise.all([getT('dashboard'), getT('common')]);
  return (
    <Card>
      <CardContent>
        <SectionHeading title={t('subjects.title')} action={<Link href="/subjects" className="text-sm font-medium text-primary hover:underline">{t('subjects.viewAll')}</Link>} />
        {subjects.length === 0 ? (
          <EmptyState icon={<Library />} title={t('subjects.emptyTitle')} description={t('subjects.emptyBody')} className="border-0 bg-transparent py-8" />
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
                      <Progress value={progress} className="mt-1.5 h-1.5" barClassName={tone.solid} aria-label={t('subjects.completionAria', { title: s.title })} />
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {t('subjects.line', { units: tc('count.unit', { count: s.unit_count }), done: s.completed_units })}
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

export async function TodayActivity({ stats }: { stats: StudentStats }) {
  const t = await getT('dashboard');
  const today = stats.today ?? {};
  const goals = [
    { key: 'openUnit' as const, done: (today.unit_opened ?? 0) > 0, href: '/subjects', icon: BookOpen },
    { key: 'readSummary' as const, done: (today.summary_read ?? 0) > 0, href: '/subjects', icon: FileText },
    { key: 'completeQuiz' as const, done: (today.quiz_completed ?? 0) + (today.exam_completed ?? 0) > 0, href: '/subjects', icon: ListChecks },
  ];
  const done = goals.filter((g) => g.done).length;
  return (
    <Card>
      <CardContent>
        <SectionHeading title={t('today.title')} action={<span className="text-xs font-semibold text-muted-foreground tabular-nums">{t('today.doneOf', { done, total: goals.length })}</span>} />
        <Progress value={(done / goals.length) * 100} className="mb-4 h-1.5" barClassName="bg-success" aria-label={t('today.aria')} />
        <ul className="space-y-1">
          {goals.map((g) => (
            <li key={g.key}>
              <Link href={g.href} className="flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60">
                {g.done ? <CheckCircle2 className="size-5 text-success" /> : <Circle className="size-5 text-muted-foreground/50" />}
                <span className={cn('flex-1 text-sm', g.done ? 'text-muted-foreground line-through decoration-muted-foreground/40' : 'font-medium')}>{t(`today.${g.key}`)}</span>
                {!g.done && <g.icon className="size-4 text-muted-foreground/60" />}
              </Link>
            </li>
          ))}
        </ul>
        {done === goals.length && (
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm font-medium text-success">
            <Trophy className="size-4" /> {t('today.allDone')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

const REASON_VARIANT: Record<Recommendation['reason'], 'default' | 'accent' | 'warning'> = {
  resume: 'accent',
  next: 'default',
  review: 'warning',
};

export async function RecommendedSteps({ recs }: { recs: Recommendation[] }) {
  const t = await getT('dashboard');
  return (
    <Card>
      <CardContent>
        <SectionHeading title={t('recommended.title')} />
        {recs.length === 0 ? (
          <EmptyState icon={<Sparkles />} title={t('recommended.emptyTitle')} description={t('recommended.emptyBody')} className="border-0 bg-transparent py-8" />
        ) : (
          <ul className="space-y-1">
            {recs.map((r) => (
              <li key={r.unit_id}>
                <Link href={`/subjects/${r.subject_slug}/units/${r.unit_id}`} className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60">
                  <SubjectTile icon={r.subject_icon} color={r.subject_color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t('continue.unitLine', { n: r.unit_number, title: r.unit_title })}</p>
                    <p className="mt-0.5 flex items-center gap-2 truncate text-xs text-muted-foreground">
                      {r.subject_title}
                      <Badge variant={REASON_VARIANT[r.reason]} className="px-2 py-0 text-[10px]">{t(`recommended.reason.${r.reason}`)}</Badge>
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

type DashT = Awaited<ReturnType<typeof getT<'dashboard'>>>;

function describe(a: ActivityItem, t: DashT): { text: string; href: string | null; icon: typeof BookOpen } {
  const unitLabel = a.unit ? t('continue.unitLine', { n: a.unit.number, title: a.unit.title }) : (a.title ?? t('activity.aUnit'));
  const unitHref = a.subject && a.unit_id ? `/subjects/${a.subject.slug}/units/${a.unit_id}` : null;
  const pctValue = Math.round(a.meta?.percentage ?? 0);
  switch (a.kind) {
    case 'unit_opened': return { text: t('activity.opened', { unit: unitLabel }), href: unitHref, icon: BookOpen };
    case 'summary_read': return { text: t('activity.readSummary', { unit: unitLabel }), href: unitHref ? `${unitHref}?tab=summary` : null, icon: FileText };
    case 'unit_completed': return { text: t('activity.completed', { unit: unitLabel }), href: unitHref, icon: CheckCircle2 };
    case 'resource_opened': return { text: t('activity.material', { title: a.title ?? t('activity.aMaterial') }), href: unitHref ? `${unitHref}?tab=materials` : null, icon: FolderOpen };
    case 'quiz_completed': return { text: t('activity.quiz', { title: a.title ?? '', pct: pctValue }), href: a.ref_id ? `/attempts/${a.ref_id}/results` : null, icon: ListChecks };
    case 'exam_completed': return { text: t('activity.exam', { title: a.title ?? '', pct: pctValue }), href: a.ref_id ? `/attempts/${a.ref_id}/results` : null, icon: ClipboardCheck };
    default: return { text: a.title ?? t('activity.generic'), href: null, icon: BookMarked };
  }
}

export async function RecentActivity({ items }: { items: ActivityItem[] }) {
  const [t, f] = await Promise.all([getT('dashboard'), getFormat()]);
  return (
    <Card>
      <CardContent>
        <SectionHeading title={t('activity.title')} />
        {items.length === 0 ? (
          <EmptyState icon={<TrendingUp />} title={t('activity.emptyTitle')} description={t('activity.emptyBody')} className="border-0 bg-transparent py-8" />
        ) : (
          <ol className="relative space-y-4 before:absolute before:bottom-2 before:start-[15px] before:top-2 before:w-px before:bg-border">
            {items.map((a) => {
              const d = describe(a, t);
              const inner = (
                <>
                  <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground"><d.icon className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug">{d.text}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{f.timeAgo(a.created_at)}</span>
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

export async function QuickActions({ continueHref }: { continueHref: string }) {
  const t = await getT('dashboard');
  const actions = [
    { href: '/subjects', label: t('quick.browse'), icon: Library },
    { href: continueHref, label: t('quick.continue'), icon: PlayCircle },
    { href: '/subjects', label: t('quick.practice'), icon: ListChecks },
    { href: '/progress', label: t('quick.progress'), icon: TrendingUp },
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
