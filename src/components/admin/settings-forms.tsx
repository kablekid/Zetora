'use client';
import { useState, useTransition } from 'react';
import { Megaphone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/forms/field';
import { FormError } from '@/components/forms/form-error';
import { ConfirmDelete, useRunAction } from './ui';
import { deleteDemoContentAction, sendAnnouncementAction } from '@/lib/actions/admin';
import { announcementSchema } from '@/lib/validators/admin';

export function AnnouncementForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = announcementSchema.safeParse({ title, body, link });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Check the form.');
    start(async () => {
      const res = await sendAnnouncementAction({ title, body, link });
      if (!res.ok) return setError(res.error);
      toast.success(res.message ?? 'Sent');
      setTitle(''); setBody(''); setLink('');
    });
  }
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field label="Title" htmlFor="a-title"><Input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mock exams are now open" maxLength={160} /></Field>
      <Field label="Message" htmlFor="a-body" optional><Textarea id="a-body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} /></Field>
      <Field label="Link inside Zetora" htmlFor="a-link" optional hint="For example /exams or /subjects/physics"><Input id="a-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/exams" autoCapitalize="off" /></Field>
      <Button type="submit" loading={pending}><Megaphone /> Send to all students</Button>
      <p className="text-xs text-muted-foreground">Shown in each student’s notification list inside Zetora (no phone push notifications).</p>
    </form>
  );
}

export function RemoveDemoButton() {
  const { run, pending } = useRunAction();
  return (
    <ConfirmDelete
      title="Remove all demo content?"
      description="This permanently deletes every sample subject, unit, summary, question, quiz and exam marked “Demo”, plus any files attached to them. Content you created yourself is not touched."
      confirmLabel="Remove demo content"
      onConfirm={() => run(() => deleteDemoContentAction())}
    >
      <Button variant="destructive" loading={pending}><Trash2 /> Remove demo content</Button>
    </ConfirmDelete>
  );
}
