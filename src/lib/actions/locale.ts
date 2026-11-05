'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { LOCALE_COOKIE, isLocale } from '@/i18n/config';

/** Remember the language on this device (cookie) and, when signed in, on the account. */
export async function setLocaleAction(locale: string): Promise<{ ok: boolean }> {
  if (!isLocale(locale)) return { ok: false };
  (await cookies()).set(LOCALE_COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  const user = await getUser();
  if (user) {
    const supabase = await createClient();
    await supabase.from('profiles').update({ locale }).eq('id', user.id);
  }
  revalidatePath('/', 'layout');
  return { ok: true };
}
