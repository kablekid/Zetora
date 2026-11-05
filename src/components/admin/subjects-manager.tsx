'use client';
import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Layers, Library, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Field } from '@/components/forms/field';
import { FormError } from '@/components/forms/form-error';
import { SubjectTile } from '@/components/subjects/subject-card';
import { ConfirmDelete, PublishSwitch, ReorderButtons, useRunAction } from './ui';
import { deleteSubjectAction, saveSubjectAction, setSubjectImageAction } from '@/lib/actions/admin';
import { subjectSchema, type SubjectInput } from '@/lib/validators/admin';
import { SUBJECT_COLORS, SUBJECT_ICONS } from '@/lib/registry';
import { createClient } from '@/lib/supabase/client';
import { resizeImage } from '@/lib/image';
import { MEDIA_BUCKET } from '@/lib/constants';
import { cn, slugify } from '@/lib/utils';
import { useT } from '@/i18n/client';
import { env } from '@/lib/env';

export interface AdminSubject {
  id: string; slug: string; title: string; description: string; icon: string; color: string; image_url: string | null;
  position: number; is_published: boolean; is_demo: boolean; unit_count: number;
}

export function SubjectsManager({ subjects }: { subjects: AdminSubject[] }) {
  const t = useT('admin');
  const tc = useT('common');
  const [editing, setEditing] = useState<AdminSubject | 'new' | null>(null);
  const { run } = useRunAction();
  const ids = subjects.map((s) => s.id);
  return (
    <div>
      <div className="mb-5 flex justify-end"><Button onClick={() => setEditing('new')}><Plus /> {t('subjects.newSubject')}</Button></div>
      {subjects.length === 0 ? (
        <EmptyState icon={<Library />} title={t('subjects.emptyTitle')} description={t('subjects.emptyBody')} action={<Button onClick={() => setEditing('new')}><Plus /> {t('subjects.newSubject')}</Button>} />
      ) : (
        <ul className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
          {subjects.map((s, i) => (
            <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b p-4 last:border-b-0 sm:px-5">
              <ReorderButtons table="subjects" ids={ids} index={i} />
              <SubjectTile icon={s.icon} color={s.color} />
              <div className="min-w-0 flex-1 basis-52">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">{s.title}{s.is_demo && <Badge variant="warning">{t('ui.demo')}</Badge>}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">/{s.slug} · <Link href={`/admin/units?subject=${s.id}`} className="font-medium text-primary hover:underline"><Layers className="me-1 inline size-3" />{tc('count.unit', { count: s.unit_count })}</Link></p>
              </div>
              <PublishSwitch table="subjects" id={s.id} published={s.is_published} label={s.title} />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" aria-label={t('subjects.editAria', { title: s.title })} onClick={() => setEditing(s)}><Pencil /></Button>
                <ConfirmDelete title={t('subjects.deleteTitle', { title: s.title })} description={t('subjects.deleteBody', { units: tc('count.unit', { count: s.unit_count }) })} onConfirm={() => run(() => deleteSubjectAction(s.id))} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && <SubjectDialog key={editing === 'new' ? 'new' : editing.id} subject={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function SubjectDialog({ subject, onClose }: { subject: AdminSubject | null; onClose: () => void }) {
  const t = useT('admin');
  const tc = useT('common');
  const { run, pending } = useRunAction();
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(subject));
  const [coverPath, setCoverPath] = useState<string | null | undefined>(undefined); // undefined = unchanged
  const [coverPreview, setCoverPreview] = useState<string | null>(subject?.image_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, startSave] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<SubjectInput>({
    resolver: zodResolver(subjectSchema),
    defaultValues: subject
      ? { id: subject.id, title: subject.title, slug: subject.slug, description: subject.description, icon: subject.icon, color: subject.color, is_published: subject.is_published }
      : { title: '', slug: '', description: '', icon: 'book-open', color: 'indigo', is_published: false },
  });
  const icon = watch('icon');
  const color = watch('color');
  const title = watch('title');

  async function onFile(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const { blob, ext, type } = await resizeImage(file, 1280, 0.82);
      const path = `subjects/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await createClient().storage.from(MEDIA_BUCKET).upload(path, blob, { contentType: type, cacheControl: '31536000' });
      if (upErr) throw new Error(upErr.message);
      setCoverPath(path);
      setCoverPreview(`${env.supabaseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const onSubmit = handleSubmit((values) => {
    setError(null);
    startSave(async () => {
      const res = await saveSubjectAction(values);
      if (!res.ok) return setError(res.error);
      const id = res.data!.id;
      if (coverPath !== undefined) {
        const img = await setSubjectImageAction(id, coverPath);
        if (!img.ok) toast.error(img.error);
      }
      toast.success(res.message ?? t('ui.saved'));
      onClose();
      run(async () => ({ ok: true as const }));
    });
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{subject ? t('subjects.dialog.editTitle') : t('subjects.dialog.newTitle')}</DialogTitle>
          <DialogDescription>{t('subjects.dialog.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormError message={error} />
          <Field label={t('subjects.dialog.title')} htmlFor="s-title" error={errors.title?.message}>
            <Input id="s-title" {...register('title', { onChange: (e) => { if (!slugTouched) setValue('slug', slugify(e.target.value), { shouldValidate: false }); } })} placeholder={t('subjects.dialog.titlePlaceholder')} />
          </Field>
          <Field label={t('subjects.dialog.url')} htmlFor="s-slug" error={errors.slug?.message} hint={t('subjects.dialog.urlHint', { slug: watch('slug') || slugify(title) || 'mathematics' })}>
            <Input id="s-slug" {...register('slug', { onChange: () => setSlugTouched(true) })} autoCapitalize="off" spellCheck={false} />
          </Field>
          <Field label={t('subjects.dialog.shortDesc')} htmlFor="s-desc" error={errors.description?.message} optional>
            <Textarea id="s-desc" rows={3} {...register('description')} placeholder={t('subjects.dialog.descPlaceholder')} />
          </Field>
          <div>
            <p className="mb-2 text-sm font-medium">{t('subjects.dialog.icon')}</p>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8" role="radiogroup" aria-label={t('subjects.dialog.icon')}>
              {Object.entries(SUBJECT_ICONS).map(([key, Icon]) => (
                <button key={key} type="button" role="radio" aria-checked={icon === key} aria-label={key} onClick={() => setValue('icon', key)}
                  className={cn('flex size-10 items-center justify-center rounded-lg border transition-colors', icon === key ? 'border-primary bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-muted')}>
                  <Icon className="size-[18px]" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{t('subjects.dialog.colour')}</p>
            <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label={t('subjects.dialog.colour')}>
              {Object.entries(SUBJECT_COLORS).map(([key, tone]) => (
                <button key={key} type="button" role="radio" aria-checked={color === key} aria-label={key} onClick={() => setValue('color', key)}
                  className={cn('size-9 rounded-full ring-offset-2 ring-offset-popover transition', tone.solid, color === key ? 'ring-2 ring-foreground' : 'hover:scale-110')} />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{t('subjects.dialog.cover')} <span className="font-normal text-muted-foreground">({tc('status.optional').toLowerCase()})</span></p>
            <div className="flex items-center gap-3">
              <div className="relative flex h-16 w-28 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                {coverPreview ? <Image src={coverPreview} alt="" fill sizes="112px" className="object-cover" unoptimized /> : <ImagePlus className="size-5 text-muted-foreground" />}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>{coverPreview ? t('subjects.dialog.replace') : t('subjects.dialog.uploadImage')}</Button>
                {coverPreview && <Button type="button" variant="ghost" size="sm" onClick={() => { setCoverPath(null); setCoverPreview(null); }}><Trash2 /> {tc('actions.remove')}</Button>}
              </div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label={t('subjects.dialog.coverFile')} onChange={(e) => onFile(e.target.files?.[0])} />
            </div>
          </div>
          <Controller control={control} name="is_published" render={({ field }) => (
            <label className="flex items-center justify-between gap-4 rounded-lg border p-3.5">
              <span><span className="block text-sm font-medium">{t('subjects.dialog.published')}</span><span className="block text-xs text-muted-foreground">{t('subjects.dialog.publishedHint')}</span></span>
              <Switch checked={field.value} onCheckedChange={field.onChange} aria-label={t('subjects.dialog.published')} />
            </label>
          )} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{tc('actions.cancel')}</Button>
            <Button type="submit" loading={saving || pending}>{subject ? tc('actions.saveChanges') : t('subjects.dialog.create')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
