'use client';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

/** Asks the server for a short-lived signed URL (only issued when downloads are permitted). */
export function DownloadButton({ resourceId, label = 'Download' }: { resourceId: string; label?: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      variant="outline"
      className="flex-1 sm:flex-none"
      loading={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/resources/${resourceId}?download=1`, { cache: 'no-store' });
          const json = (await res.json()) as { url?: string; error?: string };
          if (!res.ok || !json.url) throw new Error(json.error ?? 'Download is not available.');
          const a = document.createElement('a');
          a.href = json.url;
          a.rel = 'noopener';
          document.body.appendChild(a);
          a.click();
          a.remove();
        } catch (e) {
          toast.error((e as Error).message);
        } finally {
          setLoading(false);
        }
      }}
    >
      <Download /> {label}
    </Button>
  );
}
