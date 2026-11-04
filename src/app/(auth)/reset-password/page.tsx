import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ResetPasswordForm } from '@/components/auth/auth-forms';
import { getUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Choose a new password' };

export default async function ResetPasswordPage() {
  // The e-mail link signs the user in via /auth/callback first.
  const user = await getUser();
  if (!user) redirect('/login?error=link');
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Choose a new password</h1>
      <p className="mb-7 mt-1.5 text-sm text-muted-foreground">Pick something you haven’t used before.</p>
      <ResetPasswordForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/dashboard" className="font-semibold text-primary hover:underline">Skip for now</Link>
      </p>
    </div>
  );
}
