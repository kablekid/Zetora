'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Loader2, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { reorderAction, setPublishedAction } from '@/lib/actions/admin';
import type { ActionResult } from '@/lib/actions-helpers';
import { useT } from '@/i18n/client';

/** Runs a server action, shows a toast, then refreshes the server-rendered page. */
export function useRunAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  function run<T>(fn: () => Promise<ActionResult<T>>, opts?: { onOk?: (r: Extract<ActionResult<T>, { ok: true }>) => void }) {
    start(async () => {
      const r = await fn();
      if (!r.ok) return void toast.error(r.error);
      if (r.message) toast.success(r.message);
      opts?.onOk?.(r);
      router.refresh();
    });
  }
  return { run, pending };
}

export function PublishSwitch({
  table, id, published, label,
}: {
  table: 'subjects' | 'units' | 'learning_resources' | 'quizzes' | 'exams'; id: string; published: boolean; label: string;
}) {
  const t = useT('admin');
  const [value, setValue] = useState(published);
  const { run, pending } = useRunAction();
  return (
    <label className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
      <Switch
        checked={value}
        disabled={pending}
        aria-label={t(value ? 'ui.unpublishAria' : 'ui.publishAria', { label })}
        onCheckedChange={(next) => {
          setValue(next);
          run(() => setPublishedAction(table, id, next), {});
        }}
      />
      <span className="min-w-[4.5rem]">{pending ? <Loader2 className="inline size-3.5 animate-spin" /> : value ? t('ui.published') : t('ui.draft')}</span>
    </label>
  );
}

export function ConfirmDelete({
  title, description, confirmLabel, onConfirm, children, disabled,
}: {
  title: string; description: string; confirmLabel?: string; onConfirm: () => void; children?: React.ReactNode; disabled?: boolean;
}) {
  const tc = useT('common');
  const [open, setOpen] = useState(false);
  return (
    <>
      {children ? (
        <span onClick={() => !disabled && setOpen(true)}>{children}</span>
      ) : (
        <Button variant="ghost" size="icon-sm" aria-label={title} disabled={disabled} onClick={() => setOpen(true)} className="text-destructive hover:bg-destructive-soft hover:text-destructive">
          <Trash2 />
        </Button>
      )}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction destructive onClick={onConfirm}>{confirmLabel ?? tc('actions.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ReorderButtons({
  table, ids, index,
}: {
  table: 'subjects' | 'units' | 'topics'; ids: string[]; index: number;
}) {
  const t = useT('admin');
  const { run, pending } = useRunAction();
  const move = (to: number) => {
    const next = [...ids];
    const [item] = next.splice(index, 1);
    next.splice(to, 0, item);
    run(() => reorderAction(table, next));
  };
  return (
    <div className="flex flex-col">
      <Button variant="ghost" size="icon-sm" className="h-6" disabled={pending || index === 0} aria-label={t('ui.moveUp')} onClick={() => move(index - 1)}><ArrowUp className="size-3.5" /></Button>
      <Button variant="ghost" size="icon-sm" className="h-6" disabled={pending || index === ids.length - 1} aria-label={t('ui.moveDown')} onClick={() => move(index + 1)}><ArrowDown className="size-3.5" /></Button>
    </div>
  );
}
