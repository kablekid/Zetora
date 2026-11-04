'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { env, isSupabaseConfigured } from '@/lib/env';
import { fail, type ActionResult } from '@/lib/actions-helpers';
import { loginSchema, registerSchema, forgotSchema, resetSchema } from '@/lib/validators/auth';
import { safeNext } from '@/lib/utils';

async function siteOrigin() {
  const h = await headers();
  const origin = h.get('origin');
  if (origin) return origin;
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'https';
  return host ? `${proto}://${host}` : env.siteUrl;
}

const NOT_CONFIGURED = 'Zetora is not connected to a database yet. See the README for setup steps.';

export async function signInAction(input: unknown): Promise<ActionResult<{ next: string }>> {
  if (!isSupabaseConfigured) return { ok: false, error: NOT_CONFIGURED };
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check your details.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    if (/email not confirmed/i.test(error.message)) {
      return { ok: false, error: 'Please verify your email address first — check your inbox for the confirmation link.' };
    }
    return { ok: false, error: 'Incorrect email or password.' };
  }
  return { ok: true, data: { next: safeNext(parsed.data.next) } };
}

export async function signUpAction(
  input: unknown,
): Promise<ActionResult<{ needsVerification: boolean; email: string }>> {
  if (!isSupabaseConfigured) return { ok: false, error: NOT_CONFIGURED };
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check your details.' };

  const supabase = await createClient();
  const origin = await siteOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Only a display name travels as metadata. The role is assigned by the database, never the client.
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });
  if (error) {
    if (/already registered|already been registered/i.test(error.message)) {
      return { ok: false, error: 'An account with this email already exists. Try signing in instead.' };
    }
    return fail(error.message);
  }
  // Supabase returns an empty identities array for an already-registered email when confirmations are on.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { ok: false, error: 'An account with this email already exists. Try signing in instead.' };
  }
  return { ok: true, data: { needsVerification: !data.session, email: parsed.data.email } };
}

export async function requestPasswordResetAction(input: unknown): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: NOT_CONFIGURED };
  const parsed = forgotSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Enter a valid email.' };
  const supabase = await createClient();
  const origin = await siteOrigin();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  // Always succeed: don't reveal whether an address is registered.
  return { ok: true };
}

export async function updatePasswordAction(input: unknown): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: NOT_CONFIGURED };
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check your password.' };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false, error: 'This reset link has expired. Please request a new one.' };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return fail(error.message);
  return { ok: true };
}
