'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { SidebarLinks } from './nav-links';
import { UserMenu } from './user-menu';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useT } from '@/i18n/client';

interface Props {
  name: string;
  email: string;
  avatarUrl: string | null;
  children: React.ReactNode;
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT('nav');
  return (
    <>
      <div className="flex h-16 items-center gap-2 px-5">
        <Logo href="/admin" inverted />
        <Badge className="bg-white/10 text-[10px] uppercase tracking-wider text-white/80">{t('shell.adminBadge')}</Badge>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <SidebarLinks set="admin" tone="dark" onNavigate={onNavigate} />
      </div>
      <div className="border-t border-white/10 p-3">
        <Link
          href="/dashboard"
          className="flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" /> {t('shell.studentView')}
        </Link>
      </div>
    </>
  );
}

/** Administrator chrome: midnight sidebar on desktop, slide-over drawer on phones. */
export function AdminShell({ name, email, avatarUrl, children }: Props) {
  const t = useT('nav');
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-dvh lg:ps-64">
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col bg-midnight lg:flex">
        <SidebarBody />
      </aside>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          hideClose
          className="inset-y-0 start-0 end-auto top-0 h-dvh max-h-dvh w-72 max-w-[85vw] translate-x-0 translate-y-0 gap-0 rounded-none border-0 bg-midnight p-0 sm:inset-y-0 sm:left-0 sm:top-0 sm:max-w-[85vw] sm:translate-x-0 sm:translate-y-0 sm:rounded-none"
        >
          <DialogTitle className="sr-only">{t('shell.adminNav')}</DialogTitle>
          <DialogDescription className="sr-only">{t('shell.adminNavDesc')}</DialogDescription>
          <SidebarBody onNavigate={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label={t('shell.openNav')}>
          <Menu />
        </Button>
        <div className="lg:hidden">
          <Logo href="/admin" withWordmark={false} />
        </div>
        <p className="hidden text-sm font-medium text-muted-foreground lg:block">{t('shell.adminConsole')}</p>
        <div className="ms-auto flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu name={name} email={email} avatarUrl={avatarUrl} isAdmin inAdmin />
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
