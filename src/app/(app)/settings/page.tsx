import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { ChangePasswordForm, ProfileForm } from '@/components/settings/settings-forms';
import { requireUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const { profile, user } = await requireUser();
  return (
    <div className="animate-fade-up">
      <PageHeader title="Profile & settings" description="Manage how you appear in Zetora and keep your account secure." />
      <div className="grid max-w-3xl gap-6">
        <Card><CardContent>
          <h2 className="mb-5 text-base font-semibold">Your profile</h2>
          <ProfileForm userId={user.id} initial={{ fullName: profile.full_name, email: profile.email, school: profile.school ?? '', location: profile.location ?? '', avatarUrl: profile.avatar_url }} />
        </CardContent></Card>
        <Card><CardContent>
          <h2 className="mb-5 text-base font-semibold">Password</h2>
          <ChangePasswordForm />
        </CardContent></Card>
      </div>
    </div>
  );
}
