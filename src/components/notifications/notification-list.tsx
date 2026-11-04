'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, ClipboardCheck, FolderOpen, Library, ListChecks, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { markAllNotificationsRead, markNotificationRead } from '@/lib/actions/learning';
import { cn, timeAgo } from '@/lib/utils';
import type { NotificationItem } from '@/lib/types';

const ICON = { subject: Library, material: FolderOpen, quiz: ListChecks, exam: ClipboardCheck, announcement: Megaphone } as const;

export function NotificationList({ items }: { items: NotificationItem[] }) {
  const router = useRouter();
  const [read, setRead] = useState<Set<string>>(() => new Set(items.filter((i) => i.is_read).map((i) => i.id)));
  const [pending, start] = useTransition();
  const unread = items.filter((i) => !read.has(i.id)).length;

  function open(n: NotificationItem) {
    if (!read.has(n.id)) {
      setRead((s) => new Set(s).add(n.id));
      void markNotificationRead(n.id).then(() => router.refresh());
    }
    if (n.link) router.push(n.link);
  }

  if (!items.length) {
    return <EmptyState icon={<Bell />} title="You’re all caught up" description="New subjects, materials, quizzes and announcements will appear here." />;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{unread ? `${unread} unread` : 'All read'}</p>
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
          <CheckCheck /> Mark all as read
        </Button>
      </div>
      <ul className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
        {items.map((n) => {
          const Icon = ICON[n.kind] ?? Bell;
          const isRead = read.has(n.id);
          return (
            <li key={n.id} className="border-b last:border-b-0">
              <button type="button" onClick={() => open(n)} className={cn('flex w-full items-start gap-3.5 px-4 py-4 text-left transition-colors hover:bg-muted/50 sm:px-5', !isRead && 'bg-primary-soft/40')}>
                <span className={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full', isRead ? 'bg-muted text-muted-foreground' : 'bg-primary-soft text-primary')}><Icon className="size-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-sm leading-snug', isRead ? 'font-medium' : 'font-semibold')}>{n.title}</span>
                  {n.body && <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">{n.body}</span>}
                  <span className="mt-1 block text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
                </span>
                {!isRead && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
