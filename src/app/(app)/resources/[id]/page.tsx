import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResourceViewer } from '@/components/viewer/resource-viewer';
import { DownloadButton } from '@/components/learn/download-button';
import { createClient } from '@/lib/supabase/server';
import { one } from '@/lib/queries/student';
import { formatBytes } from '@/lib/utils';
import { getT, pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('material') };
}

export default async function ResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [supabase, t, tl] = await Promise.all([createClient(), getT('viewer'), getT('learn')]);
  const { data } = await supabase
    .from('learning_resources')
    .select('id,title,description,mime_type,file_size,allow_download,unit_id,units(id,number,title),subjects(slug,title)')
    .eq('id', id)
    .maybeSingle();
  if (!data) notFound();
  const r = data as unknown as {
    id: string; title: string; description: string; mime_type: string; file_size: number; allow_download: boolean; unit_id: string | null;
    units: { id: string; number: number; title: string } | { id: string; number: number; title: string }[] | null;
    subjects: { slug: string; title: string } | { slug: string; title: string }[] | null;
  };
  const unit = one(r.units);
  const subject = one(r.subjects);
  const back = subject ? (unit ? `/subjects/${subject.slug}/units/${unit.id}?tab=materials` : `/subjects/${subject.slug}`) : '/subjects';

  return (
    // Fill the viewport below the header on every device; the viewer scrolls internally.
    <div className="-mb-24 flex h-[calc(100dvh-8.5rem)] flex-col gap-4 lg:-mb-8 lg:h-[calc(100dvh-7.5rem)]">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="icon-sm" aria-label={t('backToMaterials')}><Link href={back}><ArrowLeft /></Link></Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">{r.title}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {subject?.title}{unit ? ` · ${tl('pager.line', { n: unit.number, title: unit.title })}` : ''} · {formatBytes(r.file_size)}
          </p>
        </div>
        {r.allow_download && <DownloadButton resourceId={r.id} />}
      </div>
      <div className="min-h-0 flex-1">
        <ResourceViewer resourceId={r.id} mime={r.mime_type} title={r.title} />
      </div>
    </div>
  );
}
