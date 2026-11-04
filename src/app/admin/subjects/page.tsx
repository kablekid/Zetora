import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { SubjectsManager, type AdminSubject } from '@/components/admin/subjects-manager';
import { requireAdmin } from '@/lib/auth';

export const metadata: Metadata = { title: 'Subjects' };

export default async function AdminSubjectsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: subjects }, { data: units }] = await Promise.all([
    supabase.from('subjects').select('id,slug,title,description,icon,color,image_url,position,is_published,is_demo').order('position').order('title'),
    supabase.from('units').select('subject_id'),
  ]);
  const counts = new Map<string, number>();
  for (const u of (units ?? []) as Array<{ subject_id: string }>) counts.set(u.subject_id, (counts.get(u.subject_id) ?? 0) + 1);
  const rows: AdminSubject[] = ((subjects ?? []) as Omit<AdminSubject, 'unit_count'>[]).map((s) => ({ ...s, unit_count: counts.get(s.id) ?? 0 }));
  return (
    <div className="animate-fade-up">
      <PageHeader title="Subjects" description="Add, edit, reorder and publish the subjects students can study. Changes appear instantly — no code needed." />
      <SubjectsManager subjects={rows} />
    </div>
  );
}
