import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowRight, CheckCircle2, Clock, RotateCcw, Target, XCircle } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { ResultsReview } from '@/components/quiz/results-review';
import { createClient } from '@/lib/supabase/server';
import { startExamAction, startQuizAction } from '@/lib/actions/learning';
import { getFormat, getT, pageTitle } from '@/i18n/server';
import type { ResultPayload } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('results'), robots: { index: false } };
}

type ExamsT = Awaited<ReturnType<typeof getT<'exams'>>>;

function message(t: ExamsT, pct: number, passed: boolean, timedOut: boolean) {
  if (timedOut) return t('results.message.timedOut');
  if (pct >= 90) return t('results.message.outstanding');
  if (pct >= 75) return t('results.message.great');
  if (passed) return t('results.message.passed');
  if (pct >= 40) return t('results.message.getting');
  return t('results.message.tough');
}

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [t, f] = await Promise.all([getT('exams'), getFormat()]);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_attempt_result', { p_attempt_id: id });
  if (error) {
    if (/Submit the attempt/i.test(error.message)) redirect(`/attempts/${id}`);
    notFound();
  }
  const { attempt: a, questions } = data as ResultPayload;

  // Where to send the student back to.
  let backHref = '/subjects';
  let backLabel = t('results.backSubjects');
  if (a.subject_id) {
    const { data: subject } = await supabase.from('subjects').select('slug,title').eq('id', a.subject_id).maybeSingle();
    if (subject) {
      backHref = a.unit_id ? `/subjects/${subject.slug}/units/${a.unit_id}?tab=${a.kind === 'quiz' ? 'quiz' : 'test'}` : `/subjects/${subject.slug}`;
      backLabel = a.unit_id ? t('results.backUnit') : t('results.backTo', { title: subject.title });
    }
  }
  if (a.kind === 'exam' && !a.unit_id) { backHref = '/exams'; backLabel = t('results.backExams'); }

  const pct = Math.round(Number(a.percentage));
  const incorrect = a.total_questions - a.score;

  return (
    <div className="mx-auto max-w-3xl animate-fade-up space-y-8">
      <Card className="overflow-hidden">
        <div aria-hidden className={`h-1.5 ${a.passed ? 'bg-success' : 'bg-warning'}`} />
        <CardContent className="flex flex-col items-center gap-6 py-8 text-center sm:flex-row sm:text-start">
          <ProgressRing value={pct} size={136} stroke={12} label={t('results.ring')} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge variant={a.passed ? 'success' : 'warning'}>{a.passed ? t('results.passed') : t('results.notPassedYet')}</Badge>
              <Badge variant="muted">{a.kind === 'exam' ? t('results.kindExam') : a.mode === 'practice' ? t('results.kindPractice') : t('results.kindTimed')}</Badge>
              {a.timed_out && <Badge variant="destructive">{t('results.timedOut')}</Badge>}
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">{a.title}</h1>
            <p className="mt-1.5 text-[15px] text-muted-foreground">{message(t, pct, a.passed, a.timed_out)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('results.passMarkLine', { pct: a.pass_percentage, when: f.dateTime(a.submitted_at) })}</p>
          </div>
        </CardContent>
      </Card>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Target, label: t('results.stats.score'), value: `${a.score}/${a.total_questions}`, tone: '' },
          { icon: CheckCircle2, label: t('results.stats.correct'), value: String(a.score), tone: 'text-success' },
          { icon: XCircle, label: t('results.stats.incorrect'), value: String(incorrect), tone: incorrect ? 'text-destructive' : '' },
          { icon: Clock, label: t('results.stats.time'), value: f.duration(a.duration_seconds), tone: '' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
            <dt className="flex items-center gap-2 text-xs text-muted-foreground"><s.icon className="size-4" /> {s.label}</dt>
            <dd className={`mt-1.5 text-2xl font-bold tabular-nums tracking-tight ${s.tone}`}>{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-3 sm:flex-row">
        {a.quiz_id && (
          <form action={startQuizAction}><input type="hidden" name="quizId" value={a.quiz_id} /><Button type="submit" size="lg" className="w-full sm:w-auto"><RotateCcw /> {t('results.tryAgain')}</Button></form>
        )}
        {a.exam_id && (
          <form action={startExamAction}><input type="hidden" name="examId" value={a.exam_id} /><Button type="submit" size="lg" className="w-full sm:w-auto"><RotateCcw /> {t('results.retake')}</Button></form>
        )}
        <Button asChild size="lg" variant="outline"><Link href={backHref}>{backLabel}</Link></Button>
        <Button asChild size="lg" variant="ghost"><Link href="/progress">{t('results.progress')} <ArrowRight className="rtl:rotate-180" /></Link></Button>
      </div>

      <ResultsReview questions={questions} />
    </div>
  );
}
