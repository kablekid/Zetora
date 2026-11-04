'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { reorderAction, setPublishedAction } from '@/lib/actions/admin';
import type { ActionResult } from '@/lib/actions-helpers';

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
  const [value, setValue] = useState(published);
  const { run, pending } = useRunAction();
  return (
    <label className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
      <Switch
        checked={value}
        disabled={pending}
        aria-label={`${value ? 'Unpublish' : 'Publish'} ${label}`}
        onCheckedChange={(next) => {
          setValue(next);
          run(() => setPublishedAction(table, id, next), {});
        }}
      />
      <span className="w-[4.5rem]">{pending ? <Loader2 className="inline size-3.5 animate-spin" /> : value ? 'Published' : 'Draft'}</span>
    </label>
  );
}

export function ConfirmDelete({
  title, description, confirmLabel = 'Delete', onConfirm, children, disabled,
}: {
  title: string; description: string; confirmLabel?: string; onConfirm: () => void; children?: React.ReactNode; disabled?: boolean;
}) {
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction destructive onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
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
  const { run, pending } = useRunAction();
  const move = (to: number) => {
    const next = [...ids];
    const [item] = next.splice(index, 1);
    next.splice(to, 0, item);
    run(() => reorderAction(table, next));
  };
  return (
    <div className="flex flex-col">
      <Button variant="ghost" size="icon-sm" className="h-6" disabled={pending || index === 0} aria-label="Move up" onClick={() => move(index - 1)}><ArrowUp className="size-3.5" /></Button>
      <Button variant="ghost" size="icon-sm" className="h-6" disabled={pending || index === ids.length - 1} aria-label="Move down" onClick={() => move(index + 1)}><ArrowDown className="size-3.5" /></Button>
    </div>
  );
}

export function Pagination({
  page, pageCount, hrefFor,
}: {
  page: number; pageCount: number; hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-5 flex items-center justify-between gap-3">
      <Button asChild variant="outline" size="sm" className={page <= 1 ? 'pointer-events-none opacity-50' : ''}>
        <a href={hrefFor(page - 1)} aria-disabled={page <= 1}>Previous</a>
      </Button>
      <p className="text-sm text-muted-foreground">Page {page} of {pageCount}</p>
      <Button asChild variant="outline" size="sm" className={page >= pageCount ? 'pointer-events-none opacity-50' : ''}>
        <a href={hrefFor(page + 1)} aria-disabled={page >= pageCount}>Next</a>
      </Button>
    </nav>
  );
}
