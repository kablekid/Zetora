'use client';
import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, FolderOpen, Image as ImageIcon, Pencil, Plus, UploadCloud, Eye } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Field } from '@/components/forms/field';
import { FormError } from '@/components/forms/form-error';
import { ConfirmDelete, PublishSwitch, useRunAction } from './ui';
import { createResourceAction, deleteResourceAction, updateResourceAction } from '@/lib/actions/admin';
import { createClient } from '@/lib/supabase/client';
import { MAX_PDF_BYTES, RESOURCES_BUCKET } from '@/lib/constants';
import { formatBytes } from '@/lib/utils';
import { useFormat, useT } from '@/i18n/client';

export interface AdminResource {
  id: string; subject_id: string; unit_id: string | null; title: string; description: string; kind: 'pdf' | 'note' | 'image' | 'reference';
  storage_path: string; file_name: string; mime_type: string; file_size: number; allow_download: boolean; is_published: boolean; is_demo: boolean; created_at: string;
}
type Opt = { id: string; title: string };
type UnitOpt = { id: string; subject_id: string; number: number; title: string };

const ALLOWED: Record<string, string> = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'text/plain': 'txt' };

type AdminT = ReturnType<typeof useT<'admin'>>;

async function checkFile(file: File, t: AdminT): Promise<string | null> {
  if (!ALLOWED[file.type]) return t('materials.errors.type');
  if (file.size > MAX_PDF_BYTES) return t('materials.errors.tooBig', { size: formatBytes(file.size), max: formatBytes(MAX_PDF_BYTES) });
  if (file.size === 0) return t('materials.errors.empty');
  if (file.type === 'application/pdf') {
    const head = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
    if (head !== '%PDF-') return t('materials.errors.notPdf');
  }
  return null;
}

export function MaterialsManager({ resources, subjects, units, subjectFilter, totalPages, page }: {
  resources: AdminResource[]; subjects: Opt[]; units: UnitOpt[]; subjectFilter: string; totalPages: number; page: number;
}) {
  const router = useRouter();
  const t = useT('admin');
  const f = useFormat();
  const [editing, setEditing] = useState<AdminResource | 'new' | null>(null);
  const { run } = useRunAction();
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.title ?? '—';
  const unitName = (id: string | null) => { const u = units.find((x) => x.id === id); return u ? t('ui.unitLine', { n: u.number, title: u.title }) : t('materials.wholeSubject'); };
  void page; void totalPages;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-72">
          <label htmlFor="mat-subject" className="sr-only">{t('materials.filterLabel')}</label>
          <NativeSelect id="mat-subject" value={subjectFilter} onChange={(e) => router.push(e.target.value ? `/admin/materials?subject=${e.target.value}` : '/admin/materials')}>
            <option value="">{t('materials.allSubjects')}</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </NativeSelect>
        </div>
        <Button onClick={() => setEditing('new')} disabled={subjects.length === 0}><UploadCloud /> {t('materials.upload')}</Button>
      </div>

      {resources.length === 0 ? (
        <EmptyState icon={<FolderOpen />} title={t('materials.emptyTitle')} description={subjects.length === 0 ? t('materials.emptyNoSubject') : t('materials.emptyBody')} action={subjects.length > 0 ? <Button onClick={() => setEditing('new')}><Plus /> {t('materials.upload')}</Button> : undefined} />
      ) : (
        <ul className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
          {resources.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b p-4 last:border-b-0 sm:px-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive-soft text-destructive">{r.kind === 'image' ? <ImageIcon className="size-5" /> : <FileText className="size-5" />}</span>
              <div className="min-w-0 flex-1 basis-56">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">{r.title}{r.is_demo && <Badge variant="warning">{t('ui.demo')}</Badge>}{!r.allow_download && <Badge variant="muted">{t('materials.viewOnly')}</Badge>}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{subjectName(r.subject_id)} · {unitName(r.unit_id)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t('materials.meta', { size: formatBytes(r.file_size), date: f.date(r.created_at), file: r.file_name })}</p>
              </div>
              <PublishSwitch table="learning_resources" id={r.id} published={r.is_published} label={r.title} />
              <div className="flex items-center gap-1">
                <Button asChild variant="ghost" size="icon-sm" aria-label={t('materials.previewAria', { title: r.title })}><Link href={`/resources/${r.id}`}><Eye /></Link></Button>
                <Button variant="ghost" size="icon-sm" aria-label={t('materials.editAria', { title: r.title })} onClick={() => setEditing(r)}><Pencil /></Button>
                <ConfirmDelete title={t('ui.deleteTitle', { title: r.title })} description={t('materials.deleteBody')} onConfirm={() => run(() => deleteResourceAction(r.id))} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && <MaterialDialog key={editing === 'new' ? 'new' : editing.id} resource={editing === 'new' ? null : editing} subjects={subjects} units={units} defaultSubject={subjectFilter || subjects[0]?.id} onClose={() => setEditing(null)} />}
    </div>
  );
}

function MaterialDialog({ resource, subjects, units, defaultSubject, onClose }: { resource: AdminResource | null; subjects: Opt[]; units: UnitOpt[]; defaultSubject?: string; onClose: () => void }) {
  const router = useRouter();
  const t = useT('admin');
  const tc = useT('common');
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const [form, setForm] = useState({
    title: resource?.title ?? '', description: resource?.description ?? '', subject_id: resource?.subject_id ?? defaultSubject ?? '',
    unit_id: resource?.unit_id ?? '', kind: resource?.kind ?? 'pdf', allow_download: resource?.allow_download ?? true, is_published: resource?.is_published ?? false,
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const unitOptions = units.filter((u) => u.subject_id === form.subject_id);

  async function pick(f: File | undefined) {
    setError(null);
    if (!f) return setFile(null);
    const problem = await checkFile(f, t);
    if (problem) { setError(problem); setFile(null); if (fileRef.current) fileRef.current.value = ''; return; }
    setFile(f);
    if (!form.title) set('title', f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
    set('kind', f.type.startsWith('image/') ? 'image' : 'pdf');
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!resource && !file) return setError(t('materials.errors.chooseFile'));
    if (!form.title.trim()) return setError(t('materials.errors.enterTitle'));
    if (!form.subject_id) return setError(t('materials.errors.chooseSubject'));
    start(async () => {
      let fileMeta: { storage_path: string; file_name: string; mime_type: string; file_size: number } | undefined;
      if (file) {
        const path = `${form.subject_id}/${crypto.randomUUID()}.${ALLOWED[file.type]}`;
        const { error: upErr } = await createClient().storage.from(RESOURCES_BUCKET).upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: false });
        if (upErr) return setError(t('materials.errors.uploadFailed', { reason: upErr.message }));
        fileMeta = { storage_path: path, file_name: file.name, mime_type: file.type, file_size: file.size };
      }
      const meta = { id: resource?.id, subject_id: form.subject_id, unit_id: form.unit_id || null, title: form.title, description: form.description, kind: form.kind, allow_download: form.allow_download, is_published: form.is_published };
      const res = resource ? await updateResourceAction(meta, fileMeta) : await createResourceAction(meta, fileMeta);
      if (!res.ok) return setError(res.error);
      toast.success(res.message ?? t('ui.saved'));
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{resource ? t('materials.dialog.editTitle') : t('materials.dialog.uploadTitle')}</DialogTitle>
          <DialogDescription>{t('materials.dialog.description', { max: formatBytes(MAX_PDF_BYTES) })}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormError message={error} />
          <Field label={resource ? t('materials.dialog.replaceFile') : t('materials.dialog.file')} htmlFor="m-file" optional={Boolean(resource)} hint={resource ? t('materials.dialog.current', { name: resource.file_name, size: formatBytes(resource.file_size) }) : undefined}>
            <Input id="m-file" ref={fileRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp,text/plain" onChange={(e) => pick(e.target.files?.[0])} className="h-auto py-2" />
          </Field>
          <Field label={t('materials.dialog.title')} htmlFor="m-title"><Input id="m-title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={t('materials.dialog.titlePlaceholder')} /></Field>
          <Field label={t('materials.dialog.desc')} htmlFor="m-desc" optional><Textarea id="m-desc" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('materials.dialog.subject')} htmlFor="m-subject"><NativeSelect id="m-subject" value={form.subject_id} onChange={(e) => { set('subject_id', e.target.value); set('unit_id', ''); }}>{subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</NativeSelect></Field>
            <Field label={t('materials.dialog.unit')} htmlFor="m-unit" optional><NativeSelect id="m-unit" value={form.unit_id} onChange={(e) => set('unit_id', e.target.value)}><option value="">{t('materials.wholeSubject')}</option>{unitOptions.map((u) => <option key={u.id} value={u.id}>{t('ui.unitLine', { n: u.number, title: u.title })}</option>)}</NativeSelect></Field>
          </div>
          <Field label={t('materials.dialog.type')} htmlFor="m-kind"><NativeSelect id="m-kind" value={form.kind} onChange={(e) => set('kind', e.target.value as typeof form.kind)}><option value="pdf">{t('materials.dialog.kinds.pdf')}</option><option value="note">{t('materials.dialog.kinds.note')}</option><option value="reference">{t('materials.dialog.kinds.reference')}</option><option value="image">{t('materials.dialog.kinds.image')}</option></NativeSelect></Field>
          <label className="flex items-center justify-between gap-4 rounded-lg border p-3.5"><span><span className="block text-sm font-medium">{t('materials.dialog.allowDownload')}</span><span className="block text-xs text-muted-foreground">{t('materials.dialog.allowHint')}</span></span><Switch checked={form.allow_download} onCheckedChange={(v) => set('allow_download', v)} aria-label={t('materials.dialog.allowDownload')} /></label>
          <label className="flex items-center justify-between gap-4 rounded-lg border p-3.5"><span><span className="block text-sm font-medium">{t('materials.dialog.published')}</span><span className="block text-xs text-muted-foreground">{t('materials.dialog.publishedHint')}</span></span><Switch checked={form.is_published} onCheckedChange={(v) => set('is_published', v)} aria-label={t('materials.dialog.published')} /></label>
          <DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={busy}>{tc('actions.cancel')}</Button><Button type="submit" loading={busy}>{busy ? t('materials.dialog.uploading') : resource ? tc('actions.saveChanges') : t('materials.dialog.uploadBtn')}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
