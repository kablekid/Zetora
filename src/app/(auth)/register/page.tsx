import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/auth-forms';
import { getT, pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('register') };
}

export default async function RegisterPage() {
  const t = await getT('auth');
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t('register.title')}</h1>
      <p className="mb-7 mt-1.5 text-sm text-muted-foreground">{t('register.subtitle')}</p>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('register.haveAccount')}{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">{t('register.signIn')}</Link>
      </p>
    </div>
  );
}
