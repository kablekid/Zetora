'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { assertUser } from '@/lib/auth';
import { fail, type ActionResult } from '@/lib/actions-helpers';
import { env } from '@/lib/env';

const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(120),
  school: z.string().trim().max(160).optional().or(z.literal('')),
  location: z.string().trim().max(160).optional().or(z.literal('')),
});

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Check your details.');
    const { supabase, user } = await assertUser();
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: parsed.data.fullName,
        school: parsed.data.school || null,
        location: parsed.data.location || null,
      })
      .eq('id', user.id);
    if (error) return fail(error);
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Profile updated' };
  } catch (e) {
    return fail(e);
  }
}

/** Called after the browser uploaded the image straight to storage under avatars/<uid>/. */
export async function setAvatarAction(storagePath: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertUser();
    if (!storagePath.startsWith(`avatars/${user.id}/`) || storagePath.includes('..')) return fail('Invalid image path.');
    const publicUrl = `${env.supabaseUrl}/storage/v1/object/public/media/${storagePath}`;
    const { error } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
    if (error) return fail(error);
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Profile picture updated' };
  } catch (e) {
    return fail(e);
  }
}

export async function removeAvatarAction(): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertUser();
    const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);
    if (error) return fail(error);
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Profile picture removed' };
  } catch (e) {
    return fail(e);
  }
}
