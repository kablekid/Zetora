import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth/auth-forms';
import { getT, pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('forgot') };
}

export default async function ForgotPasswordPage() {
  const t = await getT('auth');
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t('forgot.title')}</h1>
      <p className="mb-7 mt-1.5 text-sm text-muted-foreground">{t('forgot.subtitle')}</p>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('forgot.remembered')} <Link href="/login" className="font-semibold text-primary hover:underline">{t('forgot.backToSignIn')}</Link>
      </p>
    </div>
  );
}
