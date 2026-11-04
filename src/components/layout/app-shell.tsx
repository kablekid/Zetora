import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { BottomNav, SidebarLinks } from './nav-links';
import { SearchTrigger } from './search-palette';
import { UserMenu } from './user-menu';
import type { Profile } from '@/lib/types';

/** Student application chrome: sidebar (desktop), top bar, bottom nav (phones). */
export function AppShell({
  profile,
  unread,
  children,
}: {
  profile: Profile;
  unread: number;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:pl-64">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo href="/dashboard" />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <p className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">Learn</p>
          <SidebarLinks set="student" />
          <p className="px-3 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">Account</p>
          <SidebarLinks set="student-secondary" badge={{ '/notifications': unread }} />
        </div>
        <div className="border-t p-4">
          <div className="rounded-xl bg-primary-soft p-3.5">
            <p className="text-xs font-semibold text-primary">Learn. Practice. Achieve.</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Open a unit, read the summary, then test yourself with a quiz.
            </p>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6">
        <div className="lg:hidden">
          <Logo href="/dashboard" withWordmark={false} />
        </div>
        <SearchTrigger className="w-full max-w-md flex-1 sm:flex-none sm:basis-96" />
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon" className="relative">
            <Link href="/notifications" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}>
              <Bell />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-background">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          </Button>
          <div className="ml-1">
            <UserMenu
              name={profile.full_name || profile.email}
              email={profile.email}
              avatarUrl={profile.avatar_url}
              isAdmin={profile.role === 'admin'}
            />
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12 lg:pt-8">
        {children}
      </main>
      <BottomNav set="student" />
    </div>
  );
}
