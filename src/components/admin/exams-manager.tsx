'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, Pencil, Plus, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Field } from '@/components/forms/field';
import { FormError } from '@/components/forms/form-error';
import { PublishSwitch } from './ui';
import { DeleteExamButton } from './delete-buttons';
import { saveExamAction } from '@/lib/actions/admin';
import { examSchema } from '@/lib/validators/admin';
import { EXAM_KIND_LABEL } from '@/lib/registry';
import type { ExamKind } from '@/lib/types';

type Opt = { id: string; title: string };
type UnitOpt = { id: string; subject_id: string; number: number; title: string };
export interface AdminExam {
  id: string; title: string; description: string; kind: ExamKind; subject_id: string | null; question_count: number; duration_minutes: number;
  pass_percentage: number; is_published: boolean; is_demo: boolean; unit_ids: string[]; pool: number;
}

const KIND_HELP: Record<ExamKind, string> = {
  unit: 'Random questions from one unit.',
  subject: 'Random questions from every unit of a subject.',
  mixed: 'Random questions from units you pick, across subjects.',
  mock: 'A full-length mock drawn from a whole subject.',
};

export function ExamsManager({ exams, subjects, units }: { exams: AdminExam[]; subjects: Opt[]; units: UnitOpt[] }) {
  const [editing, setEditing] = useState<AdminExam | 'new' | null>(null);
  return (
    <div>
      <div className="mb-5 flex justify-end"><Button onClick={() => setEditing('new')} disabled={subjects.length === 0}><Plus /> New exam</Button></div>
      {exams.length === 0 ? (
        <EmptyState icon={<ClipboardCheck />} title="No exams yet" description="Exams pick random questions from the question bank and run against a server-side countdown." action={subjects.length ? <Button onClick={() => setEditing('new')}><Plus /> New exam</Button> : undefined} />
      ) : (
        <ul className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
          {exams.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b p-4 last:border-b-0 sm:px-5">
              <div className="min-w-0 flex-1 basis-60">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">{e.title}<Badge variant="violet">{EXAM_KIND_LABEL[e.kind]}</Badge>{e.is_demo && <Badge variant="warning">Demo</Badge>}</p>
                <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{e.question_count} questions</span>
                  <span className="inline-flex items-center gap-1"><Timer className="size-3" />{e.duration_minutes} min</span>
                  <span>Pass {e.pass_percentage}%</span>
                  <span className={e.pool < e.question_count ? 'font-medium text-warning' : ''}>{e.pool} in pool{e.pool < e.question_count ? ' (fewer than requested)' : ''}</span>
                </p>
              </div>
              <PublishSwitch table="exams" id={e.id} published={e.is_published} label={e.title} />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" aria-label={`Edit ${e.title}`} onClick={() => setEditing(e)}><Pencil /></Button>
                <DeleteExamButton id={e.id} title={e.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && <ExamDialog key={editing === 'new' ? 'new' : editing.id} exam={editing === 'new' ? null : editing} subjects={subjects} units={units} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ExamDialog({ exam, subjects, units, onClose }: { exam: AdminExam | null; subjects: Opt[]; units: UnitOpt[]; onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, start] = useTransition();
  const [f, setF] = useState({
    title: exam?.title ?? '', description: exam?.description ?? '', kind: (exam?.kind ?? 'subject') as ExamKind,
    subject_id: exam?.subject_id ?? subjects[0]?.id ?? '', unit_ids: exam?.unit_ids ?? ([] as string[]),
    question_count: exam?.question_count ?? 20, duration_minutes: exam?.duration_minutes ?? 30, pass_percentage: exam?.pass_percentage ?? 50, is_published: exam?.is_published ?? false,
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const needsSubject = f.kind === 'subject' || f.kind === 'mock' || f.kind === 'unit';
  const needsUnits = f.kind === 'unit' || f.kind === 'mixed';
  const unitList = f.kind === 'mixed' ? units : units.filter((u) => u.subject_id === f.subject_id);
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.title ?? '';

  function toggleUnit(id: string) {
    if (f.kind === 'unit') return set('unit_ids', [id]);
    set('unit_ids', f.unit_ids.includes(id) ? f.unit_ids.filter((x) => x !== id) : [...f.unit_ids, id]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = { id: exam?.id, ...f, subject_id: needsSubject ? f.subject_id : null, unit_ids: needsUnits ? f.unit_ids : [] };
    const parsed = examSchema.safeParse(payload);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Check the form.');
    start(async () => {
      const res = await saveExamAction(payload);
      if (!res.ok) return setError(res.error);
      toast.success(res.message ?? 'Saved');
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>{exam ? 'Edit exam' : 'New exam'}</DialogTitle><DialogDescription>Each student gets a different random selection and order. The countdown is kept on the server.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormError message={error} />
          <Field label="Title" htmlFor="e-title"><Input id="e-title" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Physics — mock exam" /></Field>
          <Field label="Description" htmlFor="e-desc" optional><Textarea id="e-desc" rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} /></Field>
          <Field label="Exam type" htmlFor="e-kind" hint={KIND_HELP[f.kind]}>
            <NativeSelect id="e-kind" value={f.kind} onChange={(e) => { set('kind', e.target.value as ExamKind); set('unit_ids', []); }}>{(Object.keys(EXAM_KIND_LABEL) as ExamKind[]).map((k) => <option key={k} value={k}>{EXAM_KIND_LABEL[k]}</option>)}</NativeSelect>
          </Field>
          {needsSubject && (
            <Field label="Subject" htmlFor="e-subject"><NativeSelect id="e-subject" value={f.subject_id} onChange={(e) => { set('subject_id', e.target.value); set('unit_ids', []); }}>{subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</NativeSelect></Field>
          )}
          {needsUnits && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium">{f.kind === 'unit' ? 'Unit' : 'Units to draw from'}</legend>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
                {unitList.length === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">No units available.</p>}
                {unitList.map((u) => (
                  <label key={u.id} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-muted/60">
                    <Checkbox checked={f.unit_ids.includes(u.id)} onCheckedChange={() => toggleUnit(u.id)} aria-label={`Unit ${u.number}: ${u.title}`} />
                    <span className="text-sm">{f.kind === 'mixed' && <span className="text-muted-foreground">{subjectName(u.subject_id)} · </span>}Unit {u.number}: {u.title}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Questions" htmlFor="e-count"><Input id="e-count" type="number" inputMode="numeric" min={1} max={200} value={f.question_count} onChange={(e) => set('question_count', Number(e.target.value))} /></Field>
            <Field label="Minutes" htmlFor="e-dur"><Input id="e-dur" type="number" inputMode="numeric" min={1} max={360} value={f.duration_minutes} onChange={(e) => set('duration_minutes', Number(e.target.value))} /></Field>
            <Field label="Pass %" htmlFor="e-pass"><Input id="e-pass" type="number" inputMode="numeric" min={0} max={100} value={f.pass_percentage} onChange={(e) => set('pass_percentage', Number(e.target.value))} /></Field>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-lg border p-3.5"><span><span className="block text-sm font-medium">Published</span><span className="block text-xs text-muted-foreground">Visible on the Exams page.</span></span><Switch checked={f.is_published} onCheckedChange={(v) => set('is_published', v)} aria-label="Published" /></label>
          <DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" loading={saving}>{exam ? 'Save changes' : 'Create exam'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
