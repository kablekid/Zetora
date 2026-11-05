import type { Metadata } from 'next';
import 'katex/dist/katex.min.css';
import { notFound } from 'next/navigation';
import { QuizBuilder, type QuizInitial } from '@/components/admin/quiz-builder';
import { requireAdmin } from '@/lib/auth';
import type { BankQuestion } from '@/lib/actions/admin-queries';
import type { Difficulty, QuestionType } from '@/lib/types';
import { pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('adminPages.quizBuilder') };
}

export default async function QuizBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: subjects }, { data: units }] = await Promise.all([
    supabase.from('subjects').select('id,title').order('position').order('title'),
    supabase.from('units').select('id,subject_id,number,title').order('position'),
  ]);
  const subjectList = (subjects ?? []) as Array<{ id: string; title: string }>;

  let initial: QuizInitial = { title: '', description: '', subject_id: subjectList[0]?.id ?? '', unit_id: null, mode: 'practice', time_limit_minutes: null, pass_percentage: 60, shuffle_questions: false, is_published: false };
  let selected: BankQuestion[] = [];

  if (id !== 'new') {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const { data: quiz } = await supabase.from('quizzes').select('id,title,description,subject_id,unit_id,mode,time_limit_minutes,pass_percentage,shuffle_questions,is_published').eq('id', id).maybeSingle();
    if (!quiz) notFound();
    initial = quiz as QuizInitial;
    const { data: links } = await supabase.from('quiz_questions').select('question_id,position').eq('quiz_id', id).order('position');
    const ids = ((links ?? []) as Array<{ question_id: string }>).map((l) => l.question_id);
    if (ids.length) {
      const { data: qs } = await supabase.from('questions').select('id,body,type,difficulty,unit_id,units(number)').in('id', ids);
      const byId = new Map(((qs ?? []) as unknown as Array<{ id: string; body: string; type: QuestionType; difficulty: Difficulty; unit_id: string | null; units: { number: number } | { number: number }[] | null }>).map((q) => [q.id, q]));
      selected = ids.flatMap((qid) => {
        const q = byId.get(qid);
        if (!q) return [];
        const u = Array.isArray(q.units) ? q.units[0] : q.units;
        return [{ id: q.id, body: q.body, type: q.type, difficulty: q.difficulty, unit_id: q.unit_id, unit_number: u?.number ?? null }];
      });
    }
  }
  if (subjectList.length === 0) notFound();

  return (
    <div className="animate-fade-up">
      <QuizBuilder initial={initial} selected={selected} subjects={subjectList} units={(units ?? []) as Array<{ id: string; subject_id: string; number: number; title: string }>} />
    </div>
  );
}
