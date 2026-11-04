'use client';
import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Field } from '@/components/forms/field';
import { FormError } from '@/components/forms/form-error';
import { MathText } from '@/components/quiz/math-text';
import { saveQuizAction } from '@/lib/actions/admin';
import { searchBankAction, type BankQuestion } from '@/lib/actions/admin-queries';
import { quizSchema } from '@/lib/validators/admin';
import { DIFFICULTY_LABEL, QUESTION_TYPE_LABEL } from '@/lib/registry';
import { cn } from '@/lib/utils';

type Opt = { id: string; title: string };
type UnitOpt = { id: string; subject_id: string; number: number; title: string };
export interface QuizInitial {
  id?: string; title: string; description: string; subject_id: string; unit_id: string | null; mode: 'practice' | 'exam';
  time_limit_minutes: number | null; pass_percentage: number; shuffle_questions: boolean; is_published: boolean;
}

export function QuizBuilder({ initial, selected: initialSelected, subjects, units }: { initial: QuizInitial; selected: BankQuestion[]; subjects: Opt[]; units: UnitOpt[] }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [timed, setTimed] = useState(initial.time_limit_minutes != null);
  const [selected, setSelected] = useState<BankQuestion[]>(initialSelected);
  const [error, setError] = useState<string | null>(null);
  const [saving, start] = useTransition();
  const set = <K extends keyof QuizInitial>(k: K, v: QuizInitial[K]) => setF((s) => ({ ...s, [k]: v }));

  // question bank panel
  const [bankUnit, setBankUnit] = useState('');
  const [bankDiff, setBankDiff] = useState('');
  const [bankQ, setBankQ] = useState('');
  const [bank, setBank] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!f.subject_id) return;
    let alive = true;
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await searchBankAction({ subjectId: f.subject_id, unitId: bankUnit || null, difficulty: bankDiff || null, q: bankQ || null });
      if (!alive) return;
      setLoading(false);
      if (res.ok) setBank(res.data ?? []);
      else toast.error(res.error);
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [f.subject_id, bankUnit, bankDiff, bankQ]);

  const has = new Set(selected.map((s) => s.id));
  const unitOptions = units.filter((u) => u.subject_id === f.subject_id);
  const move = (i: number, d: number) => setSelected((s) => { const n = [...s]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); return n; });

  function save() {
    setError(null);
    const payload = { ...f, time_limit_minutes: timed ? Number(f.time_limit_minutes ?? 10) : null, question_ids: selected.map((s) => s.id) };
    const parsed = quizSchema.safeParse(payload);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Check the form.');
    start(async () => {
      const res = await saveQuizAction(payload);
      if (!res.ok) return setError(res.error);
      toast.success(res.message ?? 'Saved');
      router.push('/admin/quizzes');
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="icon-sm" aria-label="Back to quizzes"><Link href="/admin/quizzes"><ArrowLeft /></Link></Button>
        <h1 className="flex-1 text-xl font-bold tracking-tight">{initial.id ? 'Edit quiz' : 'New quiz'}</h1>
        <Button variant="outline" asChild><Link href="/admin/quizzes">Cancel</Link></Button>
        <Button onClick={save} loading={saving}>Save quiz</Button>
      </div>
      <FormError message={error} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardContent className="space-y-4">
          <h2 className="text-base font-semibold">Settings</h2>
          <Field label="Title" htmlFor="z-title"><Input id="z-title" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Functions — practice quiz" /></Field>
          <Field label="Description" htmlFor="z-desc" optional><Textarea id="z-desc" rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Subject" htmlFor="z-subject"><NativeSelect id="z-subject" value={f.subject_id} onChange={(e) => { set('subject_id', e.target.value); set('unit_id', null); setBankUnit(''); }}>{subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</NativeSelect></Field>
            <Field label="Unit" htmlFor="z-unit" optional hint="Shows on the unit’s Practice quiz tab."><NativeSelect id="z-unit" value={f.unit_id ?? ''} onChange={(e) => set('unit_id', e.target.value || null)}><option value="">Whole subject</option>{unitOptions.map((u) => <option key={u.id} value={u.id}>Unit {u.number}: {u.title}</option>)}</NativeSelect></Field>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Mode</legend>
            <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup">
              {([['practice', 'Practice', 'Instant feedback and explanations after each question.'], ['exam', 'Exam', 'Answers and explanations only after submitting.']] as const).map(([v, l, d]) => (
                <button key={v} type="button" role="radio" aria-checked={f.mode === v} onClick={() => set('mode', v)} className={cn('rounded-lg border p-3 text-left transition-colors', f.mode === v ? 'border-primary bg-primary-soft' : 'hover:bg-muted/60')}>
                  <span className="block text-sm font-semibold">{l}</span><span className="mt-0.5 block text-xs text-muted-foreground">{d}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pass mark (%)" htmlFor="z-pass"><Input id="z-pass" type="number" inputMode="numeric" min={0} max={100} value={f.pass_percentage} onChange={(e) => set('pass_percentage', Number(e.target.value))} /></Field>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between"><label htmlFor="z-time" className="text-sm font-medium">Time limit</label><Switch checked={timed} onCheckedChange={(v) => { setTimed(v); if (v && !f.time_limit_minutes) set('time_limit_minutes', 10); }} aria-label="Enable time limit" /></div>
              <Input id="z-time" type="number" inputMode="numeric" min={1} max={360} disabled={!timed} value={timed ? (f.time_limit_minutes ?? 10) : ''} placeholder="No limit" onChange={(e) => set('time_limit_minutes', Number(e.target.value))} aria-label="Time limit in minutes" />
              {timed && <p className="text-xs text-muted-foreground">Minutes. Enforced by the server.</p>}
            </div>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-lg border p-3.5"><span><span className="block text-sm font-medium">Shuffle question order</span><span className="block text-xs text-muted-foreground">Each attempt gets a different order.</span></span><Switch checked={f.shuffle_questions} onCheckedChange={(v) => set('shuffle_questions', v)} aria-label="Shuffle questions" /></label>
          <label className="flex items-center justify-between gap-4 rounded-lg border p-3.5"><span><span className="block text-sm font-medium">Published</span><span className="block text-xs text-muted-foreground">Visible to students. Needs at least one question.</span></span><Switch checked={f.is_published} onCheckedChange={(v) => set('is_published', v)} aria-label="Published" /></label>
        </CardContent></Card>

        <div className="space-y-6">
          <Card><CardContent>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold">Quiz questions</h2><Badge variant="default">{selected.length}</Badge></div>
            {selected.length === 0 ? (
              <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">No questions yet. Add some from the question bank below.</p>
            ) : (
              <ol className="max-h-96 space-y-2 overflow-y-auto pr-1">
                {selected.map((s, i) => (
                  <li key={s.id} className="flex items-start gap-2 rounded-lg border bg-background p-2.5">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary-soft text-xs font-bold text-primary">{i + 1}</span>
                    <p className="min-w-0 flex-1 text-sm"><span className="line-clamp-2"><MathText text={s.body} /></span></p>
                    <div className="flex shrink-0">
                      <Button variant="ghost" size="icon-sm" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp /></Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Move down" disabled={i === selected.length - 1} onClick={() => move(i, 1)}><ArrowDown /></Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Remove question" onClick={() => setSelected((x) => x.filter((y) => y.id !== s.id))}><X /></Button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent></Card>

          <Card><CardContent>
            <h2 className="mb-3 text-base font-semibold">Add from question bank</h2>
            <div className="mb-3 grid gap-2.5 sm:grid-cols-[1fr_8rem_8rem]">
              <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={bankQ} onChange={(e) => setBankQ(e.target.value)} placeholder="Search…" className="pl-9" aria-label="Search question bank" /></div>
              <NativeSelect aria-label="Unit filter" value={bankUnit} onChange={(e) => setBankUnit(e.target.value)}><option value="">All units</option>{unitOptions.map((u) => <option key={u.id} value={u.id}>Unit {u.number}</option>)}</NativeSelect>
              <NativeSelect aria-label="Difficulty filter" value={bankDiff} onChange={(e) => setBankDiff(e.target.value)}><option value="">Any level</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></NativeSelect>
            </div>
            <div className="max-h-96 overflow-y-auto rounded-lg border" aria-busy={loading}>
              {bank.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">{loading ? 'Loading…' : 'No questions match. Create questions in the Question bank first.'}</p>
              ) : (
                <ul className="divide-y">
                  {bank.map((b) => (
                    <li key={b.id} className="flex items-start gap-3 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm"><MathText text={b.body} /></p>
                        <p className="mt-1 text-xs text-muted-foreground">{QUESTION_TYPE_LABEL[b.type]} · {DIFFICULTY_LABEL[b.difficulty]}{b.unit_number ? ` · Unit ${b.unit_number}` : ''}</p>
                      </div>
                      <Button variant={has.has(b.id) ? 'ghost' : 'outline'} size="sm" disabled={has.has(b.id)} onClick={() => setSelected((s) => [...s, b])}>{has.has(b.id) ? 'Added' : <><Plus /> Add</>}</Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {bank.length > 0 && (
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setSelected((s) => [...s, ...bank.filter((b) => !has.has(b.id))])}>Add all shown ({bank.filter((b) => !has.has(b.id)).length})</Button>
            )}
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}
