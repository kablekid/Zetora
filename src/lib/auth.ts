import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';
import type { Profile } from '@/lib/types';

/** The verified user for this request (validated with the Auth server, not just the cookie). */
export const getUser = cache(async () => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id,email,full_name,avatar_url,school,location,role,is_active,created_at')
    .eq('id', user.id)
    .maybeSingle();
  return (data as Profile | null) ?? null;
});

/** Signed-in students and admins. Redirects anonymous visitors to /login. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect('/login');
  const profile = await getProfile();
  if (!profile) redirect('/login');
  if (!profile.is_active) redirect('/auth/suspended');
  return { user, profile, supabase: await createClient() };
}

/** Admins only. Non-admins are sent to the student dashboard. */
export async function requireAdmin() {
  const ctx = await requireUser();
  if (ctx.profile.role !== 'admin') redirect('/dashboard');
  return ctx;
}

/**
 * For server actions: never redirect, throw a plain error the action wrapper
 * turns into a friendly message. The role comes from the database, never the client.
 */
export async function assertUser() {
  const user = await getUser();
  if (!user) throw new Error('Please sign in to continue.');
  const profile = await getProfile();
  if (!profile || !profile.is_active) throw new Error('Your account is not active.');
  return { user, profile, supabase: await createClient() };
}

export async function assertAdmin() {
  const ctx = await assertUser();
  if (ctx.profile.role !== 'admin') throw new Error('Administrator access required.');
  return ctx;
}
