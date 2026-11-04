import type { Metadata } from 'next';
import { AdminShell } from '@/components/layout/admin-shell';
import { requireAdmin } from '@/lib/auth';

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · Zetora Admin' }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate: role comes from the database, never from the client.
  const { profile } = await requireAdmin();
  return (
    <AdminShell name={profile.full_name || profile.email} email={profile.email} avatarUrl={profile.avatar_url}>
      {children}
    </AdminShell>
  );
}
