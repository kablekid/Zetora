import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { UserAvatar } from '@/components/ui/avatar';
import { AnnouncementForm, RemoveDemoButton } from '@/components/admin/settings-forms';
import { requireAdmin } from '@/lib/auth';
import { getT, pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('adminPages.settings') };
}

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin();
  const [t, tm] = await Promise.all([getT('admin'), getT('meta')]);
  const [{ data: admins }, { count: demoSubjects }] = await Promise.all([
    supabase.from('profiles').select('id,full_name,email,is_active').eq('role', 'admin').order('created_at'),
    supabase.from('subjects').select('id', { count: 'exact', head: true }).eq('is_demo', true),
  ]);
  return (
    <div className="animate-fade-up">
      <PageHeader title={tm('adminPages.settings')} description={t('pages.settings.description')} />
      <div className="grid max-w-3xl gap-6">
        <Card><CardContent>
          <h2 className="mb-1 text-base font-semibold">{t('pages.settings.announcement')}</h2>
          <p className="mb-5 text-sm text-muted-foreground">{t('pages.settings.announcementBody')}</p>
          <AnnouncementForm />
        </CardContent></Card>

        <Card><CardContent>
          <h2 className="mb-1 text-base font-semibold">{t('pages.settings.admins')}</h2>
          <p className="mb-4 text-sm text-muted-foreground">{t('pages.settings.adminsBody')}</p>
          <ul className="divide-y">
            {((admins ?? []) as Array<{ id: string; full_name: string; email: string; is_active: boolean }>).map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3"><UserAvatar name={a.full_name} size={36} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{a.full_name || a.email}</p><p className="truncate text-xs text-muted-foreground">{a.email}</p></div>{!a.is_active && <Badge variant="destructive">{t('pages.settings.suspended')}</Badge>}</li>
            ))}
          </ul>
        </CardContent></Card>

        <Card><CardContent>
          <h2 className="mb-1 text-base font-semibold">{t('pages.settings.demo')}</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            {(demoSubjects ?? 0) > 0
              ? t('pages.settings.demoSome')
              : t('pages.settings.demoNone')}
          </p>
          {(demoSubjects ?? 0) > 0 && <RemoveDemoButton />}
        </CardContent></Card>
      </div>
    </div>
  );
}
