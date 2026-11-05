import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { ChangePasswordForm, ProfileForm } from '@/components/settings/settings-forms';
import { requireUser } from '@/lib/auth';
import { getT, pageTitle } from '@/i18n/server';
import { ThemeSelect } from '@/components/theme-toggle';
import { LanguageSelect } from '@/components/language-switcher';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('settings') };
}

export default async function SettingsPage() {
  const [{ profile, user }, t] = await Promise.all([requireUser(), getT('settings')]);
  return (
    <div className="animate-fade-up">
      <PageHeader title={t('title')} description={t('description')} />
      <div className="grid max-w-3xl gap-6">
        <Card><CardContent>
          <h2 className="mb-5 text-base font-semibold">{t('profile')}</h2>
          <ProfileForm userId={user.id} initial={{ fullName: profile.full_name, email: profile.email, school: profile.school ?? '', location: profile.location ?? '', avatarUrl: profile.avatar_url }} />
        </CardContent></Card>
        <Card><CardContent>
          <h2 className="mb-1 text-base font-semibold">{t('appearance')}</h2>
          <p className="mb-4 text-sm text-muted-foreground">{t('appearanceHint')}</p>
          <ThemeSelect />
        </CardContent></Card>
        <Card><CardContent>
          <h2 className="mb-1 text-base font-semibold">{t('language')}</h2>
          <p className="mb-4 text-sm text-muted-foreground">{t('languageHint')}</p>
          <LanguageSelect />
        </CardContent></Card>
        <Card><CardContent>
          <h2 className="mb-5 text-base font-semibold">{t('password')}</h2>
          <ChangePasswordForm />
        </CardContent></Card>
      </div>
    </div>
  );
}
