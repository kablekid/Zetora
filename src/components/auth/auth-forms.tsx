'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import { toast } from '@/lib/toast';
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
import { useT } from '@/i18n/client';
import { Rich } from '@/i18n/rich';

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const t = useT('auth');
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
      toast.success(t('login.welcome'));
      router.replace(res.data?.next ?? '/dashboard');
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field label={t('login.email')} htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder={t('login.emailPlaceholder')} aria-invalid={!!errors.email} {...register('email')} />
      </Field>
      <Field label={t('login.password')} htmlFor="password" error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="current-password" placeholder={t('login.passwordPlaceholder')} aria-invalid={!!errors.password} {...register('password')} />
      </Field>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
          {t('login.forgot')}
        </Link>
      </div>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {t('login.submit')}
      </Button>
    </form>
  );
}

export function RegisterForm() {
  const t = useT('auth');
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
      toast.success(t('register.welcome'));
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
        <h2 className="mt-4 text-lg font-semibold">{t('register.verifyTitle')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          <Rich text={t('register.verifyBody', { email: verifyEmail })} tags={{ b: (c) => <strong className="text-foreground">{c}</strong> }} />
        </p>
        <Button asChild variant="outline" className="mt-5 w-full">
          <Link href="/login">{t('register.goToSignIn')}</Link>
        </Button>
      </div>
    );
  }

  const legalTags = {
    terms: (c: string) => <Link href="/terms" className="font-medium text-foreground underline underline-offset-2">{c}</Link>,
    privacy: (c: string) => <Link href="/privacy" className="font-medium text-foreground underline underline-offset-2">{c}</Link>,
  };
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field label={t('register.fullName')} htmlFor="fullName" error={errors.fullName?.message}>
        <Input id="fullName" autoComplete="name" placeholder={t('register.fullNamePlaceholder')} aria-invalid={!!errors.fullName} {...register('fullName')} />
      </Field>
      <Field label={t('register.email')} htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder={t('login.emailPlaceholder')} aria-invalid={!!errors.email} {...register('email')} />
      </Field>
      <Field label={t('register.password')} htmlFor="password" error={errors.password?.message} hint={t('register.passwordHint')}>
        <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register('password')} />
      </Field>
      <Field label={t('register.confirmPassword')} htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {t('register.submit')}
      </Button>
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        <Rich text={t('register.agree')} tags={legalTags} />
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const t = useT('auth');
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
        <h2 className="mt-4 text-lg font-semibold">{t('forgot.sentTitle')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t('forgot.sentBody')}</p>
        <Button asChild variant="outline" className="mt-5 w-full">
          <Link href="/login">{t('forgot.backToSignIn')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field label={t('forgot.email')} htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder={t('login.emailPlaceholder')} aria-invalid={!!errors.email} {...register('email')} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {t('forgot.submit')}
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const t = useT('auth');
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
      toast.success(t('reset.toast'));
      router.replace('/dashboard');
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field label={t('reset.password')} htmlFor="password" error={errors.password?.message} hint={t('reset.hint')}>
        <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register('password')} />
      </Field>
      <Field label={t('reset.confirm')} htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {t('reset.submit')}
      </Button>
    </form>
  );
}
