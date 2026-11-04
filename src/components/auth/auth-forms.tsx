'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/forms/field';
import { PasswordInput } from '@/components/forms/password-input';
import { FormError } from '@/components/forms/form-error';
import {
  forgotSchema, loginSchema, registerSchema, resetSchema,
  type ForgotInput, type LoginInput, type RegisterInput, type ResetInput,
} from '@/lib/validators/auth';
import { requestPasswordResetAction, signInAction, signUpAction, updatePasswordAction } from '@/lib/actions/auth';

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(initialError ?? null);
  const {
    register, handleSubmit, formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '', next } });

  const onSubmit = handleSubmit((values) => {
    setError(null);
    start(async () => {
      const res = await signInAction(values);
      if (!res.ok) return setError(res.error);
      toast.success('Welcome back!');
      router.replace(res.data?.next ?? '/dashboard');
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} {...register('email')} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="current-password" placeholder="Your password" aria-invalid={!!errors.password} {...register('password')} />
      </Field>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Sign in
      </Button>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const {
    register, handleSubmit, formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit((values) => {
    setError(null);
    start(async () => {
      const res = await signUpAction(values);
      if (!res.ok) return setError(res.error);
      if (res.data?.needsVerification) return setVerifyEmail(res.data.email);
      toast.success('Account created — welcome to Zetora!');
      router.replace('/dashboard');
      router.refresh();
    });
  });

  if (verifyEmail) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-success-soft text-success">
          <MailCheck className="size-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Check your email</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a confirmation link to <strong className="text-foreground">{verifyEmail}</strong>. Open it to activate your account, then sign in.
        </p>
        <Button asChild variant="outline" className="mt-5 w-full">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
        <Input id="fullName" autoComplete="name" placeholder="e.g. Hana Bekele" aria-invalid={!!errors.fullName} {...register('fullName')} />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} {...register('email')} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters, with a letter and a number.">
        <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register('password')} />
      </Field>
      <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Create account
      </Button>
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        By creating an account you agree to our{' '}
        <Link href="/terms" className="font-medium text-foreground underline underline-offset-2">Terms</Link> and{' '}
        <Link href="/privacy" className="font-medium text-foreground underline underline-offset-2">Privacy Policy</Link>.
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register, handleSubmit, formState: { errors },
  } = useForm<ForgotInput>({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } });

  const onSubmit = handleSubmit((values) => {
    setError(null);
    start(async () => {
      const res = await requestPasswordResetAction(values);
      if (!res.ok) return setError(res.error);
      setSent(true);
    });
  });

  if (sent) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-success-soft text-success">
          <MailCheck className="size-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Check your email</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists for that address, a password reset link is on its way. It may take a minute to arrive.
        </p>
        <Button asChild variant="outline" className="mt-5 w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} {...register('email')} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Send reset link
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const {
    register, handleSubmit, formState: { errors },
  } = useForm<ResetInput>({ resolver: zodResolver(resetSchema), defaultValues: { password: '', confirmPassword: '' } });

  const onSubmit = handleSubmit((values) => {
    setError(null);
    start(async () => {
      const res = await updatePasswordAction(values);
      if (!res.ok) return setError(res.error);
      toast.success('Password updated.');
      router.replace('/dashboard');
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field label="New password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters, with a letter and a number.">
        <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register('password')} />
      </Field>
      <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Update password
      </Button>
    </form>
  );
}
