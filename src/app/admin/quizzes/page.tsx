import type { Metadata } from 'next';
import Link from 'next/link';
import { ListChecks, Pencil, Plus, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/page-header';
import { PublishSwitch } from '@/components/admin/ui';
import { DeleteQuizButton } from '@/components/admin/delete-buttons';
import { requireAdmin } from '@/lib/auth';
import { one } from '@/lib/queries/student';

export const metadata: Metadata = { title: 'Quizzes' };

export default async function AdminQuizzesPage() {
  const { supabase } = await requireAdmin();
  const [{ data: quizzes }, { data: qq }] = await Promise.all([
    supabase.from('quizzes').select('id,title,mode,time_limit_minutes,pass_percentage,is_published,is_demo,subjects(title),units(number,title)').order('created_at', { ascending: false }),
    supabase.from('quiz_questions').select('quiz_id'),
  ]);
  const counts = new Map<string, number>();
  for (const r of (qq ?? []) as Array<{ quiz_id: string }>) counts.set(r.quiz_id, (counts.get(r.quiz_id) ?? 0) + 1);
  const rows = (quizzes ?? []) as unknown as Array<{ id: string; title: string; mode: string; time_limit_minutes: number | null; pass_percentage: number; is_published: boolean; is_demo: boolean; subjects: { title: string } | { title: string }[] | null; units: { number: number; title: string } | { number: number; title: string }[] | null }>;

  return (
    <div className="animate-fade-up">
      <PageHeader title="Quizzes" description="Build quizzes from the question bank. Attach them to a unit so students find them on the unit’s Practice quiz tab." actions={<Button asChild><Link href="/admin/quizzes/new"><Plus /> New quiz</Link></Button>} />
      {rows.length === 0 ? (
        <EmptyState icon={<ListChecks />} title="No quizzes yet" description="Create questions first, then assemble them into a quiz." action={<Button asChild><Link href="/admin/quizzes/new"><Plus /> New quiz</Link></Button>} />
      ) : (
        <ul className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
          {rows.map((q) => {
            const subject = one(q.subjects); const unit = one(q.units);
            return (
              <li key={q.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b p-4 last:border-b-0 sm:px-5">
                <div className="min-w-0 flex-1 basis-60">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">{q.title}{q.is_demo && <Badge variant="warning">Demo</Badge>}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{subject?.title}{unit ? ` · Unit ${unit.number}` : ''}</span>
                    <span>{counts.get(q.id) ?? 0} questions</span>
                    <Badge variant={q.mode === 'practice' ? 'success' : 'warning'}>{q.mode === 'practice' ? 'Practice' : 'Exam mode'}</Badge>
                    {q.time_limit_minutes && <span className="inline-flex items-center gap-1"><Timer className="size-3" />{q.time_limit_minutes} min</span>}
                    <span>Pass {q.pass_percentage}%</span>
                  </p>
                </div>
                <PublishSwitch table="quizzes" id={q.id} published={q.is_published} label={q.title} />
                <div className="flex items-center gap-1">
                  <Button asChild variant="ghost" size="icon-sm" aria-label={`Edit ${q.title}`}><Link href={`/admin/quizzes/${q.id}`}><Pencil /></Link></Button>
                  <DeleteQuizButton id={q.id} title={q.title} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
