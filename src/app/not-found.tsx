import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { getT, pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('notFound') };
}

export default async function NotFound() {
  const t = await getT('common');
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
      <Logo />
      <div className="mt-12 flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Compass className="size-8" />
      </div>
      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{t('pages.notFound.heading')}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">{t('pages.notFound.body')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/dashboard">{t('pages.notFound.dashboard')}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">{t('pages.notFound.home')}</Link>
        </Button>
      </div>
    </div>
  );
}
