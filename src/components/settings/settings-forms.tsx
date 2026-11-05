'use client';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/ui/avatar';
import { Field } from '@/components/forms/field';
import { PasswordInput } from '@/components/forms/password-input';
import { FormError } from '@/components/forms/form-error';
import { createClient } from '@/lib/supabase/client';
import { resizeImage } from '@/lib/image';
import { MEDIA_BUCKET, MAX_IMAGE_BYTES } from '@/lib/constants';
import { removeAvatarAction, setAvatarAction, updateProfileAction } from '@/lib/actions/profile';
import { updatePasswordAction } from '@/lib/actions/auth';
import { resetSchema, type ResetInput } from '@/lib/validators/auth';
import { useT } from '@/i18n/client';

const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(120),
  school: z.string().trim().max(160),
  location: z.string().trim().max(160),
});
type ProfileInput = z.infer<typeof profileSchema>;

export function ProfileForm({ userId, initial }: { userId: string; initial: { fullName: string; email: string; school: string; location: string; avatarUrl: string | null } }) {
  const router = useRouter();
  const t = useT('settings');
  const tc = useT('common');
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [avatar, setAvatar] = useState(initial.avatarUrl);
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: initial.fullName, school: initial.school, location: initial.location },
  });

  const onSubmit = handleSubmit((values) =>
    start(async () => {
      const res = await updateProfileAction(values);
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message ?? t('saved'));
      router.refresh();
    }),
  );

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) return void toast.error(t('avatar.tooBig'));
    setUploading(true);
    try {
      const { blob, ext, type } = await resizeImage(file, 512, 0.85);
      if (blob.size > MAX_IMAGE_BYTES) throw new Error(t('avatar.tooLarge'));
      const path = `avatars/${userId}/${crypto.randomUUID()}.${ext}`;
      const supabase = createClient();
      const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, blob, { contentType: type, upsert: false, cacheControl: '31536000' });
      if (error) throw new Error(error.message);
      const res = await setAvatarAction(path);
      if (!res.ok) throw new Error(res.error);
      setAvatar(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`);
      toast.success(t('avatar.updated'));
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message || t('avatar.failed'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="flex items-center gap-4">
        <UserAvatar name={initial.fullName} src={avatar} size={72} />
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}><Camera /> {avatar ? t('avatar.change') : t('avatar.upload')}</Button>
            {avatar && (
              <Button type="button" variant="ghost" size="sm" onClick={async () => { const r = await removeAvatarAction(); if (!r.ok) return void toast.error(r.error); setAvatar(null); toast.success(t('avatar.removed')); router.refresh(); }}><Trash2 /> {t('avatar.remove')}</Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{t('avatar.hint')}</p>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} aria-label={t('avatar.fileLabel')} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('fields.fullName')} htmlFor="fullName" error={errors.fullName?.message} className="sm:col-span-2">
          <Input id="fullName" autoComplete="name" aria-invalid={!!errors.fullName} {...register('fullName')} />
        </Field>
        <Field label={t('fields.email')} htmlFor="email" hint={t('fields.emailHint')} className="sm:col-span-2">
          <Input id="email" value={initial.email} readOnly disabled />
        </Field>
        <Field label={t('fields.school')} htmlFor="school" optional error={errors.school?.message}>
          <Input id="school" autoComplete="organization" {...register('school')} />
        </Field>
        <Field label={t('fields.location')} htmlFor="location" optional error={errors.location?.message}>
          <Input id="location" placeholder={t('fields.locationPlaceholder')} {...register('location')} />
        </Field>
      </div>
      <Button type="submit" loading={pending}>{tc('actions.saveChanges')}</Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const t = useT('settings');
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ResetInput>({ resolver: zodResolver(resetSchema), defaultValues: { password: '', confirmPassword: '' } });
  const onSubmit = handleSubmit((values) =>
    start(async () => {
      setError(null);
      const res = await updatePasswordAction(values);
      if (!res.ok) return setError(res.error);
      toast.success(t('pw.updated'));
      reset();
    }),
  );
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field label={t('pw.newPassword')} htmlFor="newPassword" error={errors.password?.message} hint={t('pw.hint')}>
        <PasswordInput id="newPassword" autoComplete="new-password" aria-invalid={!!errors.password} {...register('password')} />
      </Field>
      <Field label={t('pw.confirm')} htmlFor="confirmNewPassword" error={errors.confirmPassword?.message}>
        <PasswordInput id="confirmNewPassword" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
      </Field>
      <Button type="submit" variant="outline" loading={pending}>{t('pw.update')}</Button>
    </form>
  );
}
