import type { Metadata } from 'next';
import 'katex/dist/katex.min.css';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/admin/pagination';
import { QuestionsManager } from '@/components/admin/questions-manager';
import { requireAdmin } from '@/lib/auth';
import { PAGE_SIZE } from '@/lib/constants';
import type { QuestionAdminRow } from '@/lib/types';
import { getT, pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('adminPages.questions') };
}
const isId = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

export default async function AdminQuestionsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const [t, tm] = await Promise.all([getT('admin'), getT('meta')]);
  const page = Math.max(1, Number(sp.page) || 1);
  const filters = {
    q: (sp.q ?? '').slice(0, 100),
    subject: isId(sp.subject ?? '') ? sp.subject! : '',
    unit: isId(sp.unit ?? '') ? sp.unit! : '',
    difficulty: ['easy', 'medium', 'hard'].includes(sp.difficulty ?? '') ? sp.difficulty! : '',
    type: ['multiple_choice', 'true_false', 'multiple_select', 'short_answer'].includes(sp.type ?? '') ? sp.type! : '',
  };

  let query = supabase
    .from('questions')
    .select('id,subject_id,unit_id,topic_id,type,body,explanation,accepted_answers,difficulty,created_at,question_options(id,body,is_correct,position),subjects(title),units(title,number)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (filters.q) query = query.ilike('body', `%${filters.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
  if (filters.subject) query = query.eq('subject_id', filters.subject);
  if (filters.unit) query = query.eq('unit_id', filters.unit);
  if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);
  if (filters.type) query = query.eq('type', filters.type);

  const [{ data, count }, { data: subjects }, { data: units }, { data: topics }] = await Promise.all([
    query,
    supabase.from('subjects').select('id,title').order('position').order('title'),
    supabase.from('units').select('id,subject_id,number,title').order('position'),
    supabase.from('topics').select('id,unit_id,title').order('position'),
  ]);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const href = (p: number) => `/admin/questions?${new URLSearchParams({ ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), page: String(p) })}`;

  return (
    <div className="animate-fade-up">
      <PageHeader title={tm('adminPages.questions')} description={t('pages.questions.description')} />
      <QuestionsManager
        questions={(data ?? []) as unknown as QuestionAdminRow[]}
        subjects={(subjects ?? []) as Array<{ id: string; title: string }>}
        units={(units ?? []) as Array<{ id: string; subject_id: string; number: number; title: string }>}
        topics={(topics ?? []) as Array<{ id: string; unit_id: string; title: string }>}
        filters={filters}
        total={count ?? 0}
      />
      <Pagination page={page} pageCount={totalPages} hrefFor={href} />
    </div>
  );
}
