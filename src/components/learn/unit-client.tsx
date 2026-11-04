'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, BookmarkCheck, CheckCircle2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { saveReadingProgress, setUnitCompleted, toggleBookmark, trackSummaryRead, trackUnitOpened } from '@/lib/actions/learning';
import { cn } from '@/lib/utils';

/** Records that the unit was opened (once per mount). Renders nothing. */
export function UnitOpenedTracker({ unitId }: { unitId: string }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void trackUnitOpened(unitId);
  }, [unitId]);
  return null;
}

export function BookmarkButton({ unitId, initial }: { unitId: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      loading={pending}
      aria-pressed={on}
      onClick={() =>
        start(async () => {
          const res = await toggleBookmark(unitId);
          if (!res.ok) return void toast.error(res.error);
          setOn(res.data?.bookmarked ?? !on);
          toast.success(res.message ?? 'Updated');
        })
      }
    >
      {on ? <BookmarkCheck className="text-primary" /> : <Bookmark />}
      {on ? 'Bookmarked' : 'Bookmark'}
    </Button>
  );
}

export function CompleteButton({
  unitId,
  completed,
  size = 'sm',
  className,
}: {
  unitId: string;
  completed: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant={completed ? 'outline' : 'default'}
      size={size}
      className={className}
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await setUnitCompleted(unitId, !completed);
          if (!res.ok) return void toast.error(res.error);
          toast.success(res.message ?? 'Saved');
          router.refresh();
        })
      }
    >
      {completed ? <Undo2 /> : <CheckCircle2 />}
      {completed ? 'Mark as not completed' : 'Mark as completed'}
    </Button>
  );
}

/**
 * Wraps the (server-rendered) summary. Shows a thin reading-progress bar,
 * saves progress as the student scrolls (forward only) and logs the read.
 */
export function ReadingTracker({
  unitId,
  initial,
  completed,
  children,
}: {
  unitId: string;
  initial: number;
  completed: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(completed ? 100 : initial);
  const lastSaved = useRef(initial);

  useEffect(() => {
    void trackSummaryRead(unitId);
  }, [unitId]);

  useEffect(() => {
    let raf = 0;
    const compute = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.4;
      const seen = window.innerHeight * 0.6 - rect.top;
      const value = total <= 0 ? 100 : Math.max(0, Math.min(100, Math.round((seen / Math.max(total, 1)) * 100)));
      setProgress((prev) => (completed ? 100 : Math.max(prev, value)));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [completed]);

  // Persist progress at most every few seconds, only when it moved forward meaningfully.
  useEffect(() => {
    if (completed) return;
    const t = setTimeout(() => {
      if (progress >= lastSaved.current + 5 || (progress >= 95 && lastSaved.current < 95)) {
        lastSaved.current = progress;
        void saveReadingProgress(unitId, progress);
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [progress, unitId, completed]);

  return (
    <div ref={ref}>
      <div
        className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent"
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div className={cn('h-full transition-[width] duration-300', completed ? 'bg-success' : 'bg-primary')} style={{ width: `${progress}%` }} />
      </div>
      {children}
    </div>
  );
}
