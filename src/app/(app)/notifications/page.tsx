import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { NotificationList } from '@/components/notifications/notification-list';
import { getNotifications } from '@/lib/queries/student';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const items = await getNotifications(50);
  return (
    <div className="animate-fade-up">
      <PageHeader title="Notifications" description="New subjects, materials, quizzes and announcements." />
      <NotificationList items={items} />
      <p className="mt-6 text-xs text-muted-foreground">Notifications appear inside Zetora when you open it. Push notifications to your phone are not enabled yet.</p>
    </div>
  );
}
