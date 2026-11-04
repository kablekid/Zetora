'use client';
import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Check, HelpCircle, Pencil, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { Field } from '@/components/forms/field';
import { FormError } from '@/components/forms/form-error';
import { MathText } from '@/components/quiz/math-text';
import { ConfirmDelete, useRunAction } from './ui';
import { deleteQuestionAction, saveQuestionAction } from '@/lib/actions/admin';
import { questionSchema } from '@/lib/validators/admin';
import { DIFFICULTY_LABEL, QUESTION_TYPE_LABEL } from '@/lib/registry';
import { cn } from '@/lib/utils';
import type { QuestionAdminRow, QuestionType } from '@/lib/types';

type Opt = { id: string; title: string };
type UnitOpt = { id: string; subject_id: string; number: number; title: string };
type TopicOpt = { id: string; unit_id: string; title: string };
interface Props {
  questions: QuestionAdminRow[]; subjects: Opt[]; units: UnitOpt[]; topics: TopicOpt[];
  filters: { q: string; subject: string; unit: string; difficulty: string; type: string };
  total: number;
}

export function QuestionsManager({ questions, subjects, units, topics, filters, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { run } = useRunAction();
  const [editing, setEditing] = useState<QuestionAdminRow | 'new' | null>(null);
  const [q, setQ] = useState(filters.q);

  function setFilter(k: string, v: string) {
    const p = new URLSearchParams(sp.toString());
    if (v) p.set(k, v); else p.delete(k);
    if (k === 'subject') p.delete('unit');
    p.delete('page');
    router.push(`${pathname}?${p}`);
  }
  const unitsForFilter = units.filter((u) => !filters.subject || u.subject_id === filters.subject);

  return (
    <div>
      <div className="mb-5 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <form className="relative flex-1" onSubmit={(e) => { e.preventDefault(); setFilter('q', q.trim()); }} role="search">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search question text…" className="pl-9" aria-label="Search questions" />
          </form>
          <Button onClick={() => setEditing('new')} disabled={subjects.length === 0}><Plus /> New question</Button>
        </div>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          <NativeSelect aria-label="Subject" value={filters.subject} onChange={(e) => setFilter('subject', e.target.value)}><option value="">All subjects</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</NativeSelect>
          <NativeSelect aria-label="Unit" value={filters.unit} onChange={(e) => setFilter('unit', e.target.value)}><option value="">All units</option>{unitsForFilter.map((u) => <option key={u.id} value={u.id}>Unit {u.number}: {u.title}</option>)}</NativeSelect>
          <NativeSelect aria-label="Difficulty" value={filters.difficulty} onChange={(e) => setFilter('difficulty', e.target.value)}><option value="">Any difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></NativeSelect>
          <NativeSelect aria-label="Question type" value={filters.type} onChange={(e) => setFilter('type', e.target.value)}><option value="">Any type</option>{Object.entries(QUESTION_TYPE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</NativeSelect>
        </div>
        <p className="text-sm text-muted-foreground">{total.toLocaleString('en')} {total === 1 ? 'question' : 'questions'}</p>
      </div>

      {questions.length === 0 ? (
        <EmptyState icon={<HelpCircle />} title="No questions found" description={subjects.length === 0 ? 'Create a subject first.' : 'Create a question, or adjust the filters.'} action={subjects.length > 0 ? <Button onClick={() => setEditing('new')}><Plus /> New question</Button> : undefined} />
      ) : (
        <ul className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
          {questions.map((qu) => (
            <li key={qu.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 border-b p-4 last:border-b-0 sm:px-5">
              <div className="min-w-0 flex-1 basis-72">
                <p className="line-clamp-2 text-sm font-medium"><MathText text={qu.body} /></p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge variant="default">{QUESTION_TYPE_LABEL[qu.type]}</Badge>
                  <Badge variant={qu.difficulty === 'easy' ? 'success' : qu.difficulty === 'hard' ? 'destructive' : 'warning'}>{DIFFICULTY_LABEL[qu.difficulty]}</Badge>
                  <Badge variant="muted">{qu.subjects?.title}{qu.units ? ` · Unit ${qu.units.number}` : ''}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" aria-label="Edit question" onClick={() => setEditing(qu)}><Pencil /></Button>
                <ConfirmDelete title="Delete this question?" description="It will be removed from every quiz that uses it. Past results keep their scores." onConfirm={() => run(() => deleteQuestionAction(qu.id))} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && <QuestionDialog key={editing === 'new' ? 'new' : editing.id} question={editing === 'new' ? null : editing} subjects={subjects} units={units} topics={topics} defaults={{ subject: filters.subject || subjects[0]?.id, unit: filters.unit }} onClose={() => setEditing(null)} />}
    </div>
  );
}

type OptState = { id?: string; body: string; is_correct: boolean };

function QuestionDialog({ question, subjects, units, topics, defaults, onClose }: {
  question: QuestionAdminRow | null; subjects: Opt[]; units: UnitOpt[]; topics: TopicOpt[]; defaults: { subject?: string; unit?: string }; onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, start] = useTransition();
  const [subjectId, setSubjectId] = useState(question?.subject_id ?? defaults.subject ?? '');
  const [unitId, setUnitId] = useState(question?.unit_id ?? defaults.unit ?? '');
  const [topicId, setTopicId] = useState(question?.topic_id ?? '');
  const [type, setType] = useState<QuestionType>(question?.type ?? 'multiple_choice');
  const [difficulty, setDifficulty] = useState(question?.difficulty ?? 'medium');
  const [body, setBody] = useState(question?.body ?? '');
  const [explanation, setExplanation] = useState(question?.explanation ?? '');
  const [accepted, setAccepted] = useState((question?.accepted_answers ?? []).join('\n'));
  const [options, setOptions] = useState<OptState[]>(() =>
    question?.question_options?.length
      ? [...question.question_options].sort((a, b) => a.position - b.position).map((o) => ({ id: o.id, body: o.body, is_correct: o.is_correct }))
      : [{ body: '', is_correct: true }, { body: '', is_correct: false }, { body: '', is_correct: false }, { body: '', is_correct: false }],
  );

  function changeType(next: QuestionType) {
    setType(next);
    if (next === 'true_false') setOptions([{ body: 'True', is_correct: true }, { body: 'False', is_correct: false }]);
    else if (type === 'true_false') setOptions([{ body: '', is_correct: true }, { body: '', is_correct: false }, { body: '', is_correct: false }, { body: '', is_correct: false }]);
    else if (next === 'multiple_choice') {
      // keep only the first correct answer
      let seen = false;
      setOptions((o) => o.map((x) => { const keep = x.is_correct && !seen; if (x.is_correct) seen = true; return { ...x, is_correct: keep }; }));
    }
  }
  const single = type === 'multiple_choice' || type === 'true_false';
  const setCorrect = (i: number) => setOptions((o) => o.map((x, j) => (single ? { ...x, is_correct: j === i } : j === i ? { ...x, is_correct: !x.is_correct } : x)));
  const unitOptions = units.filter((u) => u.subject_id === subjectId);
  const topicOptions = topics.filter((t) => t.unit_id === unitId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      id: question?.id, subject_id: subjectId, unit_id: unitId || null, topic_id: topicId || null, type, body, explanation, difficulty,
      options: type === 'short_answer' ? [] : options.filter((o) => o.body.trim()),
      accepted_answers: type === 'short_answer' ? accepted.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : [],
    };
    const parsed = questionSchema.safeParse(payload);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Check the form.');
    start(async () => {
      const res = await saveQuestionAction(payload);
      if (!res.ok) return setError(res.error);
      toast.success(res.message ?? 'Saved');
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{question ? 'Edit question' : 'New question'}</DialogTitle>
          <DialogDescription>Wrap maths in dollar signs, e.g. <code className="rounded bg-muted px-1">$x^2 + 1$</code>. Students never see correct answers until they answer or submit.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormError message={error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Subject" htmlFor="q-subject"><NativeSelect id="q-subject" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setUnitId(''); setTopicId(''); }}>{subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</NativeSelect></Field>
            <Field label="Unit" htmlFor="q-unit" optional><NativeSelect id="q-unit" value={unitId} onChange={(e) => { setUnitId(e.target.value); setTopicId(''); }}><option value="">No specific unit</option>{unitOptions.map((u) => <option key={u.id} value={u.id}>Unit {u.number}: {u.title}</option>)}</NativeSelect></Field>
            <Field label="Topic" htmlFor="q-topic" optional hint={unitId && topicOptions.length === 0 ? 'Add topics to the unit to tag questions.' : undefined}><NativeSelect id="q-topic" value={topicId} onChange={(e) => setTopicId(e.target.value)} disabled={!unitId}><option value="">No specific topic</option>{topicOptions.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</NativeSelect></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type" htmlFor="q-type"><NativeSelect id="q-type" value={type} onChange={(e) => changeType(e.target.value as QuestionType)}>{Object.entries(QUESTION_TYPE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</NativeSelect></Field>
              <Field label="Difficulty" htmlFor="q-diff"><NativeSelect id="q-diff" value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></NativeSelect></Field>
            </div>
          </div>
          <Field label="Question" htmlFor="q-body"><Textarea id="q-body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write the question…" /></Field>
          {body.includes('$') && <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm"><span className="text-xs text-muted-foreground">Preview: </span><MathText text={body} /></p>}

          {type === 'short_answer' ? (
            <Field label="Accepted answers" htmlFor="q-acc" hint="One per line. Matching ignores capital letters and extra spaces.">
              <Textarea id="q-acc" rows={3} value={accepted} onChange={(e) => setAccepted(e.target.value)} placeholder={'ribosome\nribosomes'} />
            </Field>
          ) : (
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Answer options <span className="font-normal text-muted-foreground">— {single ? 'tick the correct one' : 'tick all correct ones'}</span></legend>
              <ul className="space-y-2">
                {options.map((o, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <button type="button" role={single ? 'radio' : 'checkbox'} aria-checked={o.is_correct} aria-label={`Mark option ${i + 1} as correct`} onClick={() => setCorrect(i)}
                      className={cn('flex size-10 shrink-0 items-center justify-center border-2 transition-colors', single ? 'rounded-full' : 'rounded-lg', o.is_correct ? 'border-success bg-success text-white' : 'border-input text-transparent hover:border-success/60')}>
                      <Check className="size-4" strokeWidth={3} />
                    </button>
                    <Input value={o.body} onChange={(e) => setOptions((all) => all.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} placeholder={`Option ${String.fromCharCode(65 + i)}`} aria-label={`Option ${i + 1} text`} readOnly={type === 'true_false'} />
                    {type !== 'true_false' && options.length > 2 && (
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove option ${i + 1}`} onClick={() => setOptions((all) => all.filter((_, j) => j !== i))}><X /></Button>
                    )}
                  </li>
                ))}
              </ul>
              {type !== 'true_false' && options.length < 8 && (
                <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setOptions((o) => [...o, { body: '', is_correct: false }])}><Plus /> Add option</Button>
              )}
            </fieldset>
          )}
          <Field label="Explanation" htmlFor="q-exp" optional hint="Shown after the student answers (practice) or submits (exam).">
            <Textarea id="q-exp" rows={2} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
          </Field>
          <DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" loading={saving}>{question ? 'Save changes' : 'Create question'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
