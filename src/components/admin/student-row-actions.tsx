'use client';
import { MoreHorizontal, ShieldCheck, ShieldOff, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRunAction } from './ui';
import { setStudentActiveAction, setStudentRoleAction } from '@/lib/actions/admin';
import { useState } from 'react';
import { useT } from '@/i18n/client';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function StudentRowActions({ id, name, role, isActive, isSelf }: { id: string; name: string; role: 'student' | 'admin'; isActive: boolean; isSelf: boolean }) {
  const t = useT('admin');
  const tc = useT('common');
  const { run, pending } = useRunAction();
  const [confirm, setConfirm] = useState<null | 'role' | 'suspend'>(null);
  if (isSelf) return <span className="text-xs text-muted-foreground">{t('ui.you')}</span>;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={t('students.actionsFor', { name })} disabled={pending}><MoreHorizontal /></Button></DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setConfirm('role')}>{role === 'admin' ? <ShieldOff /> : <ShieldCheck />}{role === 'admin' ? t('students.makeStudent') : t('students.makeAdmin')}</DropdownMenuItem>
          {isActive ? (
            <DropdownMenuItem destructive onSelect={() => setConfirm('suspend')}><UserX /> {t('students.suspend')}</DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => run(() => setStudentActiveAction(id, true))}><UserCheck /> {t('students.reactivate')}</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === 'role' ? (role === 'admin' ? t('students.removeAdminTitle', { name }) : t('students.makeAdminTitle', { name })) : t('students.suspendTitle', { name })}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'role'
                ? role === 'admin' ? t('students.removeAdminBody') : t('students.makeAdminBody')
                : t('students.suspendBody')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction destructive={confirm === 'suspend' || role === 'admin'} onClick={() => {
              if (confirm === 'role') run(() => setStudentRoleAction(id, role === 'admin' ? 'student' : 'admin'));
              else run(() => setStudentActiveAction(id, false));
            }}>{t('ui.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
