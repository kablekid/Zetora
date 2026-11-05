import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { PageHeader, SectionHeading } from '@/components/page-header';
import { ColumnChart, SubjectBarsChart } from '@/components/charts/charts';
import { requireAdmin } from '@/lib/auth';
import { pct } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';
import { getFormat, getT, pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('adminPages.analytics') };
}

interface Analytics {
  registrations_by_day: Array<{ day: string; count: number }>;
  attempts_by_day: Array<{ day: string; count: number; avg: number | null }>;
  active_students_7d: number; active_students_30d: number;
  subject_scores: Array<{ title: string; color: string; attempts: number; avg_percentage: number | null }>;
  popular_units: Array<{ unit_title: string; subject_title: string; learners: number; completed: number }>;
  hardest_questions: Array<{ id: string; body: string; answered: number; accuracy: number }>;
}

export default async function AdminAnalyticsPage() {
  const { supabase } = await requireAdmin();
  const [t, tc, f] = await Promise.all([getT('admin'), getT('common'), getFormat()]);
  const short = (d: string) => f.date(d, { day: 'numeric', month: 'short', year: undefined });
  const full = (d: string) => f.date(d, { weekday: 'long', day: 'numeric', month: 'long', year: undefined });
  const { data, error } = await supabase.rpc('admin_analytics', { p_days: 30 });
  if (error) throw error;
  const a = data as Analytics;
  const totalAttempts = a.attempts_by_day.reduce((n, d) => n + d.count, 0);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title={(await getT('meta'))('adminPages.analytics')} description={t('pages.analytics.description')} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          [t('pages.analytics.active7'), a.active_students_7d],
          [t('pages.analytics.active30'), a.active_students_30d],
          [t('pages.analytics.registrations30'), a.registrations_by_day.reduce((n, d) => n + d.count, 0)],
          [t('pages.analytics.attempts30'), totalAttempts],
        ].map(([label, v]) => (
          <div key={label as string} className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">{f.number(v as number)}</p></div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Card><CardContent><ColumnChart title={t('pages.analytics.registrations')} description={t('pages.analytics.registrationsDesc')} unitLabel={t('pages.analytics.registrationsUnit')} emptyText={t('pages.analytics.registrationsEmpty')} data={a.registrations_by_day.map((d) => ({ label: short(d.day), full: full(d.day), value: d.count }))} /></CardContent></Card>
        <Card><CardContent><ColumnChart title={t('pages.analytics.attempts')} description={t('pages.analytics.attemptsDesc')} unitLabel={t('pages.analytics.attemptsUnit')} emptyText={t('pages.analytics.attemptsEmpty')} data={a.attempts_by_day.map((d) => ({ label: short(d.day), full: full(d.day), value: d.count }))} /></CardContent></Card>
        <Card><CardContent><SubjectBarsChart data={a.subject_scores.filter((s) => s.attempts > 0).map((s) => ({ name: s.title, value: Math.round(Number(s.avg_percentage ?? 0)), attempts: s.attempts }))} /></CardContent></Card>
        <Card><CardContent>
          <SectionHeading title={t('pages.analytics.popular')} />
          {a.popular_units.length === 0 ? <EmptyState icon={<BarChart3 />} title={t('pages.analytics.popularEmpty')} className="border-0 bg-transparent py-8" /> : (
            <ul className="space-y-4">
              {a.popular_units.map((u, i) => (
                <li key={i}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm"><span className="min-w-0 truncate font-medium">{u.unit_title}</span><span className="shrink-0 text-xs text-muted-foreground tabular-nums">{t('pages.analytics.learnersLine', { learners: tc('count.learner', { count: u.learners }), completed: u.completed })}</span></div>
                  <Progress value={pct(u.completed, u.learners)} className="h-1.5" aria-label={t('pages.analytics.completionAria', { title: u.unit_title })} />
                  <p className="mt-1 text-xs text-muted-foreground">{u.subject_title}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent></Card>
      </div>

      <Card><CardContent>
        <SectionHeading title={t('pages.analytics.hardest')} />
        <p className="-mt-2 mb-4 text-sm text-muted-foreground">{t('pages.analytics.hardestDesc')}</p>
        {a.hardest_questions.length === 0 ? <EmptyState icon={<BarChart3 />} title={t('pages.analytics.hardestEmptyTitle')} description={t('pages.analytics.hardestEmptyBody')} className="border-0 bg-transparent py-8" /> : (
          <ul className="divide-y">
            {a.hardest_questions.map((q) => (
              <li key={q.id} className="flex items-center gap-4 py-3"><p className="min-w-0 flex-1 truncate text-sm">{q.body}</p><span className="shrink-0 text-xs text-muted-foreground tabular-nums">{tc('count.answer', { count: q.answered })}</span><span className="w-12 shrink-0 text-end text-sm font-semibold tabular-nums text-destructive">{Math.round(Number(q.accuracy))}%</span></li>
            ))}
          </ul>
        )}
      </CardContent></Card>
    </div>
  );
}
