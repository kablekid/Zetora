import type { Metadata } from 'next';
import Link from 'next/link';
import { Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/page-header';
import { UnitsManager, type AdminUnit } from '@/components/admin/units-manager';
import { requireAdmin } from '@/lib/auth';
import { getT, pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('adminPages.units') };
}

export default async function AdminUnitsPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const { subject } = await searchParams;
  const { supabase } = await requireAdmin();
  const [t, tm] = await Promise.all([getT('admin'), getT('meta')]);
  const { data: subjects } = await supabase.from('subjects').select('id,title').order('position').order('title');
  const list = (subjects ?? []) as Array<{ id: string; title: string }>;
  if (list.length === 0) {
    return (
      <div className="animate-fade-up">
        <PageHeader title={tm('adminPages.units')} description={t('pages.units.belong')} />
        <EmptyState icon={<Library />} title={t('pages.units.createFirstTitle')} description={t('pages.units.createFirstBody')} action={<Button asChild><Link href="/admin/subjects">{t('pages.units.goToSubjects')}</Link></Button>} />
      </div>
    );
  }
  const current = list.find((s) => s.id === subject) ?? list[0];
  const { data: units } = await supabase
    .from('units')
    .select('id,subject_id,number,position,title,description,introduction,objectives,key_concepts,estimated_minutes,is_published,is_demo')
    .eq('subject_id', current.id)
    .order('position')
    .order('number');
  const unitIds = ((units ?? []) as Array<{ id: string }>).map((u) => u.id);
  const [{ data: topics }, { data: summaries }] = unitIds.length
    ? await Promise.all([
        supabase.from('topics').select('unit_id,title,position').in('unit_id', unitIds).order('position'),
        supabase.from('summaries').select('unit_id,status').in('unit_id', unitIds),
      ])
    : [{ data: [] }, { data: [] }];
  const topicMap = new Map<string, string[]>();
  for (const t of (topics ?? []) as Array<{ unit_id: string; title: string }>) topicMap.set(t.unit_id, [...(topicMap.get(t.unit_id) ?? []), t.title]);
  const sumMap = new Map((summaries ?? []).map((s: { unit_id: string; status: 'draft' | 'published' }) => [s.unit_id, s.status]));
  const rows: AdminUnit[] = ((units ?? []) as Omit<AdminUnit, 'topics' | 'summary_status'>[]).map((u) => ({ ...u, topics: topicMap.get(u.id) ?? [], summary_status: sumMap.get(u.id) ?? 'none' }));

  return (
    <div className="animate-fade-up">
      <PageHeader title={tm('adminPages.units')} description={t('pages.units.description')} />
      <UnitsManager subjects={list} subjectId={current.id} units={rows} />
    </div>
  );
}
