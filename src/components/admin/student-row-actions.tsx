'use client';
import { MoreHorizontal, ShieldCheck, ShieldOff, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRunAction } from './ui';
import { setStudentActiveAction, setStudentRoleAction } from '@/lib/actions/admin';
import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function StudentRowActions({ id, name, role, isActive, isSelf }: { id: string; name: string; role: 'student' | 'admin'; isActive: boolean; isSelf: boolean }) {
  const { run, pending } = useRunAction();
  const [confirm, setConfirm] = useState<null | 'role' | 'suspend'>(null);
  if (isSelf) return <span className="text-xs text-muted-foreground">You</span>;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`} disabled={pending}><MoreHorizontal /></Button></DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setConfirm('role')}>{role === 'admin' ? <ShieldOff /> : <ShieldCheck />}{role === 'admin' ? 'Make student' : 'Make administrator'}</DropdownMenuItem>
          {isActive ? (
            <DropdownMenuItem destructive onSelect={() => setConfirm('suspend')}><UserX /> Suspend account</DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => run(() => setStudentActiveAction(id, true))}><UserCheck /> Reactivate account</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === 'role' ? (role === 'admin' ? `Remove ${name}’s admin access?` : `Make ${name} an administrator?`) : `Suspend ${name}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'role'
                ? role === 'admin' ? 'They will lose access to the admin console and become a regular student.' : 'Administrators can manage all content, students and settings. Only promote people you trust.'
                : 'They will be signed out of Zetora and unable to use it until you reactivate the account. Their progress is kept.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction destructive={confirm === 'suspend' || role === 'admin'} onClick={() => {
              if (confirm === 'role') run(() => setStudentRoleAction(id, role === 'admin' ? 'student' : 'admin'));
              else run(() => setStudentActiveAction(id, false));
            }}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
