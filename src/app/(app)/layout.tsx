import { AppShell } from '@/components/layout/app-shell';
import { requireUser } from '@/lib/auth';
import { getUnreadCount } from '@/lib/queries/student';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireUser();
  const unread = await getUnreadCount();
  return (
    <AppShell profile={profile} unread={unread}>
      {children}
    </AppShell>
  );
}
