import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/auth-forms';
import { getT, pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('signIn') };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const [{ next, error }, t] = await Promise.all([searchParams, getT('auth')]);
  const initialError = error === 'link' ? t('login.errors.link') : error === 'suspended' ? t('login.errors.suspended') : undefined;
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t('login.title')}</h1>
      <p className="mb-7 mt-1.5 text-sm text-muted-foreground">{t('login.subtitle')}</p>
      <LoginForm next={next} initialError={initialError} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('login.newHere')}{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">{t('login.createAccount')}</Link>
      </p>
    </div>
  );
}
