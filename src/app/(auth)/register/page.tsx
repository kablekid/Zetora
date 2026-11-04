import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/auth-forms';

export const metadata: Metadata = { title: 'Create your account' };

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
      <p className="mb-7 mt-1.5 text-sm text-muted-foreground">Free for Grade 12 remedial students. It takes less than a minute.</p>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
