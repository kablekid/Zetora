'use client';
import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Check, HelpCircle, Pencil, Plus, Search, X } from 'lucide-react';
import { toast } from '@/lib/toast';
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
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/client';
import { Rich } from '@/i18n/rich';
import type { QuestionAdminRow, QuestionType } from '@/lib/types';

const QUESTION_TYPES: QuestionType[] = ['multiple_choice', 'true_false', 'multiple_select', 'short_answer'];

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
  const t = useT('admin');
  const tc = useT('common');
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
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('questions.searchPlaceholder')} className="ps-9" aria-label={t('questions.searchLabel')} />
          </form>
          <Button onClick={() => setEditing('new')} disabled={subjects.length === 0}><Plus /> {t('questions.newQuestion')}</Button>
        </div>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          <NativeSelect aria-label={t('questions.subject')} value={filters.subject} onChange={(e) => setFilter('subject', e.target.value)}><option value="">{t('questions.allSubjects')}</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</NativeSelect>
          <NativeSelect aria-label={t('questions.unit')} value={filters.unit} onChange={(e) => setFilter('unit', e.target.value)}><option value="">{t('questions.allUnits')}</option>{unitsForFilter.map((u) => <option key={u.id} value={u.id}>{t('ui.unitLine', { n: u.number, title: u.title })}</option>)}</NativeSelect>
          <NativeSelect aria-label={t('questions.difficulty')} value={filters.difficulty} onChange={(e) => setFilter('difficulty', e.target.value)}><option value="">{t('questions.anyDifficulty')}</option><option value="easy">{tc('difficulty.easy')}</option><option value="medium">{tc('difficulty.medium')}</option><option value="hard">{tc('difficulty.hard')}</option></NativeSelect>
          <NativeSelect aria-label={t('questions.questionType')} value={filters.type} onChange={(e) => setFilter('type', e.target.value)}><option value="">{t('questions.anyType')}</option>{QUESTION_TYPES.map((k) => <option key={k} value={k}>{tc(`questionType.${k}`)}</option>)}</NativeSelect>
        </div>
        <p className="text-sm text-muted-foreground">{t('questions.total', { count: total })}</p>
      </div>

      {questions.length === 0 ? (
        <EmptyState icon={<HelpCircle />} title={t('questions.emptyTitle')} description={subjects.length === 0 ? t('questions.emptyNoSubject') : t('questions.emptyBody')} action={subjects.length > 0 ? <Button onClick={() => setEditing('new')}><Plus /> {t('questions.newQuestion')}</Button> : undefined} />
      ) : (
        <ul className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
          {questions.map((qu) => (
            <li key={qu.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 border-b p-4 last:border-b-0 sm:px-5">
              <div className="min-w-0 flex-1 basis-72">
                <p className="line-clamp-2 text-sm font-medium"><MathText text={qu.body} /></p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge variant="default">{tc(`questionType.${qu.type}`)}</Badge>
                  <Badge variant={qu.difficulty === 'easy' ? 'success' : qu.difficulty === 'hard' ? 'destructive' : 'warning'}>{tc(`difficulty.${qu.difficulty}`)}</Badge>
                  <Badge variant="muted">{qu.units ? t('questions.tagUnit', { subject: qu.subjects?.title ?? '', n: qu.units.number }) : qu.subjects?.title}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" aria-label={t('questions.editAria')} onClick={() => setEditing(qu)}><Pencil /></Button>
                <ConfirmDelete title={t('questions.deleteTitle')} description={t('questions.deleteBody')} onConfirm={() => run(() => deleteQuestionAction(qu.id))} />
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
  const t = useT('admin');
  const tc = useT('common');
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
    if (next === 'true_false') setOptions([{ body: t('questions.dialog.trueText'), is_correct: true }, { body: t('questions.dialog.falseText'), is_correct: false }]);
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
  const topicOptions = topics.filter((tp) => tp.unit_id === unitId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      id: question?.id, subject_id: subjectId, unit_id: unitId || null, topic_id: topicId || null, type, body, explanation, difficulty,
      options: type === 'short_answer' ? [] : options.filter((o) => o.body.trim()),
      accepted_answers: type === 'short_answer' ? accepted.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : [],
    };
    const parsed = questionSchema.safeParse(payload);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? t('settings.checkForm'));
    start(async () => {
      const res = await saveQuestionAction(payload);
      if (!res.ok) return setError(res.error);
      toast.success(res.message ?? t('ui.saved'));
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{question ? t('questions.dialog.editTitle') : t('questions.dialog.newTitle')}</DialogTitle>
          <DialogDescription><Rich text={t('questions.dialog.description')} tags={{ code: (c) => <code className="rounded bg-muted px-1">{c}</code> }} /></DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormError message={error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('questions.subject')} htmlFor="q-subject"><NativeSelect id="q-subject" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setUnitId(''); setTopicId(''); }}>{subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</NativeSelect></Field>
            <Field label={t('questions.unit')} htmlFor="q-unit" optional><NativeSelect id="q-unit" value={unitId} onChange={(e) => { setUnitId(e.target.value); setTopicId(''); }}><option value="">{t('questions.dialog.noUnit')}</option>{unitOptions.map((u) => <option key={u.id} value={u.id}>{t('ui.unitLine', { n: u.number, title: u.title })}</option>)}</NativeSelect></Field>
            <Field label={t('questions.dialog.topic')} htmlFor="q-topic" optional hint={unitId && topicOptions.length === 0 ? t('questions.dialog.topicHint') : undefined}><NativeSelect id="q-topic" value={topicId} onChange={(e) => setTopicId(e.target.value)} disabled={!unitId}><option value="">{t('questions.dialog.noTopic')}</option>{topicOptions.map((tp) => <option key={tp.id} value={tp.id}>{tp.title}</option>)}</NativeSelect></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('questions.dialog.type')} htmlFor="q-type"><NativeSelect id="q-type" value={type} onChange={(e) => changeType(e.target.value as QuestionType)}>{QUESTION_TYPES.map((k) => <option key={k} value={k}>{tc(`questionType.${k}`)}</option>)}</NativeSelect></Field>
              <Field label={t('questions.difficulty')} htmlFor="q-diff"><NativeSelect id="q-diff" value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}><option value="easy">{tc('difficulty.easy')}</option><option value="medium">{tc('difficulty.medium')}</option><option value="hard">{tc('difficulty.hard')}</option></NativeSelect></Field>
            </div>
          </div>
          <Field label={t('questions.dialog.question')} htmlFor="q-body"><Textarea id="q-body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder={t('questions.dialog.questionPlaceholder')} /></Field>
          {body.includes('$') && <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm"><span className="text-xs text-muted-foreground">{t('questions.dialog.preview')} </span><MathText text={body} /></p>}

          {type === 'short_answer' ? (
            <Field label={t('questions.dialog.accepted')} htmlFor="q-acc" hint={t('questions.dialog.acceptedHint')}>
              <Textarea id="q-acc" rows={3} value={accepted} onChange={(e) => setAccepted(e.target.value)} placeholder={t('questions.dialog.acceptedPlaceholder')} />
            </Field>
          ) : (
            <fieldset>
              <legend className="mb-2 text-sm font-medium">{t('questions.dialog.options')} <span className="font-normal text-muted-foreground">— {single ? t('questions.dialog.tickOne') : t('questions.dialog.tickMany')}</span></legend>
              <ul className="space-y-2">
                {options.map((o, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <button type="button" role={single ? 'radio' : 'checkbox'} aria-checked={o.is_correct} aria-label={t('questions.dialog.markCorrect', { n: i + 1 })} onClick={() => setCorrect(i)}
                      className={cn('flex size-10 shrink-0 items-center justify-center border-2 transition-colors', single ? 'rounded-full' : 'rounded-lg', o.is_correct ? 'border-success bg-success text-white' : 'border-input text-transparent hover:border-success/60')}>
                      <Check className="size-4" strokeWidth={3} />
                    </button>
                    <Input value={o.body} onChange={(e) => setOptions((all) => all.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} placeholder={t('questions.dialog.optionPlaceholder', { letter: String.fromCharCode(65 + i) })} aria-label={t('questions.dialog.optionText', { n: i + 1 })} readOnly={type === 'true_false'} />
                    {type !== 'true_false' && options.length > 2 && (
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={t('questions.dialog.removeOption', { n: i + 1 })} onClick={() => setOptions((all) => all.filter((_, j) => j !== i))}><X /></Button>
                    )}
                  </li>
                ))}
              </ul>
              {type !== 'true_false' && options.length < 8 && (
                <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setOptions((o) => [...o, { body: '', is_correct: false }])}><Plus /> {t('questions.dialog.addOption')}</Button>
              )}
            </fieldset>
          )}
          <Field label={t('questions.dialog.explanation')} htmlFor="q-exp" optional hint={t('questions.dialog.explanationHint')}>
            <Textarea id="q-exp" rows={2} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
          </Field>
          <DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={saving}>{tc('actions.cancel')}</Button><Button type="submit" loading={saving}>{question ? tc('actions.saveChanges') : t('questions.dialog.create')}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
