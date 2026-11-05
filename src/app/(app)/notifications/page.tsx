import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { NotificationList } from '@/components/notifications/notification-list';
import { getNotifications } from '@/lib/queries/student';
import { getT, pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('notifications') };
}

export default async function NotificationsPage() {
  const [items, t] = await Promise.all([getNotifications(50), getT('notifications')]);
  return (
    <div className="animate-fade-up">
      <PageHeader title={t('title')} description={t('description')} />
      <NotificationList items={items} />
      <p className="mt-6 text-xs text-muted-foreground">{t('footnote')}</p>
    </div>
  );
}
