import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ResetPasswordForm } from '@/components/auth/auth-forms';
import { getUser } from '@/lib/auth';
import { getT, pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('reset') };
}

export default async function ResetPasswordPage() {
  // The e-mail link signs the user in via /auth/callback first.
  const user = await getUser();
  if (!user) redirect('/login?error=link');
  const t = await getT('auth');
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t('reset.title')}</h1>
      <p className="mb-7 mt-1.5 text-sm text-muted-foreground">{t('reset.subtitle')}</p>
      <ResetPasswordForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/dashboard" className="font-semibold text-primary hover:underline">{t('reset.skip')}</Link>
      </p>
    </div>
  );
}
