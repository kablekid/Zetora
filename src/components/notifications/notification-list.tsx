'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, ClipboardCheck, FolderOpen, Library, ListChecks, Megaphone } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { markAllNotificationsRead, markNotificationRead } from '@/lib/actions/learning';
import { cn } from '@/lib/utils';
import { useFormat, useT } from '@/i18n/client';
import type { NotificationItem } from '@/lib/types';

const ICON = { subject: Library, material: FolderOpen, quiz: ListChecks, exam: ClipboardCheck, announcement: Megaphone } as const;

export function NotificationList({ items }: { items: NotificationItem[] }) {
  const router = useRouter();
  const t = useT('notifications');
  const f = useFormat();
  const [read, setRead] = useState<Set<string>>(() => new Set(items.filter((i) => i.is_read).map((i) => i.id)));
  const [pending, start] = useTransition();
  const unread = items.filter((i) => !read.has(i.id)).length;

  /** Content notifications are built from the reader's language; announcements keep the text an admin wrote. */
  function headline(n: NotificationItem) {
    const name = n.params?.name;
    return name && n.kind !== 'announcement' ? t(`templates.${n.kind}`, { name }) : n.title;
  }

  function open(n: NotificationItem) {
    if (!read.has(n.id)) {
      setRead((s) => new Set(s).add(n.id));
      void markNotificationRead(n.id).then(() => router.refresh());
    }
    if (n.link) router.push(n.link);
  }

  if (!items.length) {
    return <EmptyState icon={<Bell />} title={t('emptyTitle')} description={t('emptyBody')} />;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{unread ? t('unread', { count: unread }) : t('allRead')}</p>
        <Button
          variant="outline"
          size="sm"
          disabled={unread === 0}
          loading={pending}
          onClick={() =>
            start(async () => {
              const res = await markAllNotificationsRead();
              if (!res.ok) return void toast.error(res.error);
              setRead(new Set(items.map((i) => i.id)));
              router.refresh();
            })
          }
        >
          <CheckCheck /> {t('markAll')}
        </Button>
      </div>
      <ul className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
        {items.map((n) => {
          const Icon = ICON[n.kind] ?? Bell;
          const isRead = read.has(n.id);
          return (
            <li key={n.id} className="border-b last:border-b-0">
              <button type="button" onClick={() => open(n)} className={cn('flex w-full items-start gap-3.5 px-4 py-4 text-start transition-colors hover:bg-muted/50 sm:px-5', !isRead && 'bg-primary-soft/40')}>
                <span className={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full', isRead ? 'bg-muted text-muted-foreground' : 'bg-primary-soft text-primary')}><Icon className="size-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-sm leading-snug', isRead ? 'font-medium' : 'font-semibold')}>{headline(n)}</span>
                  {n.body && <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">{n.body}</span>}
                  <span className="mt-1 block text-xs text-muted-foreground">{f.timeAgo(n.created_at)}</span>
                </span>
                {!isRead && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label={t('unreadAria')} />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
