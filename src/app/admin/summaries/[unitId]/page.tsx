import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SummaryEditor } from '@/components/admin/editor/summary-editor';
import { requireAdmin } from '@/lib/auth';
import { one } from '@/lib/queries/student';
import { pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('adminPages.editSummary') };
}

export default async function EditSummaryPage({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(unitId)) notFound();
  const { supabase } = await requireAdmin();
  const [{ data: unit }, { data: summary }] = await Promise.all([
    supabase.from('units').select('id,title,subjects(title,slug)').eq('id', unitId).maybeSingle(),
    supabase.from('summaries').select('content_html,status').eq('unit_id', unitId).maybeSingle(),
  ]);
  if (!unit) notFound();
  const subject = one((unit as unknown as { subjects: { title: string; slug: string } | { title: string; slug: string }[] | null }).subjects);
  return (
    <div className="animate-fade-up">
      <SummaryEditor
        unitId={unitId}
        unitTitle={(unit as { title: string }).title}
        subjectTitle={subject?.title ?? ''}
        subjectSlug={subject?.slug ?? ''}
        initialHtml={(summary?.content_html as string | undefined) ?? ''}
        status={(summary?.status as 'draft' | 'published' | undefined) ?? 'none'}
      />
    </div>
  );
}
