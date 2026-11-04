import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { requireUser } from '@/lib/auth';
import { getSubjectCards } from '@/lib/queries/subjects';
import {
  getActivityByDay, getRecentActivity, getRecentUnits, getRecommendations, getScoreHistory, getStudentStats,
  getSubjectPerformance,
} from '@/lib/queries/student';
import {
  ContinueLearning, MySubjects, OverallProgress, QuickActions, RecentActivity, RecommendedSteps, TodayActivity, WelcomeCard,
} from '@/components/dashboard/widgets';
import { ActivityChart, ScoreTrendChart, SubjectBarsChart } from '@/components/charts/charts';
import { SectionHeading } from '@/components/page-header';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const { profile } = await requireUser();
  const [stats, subjects, recs, recentUnits, activity, scores, perf, days] = await Promise.all([
    getStudentStats(),
    getSubjectCards(),
    getRecommendations(4),
    getRecentUnits(3),
    getRecentActivity(7),
    getScoreHistory(12),
    getSubjectPerformance(),
    getActivityByDay(14),
  ]);

  const continueItem = recentUnits.find((u) => u.status === 'in_progress') ?? null;
  const nextRec = recs.find((r) => r.reason === 'next' || r.reason === 'resume') ?? recs[0] ?? null;
  const continueHref = continueItem
    ? `/subjects/${continueItem.subject.slug}/units/${continueItem.unit.id}?tab=summary`
    : nextRec
      ? `/subjects/${nextRec.subject_slug}/units/${nextRec.unit_id}`
      : '/subjects';

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2"><WelcomeCard name={profile.full_name || profile.email} stats={stats} /></div>
        <OverallProgress stats={stats} />
      </div>

      <ContinueLearning item={continueItem} fallback={nextRec} />
      <QuickActions continueHref={continueHref} />

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2"><MySubjects subjects={subjects} /></div>
        <TodayActivity stats={stats} />
      </div>

      <section aria-labelledby="perf">
        <SectionHeading title="Performance overview" />
        <h2 id="perf" className="sr-only">Performance overview</h2>
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
          <Card className="lg:col-span-2"><CardContent>
            <ScoreTrendChart data={scores.map((s) => ({ label: formatDate(s.submitted_at, { day: 'numeric', month: 'short', year: undefined }), title: s.title, value: Math.round(Number(s.percentage)), kind: s.kind }))} />
          </CardContent></Card>
          <Card><CardContent>
            <SubjectBarsChart data={perf.map((p) => ({ name: p.title, value: Math.round(Number(p.avg_percentage)), attempts: p.attempts }))} />
          </CardContent></Card>
          <Card className="lg:col-span-3"><CardContent>
            <ActivityChart data={days.map((d) => ({ label: formatDate(d.day, { day: 'numeric', month: 'short', year: undefined }), full: formatDate(d.day, { weekday: 'long', day: 'numeric', month: 'long', year: undefined }), value: d.activities }))} />
          </CardContent></Card>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2"><RecommendedSteps recs={recs} /></div>
        <RecentActivity items={activity} />
      </div>
    </div>
  );
}
