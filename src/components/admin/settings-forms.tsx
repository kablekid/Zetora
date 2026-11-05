'use client';
import { useState, useTransition } from 'react';
import { Megaphone, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/forms/field';
import { FormError } from '@/components/forms/form-error';
import { ConfirmDelete, useRunAction } from './ui';
import { deleteDemoContentAction, sendAnnouncementAction } from '@/lib/actions/admin';
import { announcementSchema } from '@/lib/validators/admin';
import { useT } from '@/i18n/client';

export function AnnouncementForm() {
  const t = useT('admin');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = announcementSchema.safeParse({ title, body, link });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? t('settings.checkForm'));
    start(async () => {
      const res = await sendAnnouncementAction({ title, body, link });
      if (!res.ok) return setError(res.error);
      toast.success(res.message ?? t('settings.sent'));
      setTitle(''); setBody(''); setLink('');
    });
  }
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field label={t('settings.annTitle')} htmlFor="a-title"><Input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('settings.annTitlePlaceholder')} maxLength={160} /></Field>
      <Field label={t('settings.annMessage')} htmlFor="a-body" optional><Textarea id="a-body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} /></Field>
      <Field label={t('settings.annLink')} htmlFor="a-link" optional hint={t('settings.annLinkHint')}><Input id="a-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/exams" autoCapitalize="off" /></Field>
      <Button type="submit" loading={pending}><Megaphone /> {t('settings.send')}</Button>
      <p className="text-xs text-muted-foreground">{t('settings.sendNote')}</p>
    </form>
  );
}

export function RemoveDemoButton() {
  const t = useT('admin');
  const { run, pending } = useRunAction();
  return (
    <ConfirmDelete
      title={t('settings.demoTitle')}
      description={t('settings.demoBody')}
      confirmLabel={t('settings.demoConfirm')}
      onConfirm={() => run(() => deleteDemoContentAction())}
    >
      <Button variant="destructive" loading={pending}><Trash2 /> {t('settings.demoConfirm')}</Button>
    </ConfirmDelete>
  );
}
