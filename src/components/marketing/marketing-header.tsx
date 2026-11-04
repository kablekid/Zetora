'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/#subjects', label: 'Explore subjects' },
  { href: '/#features', label: 'Features' },
  { href: '/about', label: 'About' },
];

export function MarketingHeader({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {signedIn ? (
            <Button asChild><Link href="/dashboard">Open dashboard</Link></Button>
          ) : (
            <>
              <Button asChild variant="ghost"><Link href="/login">Sign in</Link></Button>
              <Button asChild><Link href="/register">Get started</Link></Button>
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></Button>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle className="sr-only">Menu</DialogTitle>
          <DialogDescription className="sr-only">Site navigation</DialogDescription>
          <nav aria-label="Mobile" className="-mx-1 mt-4 flex flex-col">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3.5 text-base font-medium hover:bg-muted">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 pt-2">
            {signedIn ? (
              <Button asChild size="lg"><Link href="/dashboard">Open dashboard</Link></Button>
            ) : (
              <>
                <Button asChild size="lg"><Link href="/register">Get started</Link></Button>
                <Button asChild size="lg" variant="outline"><Link href="/login">Sign in</Link></Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
