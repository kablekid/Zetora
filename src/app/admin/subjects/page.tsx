import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { SubjectsManager, type AdminSubject } from '@/components/admin/subjects-manager';
import { requireAdmin } from '@/lib/auth';
import { getT, pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('adminPages.subjects') };
}

export default async function AdminSubjectsPage() {
  const { supabase } = await requireAdmin();
  const [t, tm] = await Promise.all([getT('admin'), getT('meta')]);
  const [{ data: subjects }, { data: units }] = await Promise.all([
    supabase.from('subjects').select('id,slug,title,description,icon,color,image_url,position,is_published,is_demo').order('position').order('title'),
    supabase.from('units').select('subject_id'),
  ]);
  const counts = new Map<string, number>();
  for (const u of (units ?? []) as Array<{ subject_id: string }>) counts.set(u.subject_id, (counts.get(u.subject_id) ?? 0) + 1);
  const rows: AdminSubject[] = ((subjects ?? []) as Omit<AdminSubject, 'unit_count'>[]).map((s) => ({ ...s, unit_count: counts.get(s.id) ?? 0 }));
  return (
    <div className="animate-fade-up">
      <PageHeader title={tm('adminPages.subjects')} description={t('pages.subjects.description')} />
      <SubjectsManager subjects={rows} />
    </div>
  );
}
