'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { FileText, Layers, Pencil, Plus } from 'lucide-react';
import { toast } from '@/lib/toast';
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
import { useT } from '@/i18n/client';

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
  const t = useT('admin');
  const tc = useT('common');
  const [editing, setEditing] = useState<AdminUnit | 'new' | null>(null);
  const { run } = useRunAction();
  const ids = units.map((u) => u.id);
  const nextNumber = units.reduce((m, u) => Math.max(m, u.number), 0) + 1;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-72">
          <label htmlFor="subject-filter" className="sr-only">{t('units.subject')}</label>
          <NativeSelect id="subject-filter" value={subjectId} onChange={(e) => router.push(`/admin/units?subject=${e.target.value}`)}>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </NativeSelect>
        </div>
        <Button onClick={() => setEditing('new')}><Plus /> {t('units.newUnit')}</Button>
      </div>

      {units.length === 0 ? (
        <EmptyState icon={<Layers />} title={t('units.emptyTitle')} description={t('units.emptyBody')} action={<Button onClick={() => setEditing('new')}><Plus /> {t('units.newUnit')}</Button>} />
      ) : (
        <ul className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
          {units.map((u, i) => (
            <li key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b p-4 last:border-b-0 sm:px-5">
              <ReorderButtons table="units" ids={ids} index={i} />
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-bold text-primary">{u.number}</span>
              <div className="min-w-0 flex-1 basis-52">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">{u.title}{u.is_demo && <Badge variant="warning">{t('ui.demo')}</Badge>}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{tc('time.minutes', { m: u.estimated_minutes })}</span>
                  <span>{tc('count.topic', { count: u.topics.length })}</span>
                  <Link href={`/admin/summaries/${u.id}`} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                    <FileText className="size-3" />{u.summary_status === 'none' ? t('units.writeSummary') : u.summary_status === 'draft' ? t('units.summaryDraft') : t('units.summaryPublished')}
                  </Link>
                </p>
              </div>
              <PublishSwitch table="units" id={u.id} published={u.is_published} label={u.title} />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" aria-label={t('units.editAria', { title: u.title })} onClick={() => setEditing(u)}><Pencil /></Button>
                <ConfirmDelete title={t('units.deleteTitle', { title: u.title })} description={t('units.deleteBody')} onConfirm={() => run(() => deleteUnitAction(u.id))} />
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
  const t = useT('admin');
  const tc = useT('common');
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
      toast.success(res.message ?? t('ui.saved'));
      onClose();
      router.refresh();
    });
  });
  const err = (k: keyof FormValues) => fieldErrors[k] ?? errors[k]?.message;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{unit ? t('units.dialog.editTitle') : t('units.dialog.newTitle')}</DialogTitle>
          <DialogDescription>{t('units.dialog.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormError message={error} />
          <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
            <Field label={t('units.subject')} htmlFor="u-subject" error={err('subject_id')}>
              <NativeSelect id="u-subject" {...register('subject_id')}>{subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</NativeSelect>
            </Field>
            <Field label={t('units.dialog.number')} htmlFor="u-number" error={err('number')}>
              <Input id="u-number" type="number" inputMode="numeric" min={1} {...register('number')} />
            </Field>
          </div>
          <Field label={t('units.dialog.title')} htmlFor="u-title" error={err('title')}><Input id="u-title" {...register('title')} placeholder={t('units.dialog.titlePlaceholder')} /></Field>
          <Field label={t('units.dialog.shortDesc')} htmlFor="u-desc" error={err('description')} optional><Input id="u-desc" {...register('description')} placeholder={t('units.dialog.shortDescPlaceholder')} /></Field>
          <Field label={t('units.dialog.intro')} htmlFor="u-intro" error={err('introduction')} optional hint={t('units.dialog.introHint')}>
            <Textarea id="u-intro" rows={4} {...register('introduction')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('units.dialog.objectives')} htmlFor="u-obj" error={err('objectives')} optional hint={t('units.dialog.oneLine')}>
              <Textarea id="u-obj" rows={5} {...register('objectives')} placeholder={t('units.dialog.objectivesPlaceholder')} />
            </Field>
            <Field label={t('units.dialog.topics')} htmlFor="u-topics" error={err('topics')} optional hint={t('units.dialog.topicsHint')}>
              <Textarea id="u-topics" rows={5} {...register('topics')} placeholder={t('units.dialog.topicsPlaceholder')} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
            <Field label={t('units.dialog.concepts')} htmlFor="u-concepts" error={err('key_concepts')} optional hint={t('units.dialog.oneLine')}>
              <Textarea id="u-concepts" rows={3} {...register('key_concepts')} />
            </Field>
            <Field label={t('units.dialog.studyTime')} htmlFor="u-min" error={err('estimated_minutes')}>
              <Input id="u-min" type="number" inputMode="numeric" min={1} {...register('estimated_minutes')} />
            </Field>
          </div>
          <Controller control={control} name="is_published" render={({ field }) => (
            <label className="flex items-center justify-between gap-4 rounded-lg border p-3.5">
              <span><span className="block text-sm font-medium">{t('units.dialog.published')}</span><span className="block text-xs text-muted-foreground">{t('units.dialog.publishedHint')}</span></span>
              <Switch checked={field.value} onCheckedChange={field.onChange} aria-label={t('units.dialog.published')} />
            </label>
          )} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{tc('actions.cancel')}</Button>
            <Button type="submit" loading={saving}>{unit ? tc('actions.saveChanges') : t('units.dialog.create')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
