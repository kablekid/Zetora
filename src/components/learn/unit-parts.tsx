import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Clock, Download, Eye, FileText, FolderOpen, Image as ImageIcon,
  ListChecks, ListTree, NotebookText, Play, RotateCcw, Target, Timer,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { cn, formatBytes } from '@/lib/utils';
import { getFormat, getT } from '@/i18n/server';
import { startExamAction, startQuizAction } from '@/lib/actions/learning';
import type { UnitBundle } from '@/lib/queries/student';
import type { LearningResource } from '@/lib/types';
import { DownloadButton } from './download-button';

export const UNIT_TABS = [
  { id: 'overview', labelKey: 'tabs.overview', icon: NotebookText },
  { id: 'summary', labelKey: 'tabs.summary', icon: FileText },
  { id: 'materials', labelKey: 'tabs.materials', icon: FolderOpen },
  { id: 'quiz', labelKey: 'tabs.quiz', icon: ListChecks },
  { id: 'test', labelKey: 'tabs.test', icon: ClipboardCheck },
] as const;
export type UnitTabId = (typeof UNIT_TABS)[number]['id'];

export function parseTab(value: string | undefined): UnitTabId {
  return (UNIT_TABS.find((tab) => tab.id === value)?.id ?? 'overview') as UnitTabId;
}

export async function UnitTabNav({ basePath, active, bundle }: { basePath: string; active: UnitTabId; bundle: UnitBundle }) {
  const t = await getT('learn');
  const counts: Record<UnitTabId, number | boolean> = {
    overview: false,
    summary: Boolean(bundle.summary),
    materials: bundle.resources.length,
    quiz: bundle.quizzes.length,
    test: bundle.exams.length,
  };
  return (
    <nav aria-label={t('tabs.nav')} className="no-scrollbar sticky top-16 z-20 -mx-4 overflow-x-auto border-b bg-background/90 px-4 backdrop-blur sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1">
        {UNIT_TABS.map((tab) => {
          const isActive = tab.id === active;
          const c = counts[tab.id];
          const available = c === false ? null : Boolean(c);
          return (
            <li key={tab.id}>
              <Link
                href={tab.id === 'overview' ? basePath : `${basePath}?tab=${tab.id}`}
                scroll={false}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex h-12 items-center gap-2 whitespace-nowrap px-3.5 text-sm font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <tab.icon className="size-4" />
                {t(tab.labelKey)}
                {typeof c === 'number' && c > 0 && (
                  <span className={cn('rounded-full px-1.5 text-[11px] font-semibold tabular-nums', isActive ? 'bg-primary-soft text-primary' : 'bg-muted text-muted-foreground')}>{c}</span>
                )}
                {available === false && <span className="size-1.5 rounded-full bg-muted-foreground/30" title={t('tabs.notYet')} />}
                {isActive && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export async function OverviewTab({ bundle, basePath }: { bundle: UnitBundle; basePath: string }) {
  const [t, tc] = await Promise.all([getT('learn'), getT('common')]);
  const { unit, topics, progress } = bundle;
  const paragraphs = unit.introduction.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const status = progress?.status === 'completed' ? tc('status.completed') : progress ? tc('status.inProgress') : tc('status.notStarted');
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <Card><CardContent className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">{t('overview.introduction')}</h2>
          {paragraphs.length ? paragraphs.map((p, i) => <p key={i} className="leading-relaxed text-foreground/85">{p}</p>) : <p className="text-muted-foreground">{unit.description || t('overview.noIntro')}</p>}
        </CardContent></Card>

        {unit.objectives.length > 0 && (
          <Card><CardContent>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight"><Target className="size-5 text-primary" /> {t('overview.objectives')}</h2>
            <p className="mb-3 text-sm text-muted-foreground">{t('overview.objectivesLead')}</p>
            <ul className="space-y-2.5">
              {unit.objectives.map((o, i) => (
                <li key={i} className="flex gap-3 text-[15px]"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" /><span>{o}</span></li>
              ))}
            </ul>
          </CardContent></Card>
        )}

        {topics.length > 0 && (
          <Card><CardContent>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight"><ListTree className="size-5 text-primary" /> {t('overview.topics')}</h2>
            <ol className="grid gap-2.5 sm:grid-cols-2">
              {topics.map((topic, i) => (
                <li key={topic.id} className="flex items-center gap-3 rounded-lg border bg-background px-3.5 py-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary-soft text-xs font-bold text-primary">{i + 1}</span>
                  <span className="text-sm font-medium">{topic.title}</span>
                </li>
              ))}
            </ol>
          </CardContent></Card>
        )}

        {unit.key_concepts.length > 0 && (
          <Card><CardContent>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">{t('overview.concepts')}</h2>
            <div className="flex flex-wrap gap-2">
              {unit.key_concepts.map((c) => <Badge key={c} variant="violet" className="px-3 py-1 text-[13px]">{c}</Badge>)}
            </div>
          </CardContent></Card>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
        <Card><CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{t('overview.status')}</span><Badge variant={progress?.status === 'completed' ? 'success' : progress ? 'accent' : 'muted'}>{status}</Badge></div>
          <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{t('overview.studyTime')}</span><span className="flex items-center gap-1.5 font-semibold"><Clock className="size-4 text-muted-foreground" />{tc('time.minutes', { m: unit.estimated_minutes })}</span></div>
          <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{t('overview.summary')}</span><span className="font-semibold">{bundle.summary ? t('overview.available') : t('overview.comingSoon')}</span></div>
          <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{t('overview.materials')}</span><span className="font-semibold">{bundle.resources.length ? tc('count.file', { count: bundle.resources.length }) : t('overview.noneYet')}</span></div>
          <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{t('overview.quizzes')}</span><span className="font-semibold">{bundle.quizzes.length || t('overview.noneYet')}</span></div>
          <Button asChild size="lg" className="w-full">
            <Link href={bundle.summary ? `${basePath}?tab=summary` : bundle.quizzes.length ? `${basePath}?tab=quiz` : basePath}>
              {bundle.summary ? t('overview.readSummary') : bundle.quizzes.length ? t('overview.practiceNow') : t('overview.overviewOnly')} <ArrowRight className="rtl:rotate-180" />
            </Link>
          </Button>
        </CardContent></Card>
      </aside>
    </div>
  );
}

export async function UnitPager({ bundle, slug }: { bundle: UnitBundle; slug: string }) {
  const t = await getT('learn');
  const i = bundle.siblings.findIndex((s) => s.id === bundle.unit.id);
  const prev = i > 0 ? bundle.siblings[i - 1] : null;
  const next = i >= 0 && i < bundle.siblings.length - 1 ? bundle.siblings[i + 1] : null;
  if (!prev && !next) return null;
  return (
    <nav aria-label={t('pager.nav')} className="mt-10 grid gap-3 sm:grid-cols-2">
      {prev ? (
        <Link href={`/subjects/${slug}/units/${prev.id}`} className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-input hover:bg-muted/40">
          <ArrowLeft className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
          <span className="min-w-0"><span className="block text-xs text-muted-foreground">{t('pager.previous')}</span><span className="block truncate text-sm font-semibold">{t('pager.line', { n: prev.number, title: prev.title })}</span></span>
        </Link>
      ) : <span />}
      {next ? (
        <Link href={`/subjects/${slug}/units/${next.id}`} className="group flex items-center justify-end gap-3 rounded-xl border bg-card p-4 text-end transition-colors hover:border-input hover:bg-muted/40">
          <span className="min-w-0"><span className="block text-xs text-muted-foreground">{t('pager.next')}</span><span className="block truncate text-sm font-semibold">{t('pager.line', { n: next.number, title: next.title })}</span></span>
          <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : <span />}
    </nav>
  );
}

const KIND_ICON = { pdf: FileText, note: NotebookText, image: ImageIcon, reference: FolderOpen } as const;

export async function MaterialsTab({ resources }: { resources: LearningResource[] }) {
  const [t, tc, f] = await Promise.all([getT('learn'), getT('common'), getFormat()]);
  if (!resources.length) {
    return <EmptyState icon={<FolderOpen />} title={t('materials.emptyTitle')} description={t('materials.emptyBody')} />;
  }
  return (
    <ul className="space-y-3">
      {resources.map((r) => {
        const Icon = KIND_ICON[r.kind] ?? FileText;
        return (
          <li key={r.id} className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:p-5">
            <div className="flex min-w-0 flex-1 gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-destructive-soft text-destructive"><Icon className="size-6" /></span>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold leading-snug">{r.title}</h3>
                {r.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>}
                <p className="mt-1.5 text-xs text-muted-foreground">{t('materials.meta', { kind: tc(`resourceKind.${r.kind}`), size: formatBytes(r.file_size), date: f.date(r.created_at) })}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button asChild className="flex-1 sm:flex-none"><Link href={`/resources/${r.id}`}><Eye /> {t('materials.view')}</Link></Button>
              {r.allow_download && <DownloadButton resourceId={r.id} />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export async function QuizTab({ bundle }: { bundle: UnitBundle }) {
  const [t, tc] = await Promise.all([getT('learn'), getT('common')]);
  if (!bundle.quizzes.length) {
    return <EmptyState icon={<ListChecks />} title={t('quiz.emptyTitle')} description={t('quiz.emptyBody')} />;
  }
  return (
    <ul className="space-y-3">
      {bundle.quizzes.map((q) => {
        const submitted = q.attempts.filter((a) => a.status === 'submitted');
        const best = submitted.reduce<number | null>((m, a) => (a.percentage != null && (m == null || Number(a.percentage) > m) ? Number(a.percentage) : m), null);
        const inProgress = q.attempts.find((a) => a.status === 'in_progress' && (!a.expires_at || new Date(a.expires_at) > new Date()));
        const last = submitted[0];
        return (
          <li key={q.id} className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold tracking-tight">{q.title}</h3>
                  <Badge variant={q.mode === 'practice' ? 'success' : 'warning'}>{q.mode === 'practice' ? t('quiz.practice') : t('quiz.timed')}</Badge>
                </div>
                {q.description && <p className="mt-1.5 text-sm text-muted-foreground">{q.description}</p>}
                <p className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{tc('count.question', { count: q.question_count })}</span>
                  {q.time_limit_minutes && <span className="inline-flex items-center gap-1"><Timer className="size-3.5" />{tc('time.minutes', { m: q.time_limit_minutes })}</span>}
                  <span>{t('quiz.passMark', { pct: q.pass_percentage })}</span>
                  {best != null && <span className="font-semibold text-foreground">{t('quiz.best', { pct: Math.round(best) })}</span>}
                  {submitted.length > 0 && <span>{tc('count.attempt', { count: submitted.length })}</span>}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <form action={startQuizAction}>
                  <input type="hidden" name="quizId" value={q.id} />
                  <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={q.question_count === 0}>
                    {inProgress ? <><Play /> {t('quiz.resume')}</> : submitted.length ? <><RotateCcw /> {t('quiz.tryAgain')}</> : <><Play /> {t('quiz.start')}</>}
                  </Button>
                </form>
                {last && <Link href={`/attempts/${last.id}/results`} className="text-sm font-medium text-primary hover:underline">{t('quiz.reviewLast', { pct: Math.round(Number(last.percentage)) })}</Link>}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export async function TestTab({ bundle }: { bundle: UnitBundle }) {
  const [t, tc] = await Promise.all([getT('learn'), getT('common')]);
  if (!bundle.exams.length) {
    return <EmptyState icon={<ClipboardCheck />} title={t('test.emptyTitle')} description={t('test.emptyBody')} />;
  }
  return (
    <ul className="space-y-3">
      {bundle.exams.map((e) => (
        <li key={e.id} className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-semibold">{e.title}</h3><Badge variant="violet">{tc(`examKind.${e.kind}`)}</Badge></div>
              {e.description && <p className="mt-1.5 text-sm text-muted-foreground">{e.description}</p>}
              <p className="mt-2.5 flex flex-wrap gap-x-4 text-xs text-muted-foreground"><span>{t('test.upTo', { count: e.question_count })}</span><span className="inline-flex items-center gap-1"><Timer className="size-3.5" />{tc('time.minutes', { m: e.duration_minutes })}</span><span>{t('quiz.passMark', { pct: e.pass_percentage })}</span></p>
            </div>
            <form action={startExamAction}>
              <input type="hidden" name="examId" value={e.id} />
              <Button type="submit" size="lg" className="w-full sm:w-auto"><Play /> {t('test.start')}</Button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function DownloadIconFallback() { return <Download />; }
