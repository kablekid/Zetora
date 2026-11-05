'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useT } from '@/i18n/client';

export function MarketingHeader({ signedIn }: { signedIn: boolean }) {
  const t = useT('nav');
  const [open, setOpen] = useState(false);
  const links = [
    { href: '/', label: t('marketing.home') },
    { href: '/#subjects', label: t('marketing.explore') },
    { href: '/#features', label: t('marketing.features') },
    { href: '/about', label: t('marketing.about') },
  ];
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav aria-label={t('labels.main')} className="ms-4 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto hidden items-center gap-1 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          {signedIn ? (
            <Button asChild className="ms-1"><Link href="/dashboard">{t('marketing.openDashboard')}</Link></Button>
          ) : (
            <>
              <Button asChild variant="ghost"><Link href="/login">{t('marketing.signIn')}</Link></Button>
              <Button asChild><Link href="/register">{t('marketing.getStarted')}</Link></Button>
            </>
          )}
        </div>
        <div className="ms-auto flex items-center gap-0.5 md:hidden">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label={t('marketing.openMenu')}><Menu /></Button>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle className="sr-only">{t('marketing.menu')}</DialogTitle>
          <DialogDescription className="sr-only">{t('marketing.menuDesc')}</DialogDescription>
          <nav aria-label={t('marketing.mobile')} className="-mx-1 mt-4 flex flex-col">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3.5 text-base font-medium hover:bg-muted">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 pt-2">
            {signedIn ? (
              <Button asChild size="lg"><Link href="/dashboard">{t('marketing.openDashboard')}</Link></Button>
            ) : (
              <>
                <Button asChild size="lg"><Link href="/register">{t('marketing.getStarted')}</Link></Button>
                <Button asChild size="lg" variant="outline"><Link href="/login">{t('marketing.signIn')}</Link></Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
