'use client';
import Link from 'next/link';
import { LogOut, Settings, ShieldCheck, LayoutDashboard, Bell } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/ui/avatar';

export function UserMenu({
  name,
  email,
  avatarUrl,
  isAdmin,
  inAdmin,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  inAdmin?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full p-0.5 outline-none ring-offset-2 transition hover:ring-2 hover:ring-primary/20 focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open profile menu"
      >
        <UserAvatar name={name} src={avatarUrl} size={36} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href={inAdmin ? '/dashboard' : '/admin'}>
              {inAdmin ? <LayoutDashboard /> : <ShieldCheck />}
              {inAdmin ? 'Student view' : 'Admin dashboard'}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/notifications">
            <Bell /> Notifications
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings /> Profile &amp; settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="sr-only">Account</DropdownMenuLabel>
        <form action="/auth/signout" method="post">
          <DropdownMenuItem asChild destructive>
            <button type="submit" className="w-full">
              <LogOut /> Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
