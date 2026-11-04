'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { FileText, Layers, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Field } from '@/components/forms/field';
import { FormError } from '@/components/forms/form-error';
import { ConfirmDelete, PublishSwitch, ReorderButtons, useRunAction } from './ui';
import { deleteUnitAction, saveUnitAction } from '@/lib/actions/admin';
import { unitSchema, splitLines, type UnitInput } from '@/lib/validators/admin';

export interface AdminUnit {
  id: string; subject_id: string; number: number; position: number; title: string; description: string; introduction: string;
  objectives: string[]; key_concepts: string[]; estimated_minutes: number; is_published: boolean; is_demo: boolean;
  topics: string[]; summary_status: 'none' | 'draft' | 'published';
}

interface FormValues {
  id?: string; subject_id: string; number: number; title: string; description: string; introduction: string;
  objectives: string; key_concepts: string; topics: string; estimated_minutes: number; is_published: boolean;
}

export function UnitsManager({ subjects, subjectId, units }: { subjects: { id: string; title: string }[]; subjectId: string; units: AdminUnit[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminUnit | 'new' | null>(null);
  const { run } = useRunAction();
  const ids = units.map((u) => u.id);
  const nextNumber = units.reduce((m, u) => Math.max(m, u.number), 0) + 1;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-72">
          <label htmlFor="subject-filter" className="sr-only">Subject</label>
          <NativeSelect id="subject-filter" value={subjectId} onChange={(e) => router.push(`/admin/units?subject=${e.target.value}`)}>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </NativeSelect>
        </div>
        <Button onClick={() => setEditing('new')}><Plus /> New unit</Button>
      </div>

      {units.length === 0 ? (
        <EmptyState icon={<Layers />} title="No units in this subject" description="Units hold the summary, materials and quizzes students study." action={<Button onClick={() => setEditing('new')}><Plus /> New unit</Button>} />
      ) : (
        <ul className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
          {units.map((u, i) => (
            <li key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b p-4 last:border-b-0 sm:px-5">
              <ReorderButtons table="units" ids={ids} index={i} />
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-bold text-primary">{u.number}</span>
              <div className="min-w-0 flex-1 basis-52">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">{u.title}{u.is_demo && <Badge variant="warning">Demo</Badge>}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{u.estimated_minutes} min</span>
                  <span>{u.topics.length} {u.topics.length === 1 ? 'topic' : 'topics'}</span>
                  <Link href={`/admin/summaries/${u.id}`} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                    <FileText className="size-3" />{u.summary_status === 'none' ? 'Write summary' : u.summary_status === 'draft' ? 'Summary (draft)' : 'Summary (published)'}
                  </Link>
                </p>
              </div>
              <PublishSwitch table="units" id={u.id} published={u.is_published} label={u.title} />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" aria-label={`Edit ${u.title}`} onClick={() => setEditing(u)}><Pencil /></Button>
                <ConfirmDelete title={`Delete “${u.title}”?`} description="This permanently deletes the unit with its summary, topics, learning materials, quizzes’ links and student progress. This can’t be undone." onConfirm={() => run(() => deleteUnitAction(u.id))} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && <UnitDialog key={editing === 'new' ? 'new' : editing.id} unit={editing === 'new' ? null : editing} subjectId={subjectId} subjects={subjects} nextNumber={nextNumber} onClose={() => setEditing(null)} />}
    </div>
  );
}

function UnitDialog({ unit, subjectId, subjects, nextNumber, onClose }: { unit: AdminUnit | null; subjectId: string; subjects: { id: string; title: string }[]; nextNumber: number; onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, start] = useTransition();
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: unit
      ? { id: unit.id, subject_id: unit.subject_id, number: unit.number, title: unit.title, description: unit.description, introduction: unit.introduction, objectives: unit.objectives.join('\n'), key_concepts: unit.key_concepts.join('\n'), topics: unit.topics.join('\n'), estimated_minutes: unit.estimated_minutes, is_published: unit.is_published }
      : { subject_id: subjectId, number: nextNumber, title: '', description: '', introduction: '', objectives: '', key_concepts: '', topics: '', estimated_minutes: 30, is_published: false },
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const onSubmit = handleSubmit((v) => {
    setError(null);
    const candidate: UnitInput = {
      id: v.id, subject_id: v.subject_id, number: Number(v.number), title: v.title, description: v.description, introduction: v.introduction,
      objectives: splitLines(v.objectives), key_concepts: splitLines(v.key_concepts), topics: splitLines(v.topics),
      estimated_minutes: Number(v.estimated_minutes), is_published: v.is_published,
    };
    const parsed = unitSchema.safeParse(candidate);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const i of parsed.error.issues) map[String(i.path[0])] = i.message;
      setFieldErrors(map);
      return;
    }
    setFieldErrors({});
    start(async () => {
      const res = await saveUnitAction(candidate);
      if (!res.ok) return setError(res.error);
      toast.success(res.message ?? 'Saved');
      onClose();
      router.refresh();
    });
  });
  const err = (k: keyof FormValues) => fieldErrors[k] ?? errors[k]?.message;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{unit ? 'Edit unit' : 'New unit'}</DialogTitle>
          <DialogDescription>Overview content shown on the unit’s first tab. Write the summary separately in the summary editor.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormError message={error} />
          <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
            <Field label="Subject" htmlFor="u-subject" error={err('subject_id')}>
              <NativeSelect id="u-subject" {...register('subject_id')}>{subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</NativeSelect>
            </Field>
            <Field label="Unit number" htmlFor="u-number" error={err('number')}>
              <Input id="u-number" type="number" inputMode="numeric" min={1} {...register('number')} />
            </Field>
          </div>
          <Field label="Title" htmlFor="u-title" error={err('title')}><Input id="u-title" {...register('title')} placeholder="e.g. Limits and Continuity" /></Field>
          <Field label="Short description" htmlFor="u-desc" error={err('description')} optional><Input id="u-desc" {...register('description')} placeholder="One line shown on the unit list" /></Field>
          <Field label="Introduction" htmlFor="u-intro" error={err('introduction')} optional hint="Leave a blank line between paragraphs.">
            <Textarea id="u-intro" rows={4} {...register('introduction')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Learning objectives" htmlFor="u-obj" error={err('objectives')} optional hint="One per line.">
              <Textarea id="u-obj" rows={5} {...register('objectives')} placeholder={'Define a function\nFind the domain and range'} />
            </Field>
            <Field label="Key topics" htmlFor="u-topics" error={err('topics')} optional hint="One per line. Questions can be tagged with these.">
              <Textarea id="u-topics" rows={5} {...register('topics')} placeholder={'Domain and range\nComposite functions'} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
            <Field label="Important concepts" htmlFor="u-concepts" error={err('key_concepts')} optional hint="One per line.">
              <Textarea id="u-concepts" rows={3} {...register('key_concepts')} />
            </Field>
            <Field label="Study time (min)" htmlFor="u-min" error={err('estimated_minutes')}>
              <Input id="u-min" type="number" inputMode="numeric" min={1} {...register('estimated_minutes')} />
            </Field>
          </div>
          <Controller control={control} name="is_published" render={({ field }) => (
            <label className="flex items-center justify-between gap-4 rounded-lg border p-3.5">
              <span><span className="block text-sm font-medium">Published</span><span className="block text-xs text-muted-foreground">Visible to students (the subject must be published too).</span></span>
              <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Published" />
            </label>
          )} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={saving}>{unit ? 'Save changes' : 'Create unit'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
