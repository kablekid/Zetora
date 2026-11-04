import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { ExamsManager, type AdminExam } from '@/components/admin/exams-manager';
import { requireAdmin } from '@/lib/auth';

export const metadata: Metadata = { title: 'Examinations' };

export default async function AdminExamsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: exams }, { data: eu }, { data: subjects }, { data: units }, { data: qs }] = await Promise.all([
    supabase.from('exams').select('id,title,description,kind,subject_id,question_count,duration_minutes,pass_percentage,is_published,is_demo').order('created_at', { ascending: false }),
    supabase.from('exam_units').select('exam_id,unit_id'),
    supabase.from('subjects').select('id,title').order('position').order('title'),
    supabase.from('units').select('id,subject_id,number,title').order('position'),
    supabase.from('questions').select('subject_id,unit_id'),
  ]);
  const unitIds = new Map<string, string[]>();
  for (const r of (eu ?? []) as Array<{ exam_id: string; unit_id: string }>) unitIds.set(r.exam_id, [...(unitIds.get(r.exam_id) ?? []), r.unit_id]);
  const questions = (qs ?? []) as Array<{ subject_id: string; unit_id: string | null }>;

  const rows: AdminExam[] = ((exams ?? []) as Array<Omit<AdminExam, 'unit_ids' | 'pool'>>).map((e) => {
    const ids = unitIds.get(e.id) ?? [];
    const pool = ids.length ? questions.filter((q) => q.unit_id && ids.includes(q.unit_id)).length : questions.filter((q) => q.subject_id === e.subject_id).length;
    return { ...e, unit_ids: ids, pool };
  });

  return (
    <div className="animate-fade-up">
      <PageHeader title="Examinations" description="Unit, subject, mixed-unit and mock exams with a configurable length and a server-enforced countdown." />
      <ExamsManager exams={rows} subjects={(subjects ?? []) as Array<{ id: string; title: string }>} units={(units ?? []) as Array<{ id: string; subject_id: string; number: number; title: string }>} />
    </div>
  );
}
