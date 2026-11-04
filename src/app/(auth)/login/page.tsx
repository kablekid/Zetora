import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/auth-forms';

export const metadata: Metadata = { title: 'Sign in' };

const ERRORS: Record<string, string> = {
  link: 'That link has expired or was already used. Please try again.',
  suspended: 'This account has been suspended. Please contact support.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mb-7 mt-1.5 text-sm text-muted-foreground">Sign in to continue learning.</p>
      <LoginForm next={next} initialError={error ? ERRORS[error] : undefined} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Zetora?{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
