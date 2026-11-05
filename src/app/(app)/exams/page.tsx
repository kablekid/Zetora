import type { Metadata } from 'next';
import Link from 'next/link';
import { ClipboardCheck, Play, RotateCcw, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader, SectionHeading } from '@/components/page-header';
import { createClient } from '@/lib/supabase/server';
import { startExamAction } from '@/lib/actions/learning';
import { getFormat, getT, pageTitle } from '@/i18n/server';
import { one } from '@/lib/queries/student';
import type { AttemptSummary, Exam } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('exams') };
}

/** Server-render time (kept out of the component body for the purity lint). */
function currentTime() {
  return Date.now();
}

export default async function ExamsPage() {
  const [supabase, t, tc, f] = await Promise.all([createClient(), getT('exams'), getT('common'), getFormat()]);
  // Grade anything left running past its deadline so history is never stuck "in progress".
  await supabase.rpc('finalize_my_expired_attempts');
  const [examsRes, attemptsRes] = await Promise.all([
    supabase.from('exams').select('id,title,description,kind,subject_id,question_count,duration_minutes,pass_percentage,is_published,subjects(title)').eq('is_published', true).order('kind').order('title'),
    supabase.from('attempts').select('id,kind,exam_id,quiz_id,title,subject_id,unit_id,mode,status,total_questions,score,percentage,pass_percentage,passed,timed_out,duration_seconds,started_at,submitted_at,expires_at').eq('kind', 'exam').order('started_at', { ascending: false }).limit(50),
  ]);
  const exams = ((examsRes.data ?? []) as unknown as Array<Exam & { subjects: { title: string } | { title: string }[] | null }>);
  const attempts = (attemptsRes.data ?? []) as AttemptSummary[];
  const now = currentTime();
  const running = (examId: string) => attempts.find((a) => a.exam_id === examId && a.status === 'in_progress' && a.expires_at && new Date(a.expires_at).getTime() > now);
  const best = (examId: string) => attempts.filter((a) => a.exam_id === examId && a.status === 'submitted').reduce<number | null>((m, a) => (a.percentage != null && (m == null || Number(a.percentage) > m) ? Number(a.percentage) : m), null);
  const history = attempts.filter((a) => a.status === 'submitted');

  return (
    <div className="animate-fade-up space-y-10">
      <PageHeader title={t('page.title')} description={t('page.description')} />

      <section>
        {exams.length === 0 ? (
          <EmptyState icon={<ClipboardCheck />} title={t('page.emptyTitle')} description={t('page.emptyBody')} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {exams.map((e) => {
              const subject = one(e.subjects);
              const live = running(e.id);
              const b = best(e.id);
              return (
                <Card key={e.id}>
                  <CardContent className="flex h-full flex-col">
                    <div className="flex flex-wrap items-center gap-2"><Badge variant="violet">{tc(`examKind.${e.kind}`)}</Badge>{subject && <Badge variant="muted">{subject.title}</Badge>}</div>
                    <h2 className="mt-3 text-base font-semibold tracking-tight">{e.title}</h2>
                    {e.description && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>}
                    <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{t('page.upTo', { count: e.question_count })}</span>
                      <span className="inline-flex items-center gap-1"><Timer className="size-3.5" />{tc('time.minutes', { m: e.duration_minutes })}</span>
                      <span>{t('page.passMark', { pct: e.pass_percentage })}</span>
                      {b != null && <span className="font-semibold text-foreground">{t('page.best', { pct: Math.round(b) })}</span>}
                    </p>
                    <form action={startExamAction} className="mt-auto pt-5">
                      <input type="hidden" name="examId" value={e.id} />
                      <Button type="submit" className="w-full" size="lg" variant={live ? 'secondary' : 'default'}>
                        {live ? <><Play /> {t('page.resume')}</> : b != null ? <><RotateCcw /> {t('page.retake')}</> : <><Play /> {t('page.start')}</>}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionHeading title={t('page.history')} />
        {history.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{t('page.historyEmpty')}</p>
        ) : (
          <div className="relative overflow-x-auto rounded-xl border bg-card shadow-[var(--shadow-card)]">
            <table className="w-full min-w-[34rem] text-start text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr><th className="px-4 py-3 font-medium">{t('page.cols.exam')}</th><th className="px-4 py-3 font-medium">{t('page.cols.date')}</th><th className="px-4 py-3 font-medium">{t('page.cols.score')}</th><th className="px-4 py-3 font-medium">{t('page.cols.time')}</th><th className="px-4 py-3 font-medium">{t('page.cols.result')}</th><th className="px-4 py-3"><span className="sr-only">{t('page.cols.review')}</span></th></tr>
              </thead>
              <tbody>
                {history.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{a.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{f.dateTime(a.submitted_at)}</td>
                    <td className="px-4 py-3 tabular-nums">{a.score}/{a.total_questions} · {Math.round(Number(a.percentage))}%</td>
                    <td className="px-4 py-3 text-muted-foreground">{f.duration(a.duration_seconds)}</td>
                    <td className="px-4 py-3"><Badge variant={a.passed ? 'success' : 'warning'}>{a.timed_out ? tc('status.timedOut') : a.passed ? tc('status.passed') : tc('status.notPassed')}</Badge></td>
                    <td className="px-4 py-3 text-end"><Link href={`/attempts/${a.id}/results`} className="font-medium text-primary hover:underline">{t('page.cols.review')}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
