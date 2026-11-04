'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { BookmarkX } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { toggleBookmark } from '@/lib/actions/learning';

export function RemoveBookmark({ unitId }: { unitId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      loading={pending}
      aria-label="Remove bookmark"
      onClick={() =>
        start(async () => {
          const res = await toggleBookmark(unitId);
          if (!res.ok) return void toast.error(res.error);
          toast.success('Bookmark removed');
          router.refresh();
        })
      }
    >
      {!pending && <BookmarkX />}
    </Button>
  );
}
