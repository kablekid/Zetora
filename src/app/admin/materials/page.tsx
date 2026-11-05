import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/admin/pagination';
import { MaterialsManager, type AdminResource } from '@/components/admin/materials-manager';
import { requireAdmin } from '@/lib/auth';
import { PAGE_SIZE } from '@/lib/constants';
import { getT, pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('adminPages.materials') };
}

export default async function AdminMaterialsPage({ searchParams }: { searchParams: Promise<{ subject?: string; page?: string }> }) {
  const { subject = '', page: pageParam } = await searchParams;
  const { supabase } = await requireAdmin();
  const [t, tm] = await Promise.all([getT('admin'), getT('meta')]);
  const page = Math.max(1, Number(pageParam) || 1);
  const validSubject = /^[0-9a-f-]{36}$/i.test(subject) ? subject : '';

  let query = supabase
    .from('learning_resources')
    .select('id,subject_id,unit_id,title,description,kind,storage_path,file_name,mime_type,file_size,allow_download,is_published,is_demo,created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (validSubject) query = query.eq('subject_id', validSubject);

  const [{ data, count }, { data: subjects }, { data: units }] = await Promise.all([
    query,
    supabase.from('subjects').select('id,title').order('position').order('title'),
    supabase.from('units').select('id,subject_id,number,title').order('position'),
  ]);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const href = (p: number) => `/admin/materials?${new URLSearchParams({ ...(validSubject ? { subject: validSubject } : {}), page: String(p) })}`;

  return (
    <div className="animate-fade-up">
      <PageHeader title={tm('adminPages.materials')} description={t('pages.materials.description')} />
      <MaterialsManager
        resources={(data ?? []) as AdminResource[]}
        subjects={(subjects ?? []) as Array<{ id: string; title: string }>}
        units={(units ?? []) as Array<{ id: string; subject_id: string; number: number; title: string }>}
        subjectFilter={validSubject}
        page={page}
        totalPages={totalPages}
      />
      <Pagination page={page} pageCount={totalPages} hrefFor={href} />
    </div>
  );
}
