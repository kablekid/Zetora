'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { PdfViewer } from './pdf-viewer';
import { trackResourceOpened } from '@/lib/actions/learning';
import { Button } from '@/components/ui/button';

/** Fetches a short-lived signed URL, then renders the file with the right viewer. */
export function ResourceViewer({ resourceId, mime, title }: { resourceId: string; mime: string; title: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setUrl(null);
    setError(null);
    fetch(`/api/resources/${resourceId}`, { cache: 'no-store' })
      .then(async (r) => {
        const j = (await r.json()) as { url?: string; error?: string };
        if (!r.ok || !j.url) throw new Error(j.error ?? 'This file is not available.');
        if (alive) setUrl(j.url);
      })
      .catch((e: Error) => alive && setError(e.message));
    void trackResourceOpened(resourceId);
    return () => { alive = false; };
  }, [resourceId, attempt]);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive-soft text-destructive"><AlertTriangle className="size-6" /></div>
        <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => setAttempt((a) => a + 1)}>Try again</Button>
      </div>
    );
  }
  if (!url) {
    return <div className="flex h-full min-h-60 items-center justify-center gap-3 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin" /> Opening…</div>;
  }
  if (mime.startsWith('image/')) {
    return (
      <div className="flex h-full items-center justify-center overflow-auto rounded-xl border bg-muted/60 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL; Next/Image optimisation would cache it */}
        <img src={url} alt={title} className="max-h-full max-w-full rounded-md object-contain" />
      </div>
    );
  }
  if (mime === 'application/pdf') return <PdfViewer url={url} />;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
      This file type can’t be previewed in the app.
    </div>
  );
}
