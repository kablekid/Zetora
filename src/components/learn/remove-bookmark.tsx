'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { BookmarkX } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { toggleBookmark } from '@/lib/actions/learning';
import { useT } from '@/i18n/client';

export function RemoveBookmark({ unitId }: { unitId: string }) {
  const router = useRouter();
  const t = useT('learn');
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      loading={pending}
      aria-label={t('header.removeBookmark')}
      onClick={() =>
        start(async () => {
          const res = await toggleBookmark(unitId);
          if (!res.ok) return void toast.error(res.error);
          toast.success(t('header.bookmarkRemoved'));
          router.refresh();
        })
      }
    >
      {!pending && <BookmarkX />}
    </Button>
  );
}
