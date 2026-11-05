import type { Metadata } from 'next';
import { AdminShell } from '@/components/layout/admin-shell';
import { requireAdmin } from '@/lib/auth';
import { ADMIN_CLIENT_NAMESPACES } from '@/i18n/config';
import { I18nProvider } from '@/i18n/client';
import { getLocale, getT, pickMessages } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('meta');
  return { title: { default: t('admin'), template: `%s · Zetora ${t('admin')}` }, robots: { index: false, follow: false } };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate: role comes from the database, never from the client.
  const { profile } = await requireAdmin();
  const [locale, messages] = await Promise.all([getLocale(), pickMessages(ADMIN_CLIENT_NAMESPACES)]);
  return (
    // The admin message group is only sent to administrators.
    <I18nProvider locale={locale} messages={messages}>
      <AdminShell name={profile.full_name || profile.email} email={profile.email} avatarUrl={profile.avatar_url}>
        {children}
      </AdminShell>
    </I18nProvider>
  );
}
