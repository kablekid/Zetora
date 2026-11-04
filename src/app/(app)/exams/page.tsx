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
import { EXAM_KIND_LABEL } from '@/lib/registry';
import { formatDateTime, formatDuration, plural } from '@/lib/utils';
import { one } from '@/lib/queries/student';
import type { AttemptSummary, Exam } from '@/lib/types';

export const metadata: Metadata = { title: 'Exams' };

/** Server-render time (kept out of the component body for the purity lint). */
function currentTime() {
  return Date.now();
}

export default async function ExamsPage() {
  const supabase = await createClient();
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
      <PageHeader title="Examinations" description="Timed exams with randomised questions. The clock runs on our servers, so refreshing the page won’t reset it." />

      <section>
        {exams.length === 0 ? (
          <EmptyState icon={<ClipboardCheck />} title="No exams available yet" description="Unit, subject and mock exams will appear here when they are published." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {exams.map((e) => {
              const subject = one(e.subjects);
              const live = running(e.id);
              const b = best(e.id);
              return (
                <Card key={e.id}>
                  <CardContent className="flex h-full flex-col">
                    <div className="flex flex-wrap items-center gap-2"><Badge variant="violet">{EXAM_KIND_LABEL[e.kind]}</Badge>{subject && <Badge variant="muted">{subject.title}</Badge>}</div>
                    <h2 className="mt-3 text-base font-semibold tracking-tight">{e.title}</h2>
                    {e.description && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>}
                    <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Up to {plural(e.question_count, 'question')}</span>
                      <span className="inline-flex items-center gap-1"><Timer className="size-3.5" />{e.duration_minutes} min</span>
                      <span>Pass mark {e.pass_percentage}%</span>
                      {b != null && <span className="font-semibold text-foreground">Best {Math.round(b)}%</span>}
                    </p>
                    <form action={startExamAction} className="mt-auto pt-5">
                      <input type="hidden" name="examId" value={e.id} />
                      <Button type="submit" className="w-full" size="lg" variant={live ? 'secondary' : 'default'}>
                        {live ? <><Play /> Resume exam</> : b != null ? <><RotateCcw /> Retake exam</> : <><Play /> Start exam</>}
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
        <SectionHeading title="Exam history" />
        {history.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">You haven’t completed an exam yet.</p>
        ) : (
          <div className="relative overflow-x-auto rounded-xl border bg-card shadow-[var(--shadow-card)]">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr><th className="px-4 py-3 font-medium">Exam</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Score</th><th className="px-4 py-3 font-medium">Time</th><th className="px-4 py-3 font-medium">Result</th><th className="px-4 py-3"><span className="sr-only">Review</span></th></tr>
              </thead>
              <tbody>
                {history.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{a.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(a.submitted_at)}</td>
                    <td className="px-4 py-3 tabular-nums">{a.score}/{a.total_questions} · {Math.round(Number(a.percentage))}%</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDuration(a.duration_seconds)}</td>
                    <td className="px-4 py-3"><Badge variant={a.passed ? 'success' : 'warning'}>{a.timed_out ? 'Timed out' : a.passed ? 'Passed' : 'Not passed'}</Badge></td>
                    <td className="px-4 py-3 text-right"><Link href={`/attempts/${a.id}/results`} className="font-medium text-primary hover:underline">Review</Link></td>
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
