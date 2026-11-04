import type { Metadata } from 'next';
import Link from 'next/link';
import { Activity, CheckCircle2, Flame, GraduationCap, ListChecks, Target, ThumbsDown, ThumbsUp, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { ProgressRing } from '@/components/ui/progress-ring';
import { PageHeader, SectionHeading } from '@/components/page-header';
import { SubjectTile } from '@/components/subjects/subject-card';
import { ActivityChart, ScoreTrendChart, SubjectBarsChart } from '@/components/charts/charts';
import { requireUser } from '@/lib/auth';
import { getSubjectCards } from '@/lib/queries/subjects';
import { getActivityByDay, getScoreHistory, getStudentStats, getSubjectPerformance, getTopicPerformance } from '@/lib/queries/student';
import { subjectTone } from '@/lib/registry';
import { cn, formatDate, formatDateTime, pct } from '@/lib/utils';

export const metadata: Metadata = { title: 'My progress' };

const MIN_ANSWERS = 3;

export default async function ProgressPage() {
  const { supabase } = await requireUser();
  const [stats, subjects, scores, perf, days, topics, unitsRes, progressRes, recentRes] = await Promise.all([
    getStudentStats(),
    getSubjectCards(),
    getScoreHistory(20),
    getSubjectPerformance(),
    getActivityByDay(30),
    getTopicPerformance(),
    supabase.from('units').select('id,subject_id,number,title,position').eq('is_published', true).order('position'),
    supabase.from('student_progress').select('unit_id,status,reading_progress'),
    supabase.from('attempts').select('id,kind,title,percentage,passed,total_questions,score,submitted_at').eq('status', 'submitted').order('submitted_at', { ascending: false }).limit(8),
  ]);

  const units = (unitsRes.data ?? []) as Array<{ id: string; subject_id: string; number: number; title: string }>;
  const progressByUnit = new Map((progressRes.data ?? []).map((p: { unit_id: string; status: string; reading_progress: number }) => [p.unit_id, p]));
  const recent = (recentRes.data ?? []) as Array<{ id: string; kind: string; title: string; percentage: number; passed: boolean; total_questions: number; score: number; submitted_at: string }>;
  const overall = pct(stats.completed_units, stats.total_units);
  const empty = stats.completed_units === 0 && stats.in_progress_units === 0 && stats.quizzes_completed === 0 && stats.exams_completed === 0;

  const classified = topics.filter((t) => t.answered >= MIN_ANSWERS);
  const weak = classified.filter((t) => Number(t.accuracy) < 60).sort((a, b) => Number(a.accuracy) - Number(b.accuracy)).slice(0, 5);
  const strong = classified.filter((t) => Number(t.accuracy) >= 80).sort((a, b) => Number(b.accuracy) - Number(a.accuracy)).slice(0, 5);

  const tiles = [
    { icon: CheckCircle2, label: 'Units completed', value: `${stats.completed_units}/${stats.total_units}` },
    { icon: ListChecks, label: 'Quizzes completed', value: String(stats.quizzes_completed) },
    { icon: Target, label: 'Average quiz score', value: stats.avg_quiz_score != null ? `${Math.round(Number(stats.avg_quiz_score))}%` : '—' },
    { icon: GraduationCap, label: 'Average exam score', value: stats.avg_exam_score != null ? `${Math.round(Number(stats.avg_exam_score))}%` : '—' },
    { icon: Flame, label: 'Study streak', value: `${stats.study_streak} ${stats.study_streak === 1 ? 'day' : 'days'}` },
    { icon: Activity, label: 'Active days (30 days)', value: String(stats.active_days_30) },
  ];

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader title="My progress" description="Everything here comes from your own activity — nothing is estimated or made up." />

      {empty && (
        <EmptyState icon={<TrendingUp />} title="Your progress will build up here" description="Open a unit, mark it completed or take a quiz — then come back to see your charts and strengths." action={<Link href="/subjects" className="text-sm font-semibold text-primary hover:underline">Browse subjects →</Link>} />
      )}

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr] lg:gap-6">
        <Card><CardContent className="flex flex-col items-center gap-3 text-center">
          <ProgressRing value={overall} size={140} stroke={12} label="Overall learning progress" />
          <div><p className="font-semibold">Overall progress</p><p className="text-sm text-muted-foreground">{stats.completed_units} of {stats.total_units} units completed</p></div>
        </CardContent></Card>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
              <dt className="flex items-center gap-2 text-xs text-muted-foreground"><t.icon className="size-4" /> {t.label}</dt>
              <dd className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{t.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section aria-labelledby="completion">
        <SectionHeading title="Subject & unit completion" />
        <h2 id="completion" className="sr-only">Subject and unit completion</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {subjects.map((s) => {
            const tone = subjectTone(s.color);
            const p = pct(s.completed_units, s.unit_count);
            const sUnits = units.filter((u) => u.subject_id === s.id);
            return (
              <Card key={s.id}><CardContent>
                <div className="flex items-center gap-3">
                  <SubjectTile icon={s.icon} color={s.color} size="sm" />
                  <Link href={`/subjects/${s.slug}`} className="min-w-0 flex-1 truncate font-semibold hover:underline">{s.title}</Link>
                  <span className="text-sm font-bold tabular-nums">{p}%</span>
                </div>
                <Progress value={p} className="mt-3 h-2" barClassName={tone.solid} aria-label={`${s.title} completion`} />
                <ul className="mt-4 flex flex-wrap gap-2" aria-label={`${s.title} units`}>
                  {sUnits.map((u) => {
                    const st = (progressByUnit.get(u.id) as { status: string } | undefined)?.status ?? 'not_started';
                    return (
                      <li key={u.id}>
                        <Link href={`/subjects/${s.slug}/units/${u.id}`} title={`Unit ${u.number}: ${u.title} — ${st.replace('_', ' ')}`}
                          className={cn('flex size-9 items-center justify-center rounded-lg border text-xs font-bold transition-colors',
                            st === 'completed' ? 'border-success/40 bg-success-soft text-success' : st === 'in_progress' ? 'border-accent/40 bg-accent-soft text-accent' : 'bg-muted/60 text-muted-foreground hover:bg-muted')}>
                          {st === 'completed' ? <CheckCircle2 className="size-4" /> : u.number}
                          <span className="sr-only">Unit {u.number}: {u.title}, {st.replace('_', ' ')}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardContent></Card>
            );
          })}
        </div>
        <p className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded bg-success-soft ring-1 ring-success/40" /> Completed</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded bg-accent-soft ring-1 ring-accent/40" /> In progress</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded bg-muted ring-1 ring-border" /> Not started</span>
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3 lg:gap-6" aria-label="Performance charts">
        <Card className="lg:col-span-2"><CardContent>
          <ScoreTrendChart data={scores.map((s) => ({ label: formatDate(s.submitted_at, { day: 'numeric', month: 'short', year: undefined }), title: s.title, value: Math.round(Number(s.percentage)), kind: s.kind }))} />
        </CardContent></Card>
        <Card><CardContent>
          <SubjectBarsChart data={perf.map((p) => ({ name: p.title, value: Math.round(Number(p.avg_percentage)), attempts: p.attempts }))} />
        </CardContent></Card>
        <Card className="lg:col-span-3"><CardContent>
          <ActivityChart data={days.map((d) => ({ label: formatDate(d.day, { day: 'numeric', month: 'short', year: undefined }), full: formatDate(d.day, { weekday: 'long', day: 'numeric', month: 'long', year: undefined }), value: d.activities }))} />
        </CardContent></Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 lg:gap-6" aria-label="Strengths and weaknesses">
        <TopicList title="Topics to strengthen" icon={ThumbsDown} tone="warning" items={weak} empty={classified.length === 0 ? `Answer at least ${MIN_ANSWERS} questions on a topic and it will appear here.` : 'No weak topics right now — nice work.'} />
        <TopicList title="Your strong topics" icon={ThumbsUp} tone="success" items={strong} empty={classified.length === 0 ? `Answer at least ${MIN_ANSWERS} questions on a topic and it will appear here.` : 'Keep practising — strong topics (80%+) will show up here.'} />
      </section>

      <section aria-labelledby="history">
        <SectionHeading title="Recent quiz & exam results" />
        <h2 id="history" className="sr-only">Recent results</h2>
        {recent.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No quiz or exam results yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card shadow-[var(--shadow-card)]">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Activity</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Score</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3"><span className="sr-only">Review</span></th></tr></thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{r.title}</td>
                    <td className="px-4 py-3"><Badge variant={r.kind === 'exam' ? 'violet' : 'default'}>{r.kind === 'exam' ? 'Exam' : 'Quiz'}</Badge></td>
                    <td className="px-4 py-3 tabular-nums">{r.score}/{r.total_questions} <span className={cn('ml-1 font-semibold', r.passed ? 'text-success' : 'text-warning')}>{Math.round(Number(r.percentage))}%</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(r.submitted_at)}</td>
                    <td className="px-4 py-3 text-right"><Link href={`/attempts/${r.id}/results`} className="font-medium text-primary hover:underline">Review</Link></td>
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

function TopicList({ title, icon: Icon, tone, items, empty }: {
  title: string; icon: typeof ThumbsUp; tone: 'success' | 'warning';
  items: Array<{ area_id: string; area_type: string; area_title: string; subject_title: string; accuracy: number; answered: number; correct: number }>;
  empty: string;
}) {
  return (
    <Card><CardContent>
      <h3 className="mb-4 flex items-center gap-2 text-[15px] font-semibold"><Icon className={cn('size-4', tone === 'success' ? 'text-success' : 'text-warning')} /> {title}</h3>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-3.5">
          {items.map((t) => (
            <li key={`${t.area_type}-${t.area_id}`}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium">{t.area_title}</span>
                <span className="shrink-0 font-semibold tabular-nums">{Math.round(Number(t.accuracy))}%</span>
              </div>
              <Progress value={Number(t.accuracy)} className="h-1.5" barClassName={tone === 'success' ? 'bg-success' : 'bg-warning'} aria-label={`${t.area_title} accuracy`} />
              <p className="mt-1 text-xs text-muted-foreground">{t.subject_title} · {t.correct} of {t.answered} correct</p>
            </li>
          ))}
        </ul>
      )}
    </CardContent></Card>
  );
}
