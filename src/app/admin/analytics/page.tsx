import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { PageHeader, SectionHeading } from '@/components/page-header';
import { ColumnChart, SubjectBarsChart } from '@/components/charts/charts';
import { requireAdmin } from '@/lib/auth';
import { formatDate, pct } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

export const metadata: Metadata = { title: 'Analytics' };

interface Analytics {
  registrations_by_day: Array<{ day: string; count: number }>;
  attempts_by_day: Array<{ day: string; count: number; avg: number | null }>;
  active_students_7d: number; active_students_30d: number;
  subject_scores: Array<{ title: string; color: string; attempts: number; avg_percentage: number | null }>;
  popular_units: Array<{ unit_title: string; subject_title: string; learners: number; completed: number }>;
  hardest_questions: Array<{ id: string; body: string; answered: number; accuracy: number }>;
}

const short = (d: string) => formatDate(d, { day: 'numeric', month: 'short', year: undefined });
const full = (d: string) => formatDate(d, { weekday: 'long', day: 'numeric', month: 'long', year: undefined });

export default async function AdminAnalyticsPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc('admin_analytics', { p_days: 30 });
  if (error) throw error;
  const a = data as Analytics;
  const totalAttempts = a.attempts_by_day.reduce((n, d) => n + d.count, 0);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Analytics" description="Real platform activity from the last 30 days." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Active students (7 days)', a.active_students_7d],
          ['Active students (30 days)', a.active_students_30d],
          ['New registrations (30 days)', a.registrations_by_day.reduce((n, d) => n + d.count, 0)],
          ['Quiz & exam attempts (30 days)', totalAttempts],
        ].map(([label, v]) => (
          <div key={label as string} className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">{(v as number).toLocaleString('en')}</p></div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Card><CardContent><ColumnChart title="New registrations" description="Students who signed up each day" unitLabel="Registrations" emptyText="No registrations in the last 30 days." data={a.registrations_by_day.map((d) => ({ label: short(d.day), full: full(d.day), value: d.count }))} /></CardContent></Card>
        <Card><CardContent><ColumnChart title="Quiz & exam attempts" description="Completed attempts each day" unitLabel="Attempts" emptyText="No completed attempts in the last 30 days." data={a.attempts_by_day.map((d) => ({ label: short(d.day), full: full(d.day), value: d.count }))} /></CardContent></Card>
        <Card><CardContent><SubjectBarsChart data={a.subject_scores.filter((s) => s.attempts > 0).map((s) => ({ name: s.title, value: Math.round(Number(s.avg_percentage ?? 0)), attempts: s.attempts }))} /></CardContent></Card>
        <Card><CardContent>
          <SectionHeading title="Most-studied units" />
          {a.popular_units.length === 0 ? <EmptyState icon={<BarChart3 />} title="No study activity yet" className="border-0 bg-transparent py-8" /> : (
            <ul className="space-y-4">
              {a.popular_units.map((u, i) => (
                <li key={i}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm"><span className="min-w-0 truncate font-medium">{u.unit_title}</span><span className="shrink-0 text-xs text-muted-foreground tabular-nums">{u.learners} learners · {u.completed} completed</span></div>
                  <Progress value={pct(u.completed, u.learners)} className="h-1.5" aria-label={`${u.unit_title} completion rate`} />
                  <p className="mt-1 text-xs text-muted-foreground">{u.subject_title}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent></Card>
      </div>

      <Card><CardContent>
        <SectionHeading title="Hardest questions" />
        <p className="-mt-2 mb-4 text-sm text-muted-foreground">Lowest accuracy among questions answered at least 3 times — good candidates to review or explain better.</p>
        {a.hardest_questions.length === 0 ? <EmptyState icon={<BarChart3 />} title="Not enough answers yet" description="Questions appear here once students have answered them a few times." className="border-0 bg-transparent py-8" /> : (
          <ul className="divide-y">
            {a.hardest_questions.map((q) => (
              <li key={q.id} className="flex items-center gap-4 py-3"><p className="min-w-0 flex-1 truncate text-sm">{q.body}</p><span className="shrink-0 text-xs text-muted-foreground tabular-nums">{q.answered} answers</span><span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-destructive">{Math.round(Number(q.accuracy))}%</span></li>
            ))}
          </ul>
        )}
      </CardContent></Card>
    </div>
  );
}
