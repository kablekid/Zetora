import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Layers, PenLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/page-header';
import { requireAdmin } from '@/lib/auth';
import { getFormat, getT, pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('adminPages.summaries') };
}

export default async function AdminSummariesPage() {
  const { supabase } = await requireAdmin();
  const [t, tc, tm, f] = await Promise.all([getT('admin'), getT('common'), getT('meta'), getFormat()]);
  const [{ data: subjects }, { data: units }, { data: summaries }] = await Promise.all([
    supabase.from('subjects').select('id,title').order('position').order('title'),
    supabase.from('units').select('id,subject_id,number,title,position,is_published').order('position'),
    supabase.from('summaries').select('unit_id,status,word_count,updated_at'),
  ]);
  const sums = new Map((summaries ?? []).map((s: { unit_id: string; status: string; word_count: number; updated_at: string }) => [s.unit_id, s]));
  const list = (subjects ?? []) as Array<{ id: string; title: string }>;
  const all = (units ?? []) as Array<{ id: string; subject_id: string; number: number; title: string; is_published: boolean }>;

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader title={tm('adminPages.summaries')} description={t('pages.summaries.description')} />
      {all.length === 0 ? (
        <EmptyState icon={<Layers />} title={t('pages.summaries.emptyTitle')} description={t('pages.summaries.emptyBody')} action={<Button asChild><Link href="/admin/units">{t('pages.summaries.goToUnits')}</Link></Button>} />
      ) : (
        list.map((s) => {
          const us = all.filter((u) => u.subject_id === s.id);
          if (!us.length) return null;
          return (
            <section key={s.id} aria-labelledby={`s-${s.id}`}>
              <h2 id={`s-${s.id}`} className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{s.title}</h2>
              <ul className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
                {us.map((u) => {
                  const sum = sums.get(u.id) as { status: string; word_count: number; updated_at: string } | undefined;
                  return (
                    <li key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b p-4 last:border-b-0 sm:px-5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-bold text-primary">{u.number}</span>
                      <div className="min-w-0 flex-1 basis-48">
                        <p className="truncate text-sm font-semibold">{u.title}</p>
                        <p className="text-xs text-muted-foreground">{sum ? t('pages.summaries.meta', { words: t('pages.summaries.words', { count: sum.word_count }), date: f.date(sum.updated_at) }) : t('pages.summaries.none')}</p>
                      </div>
                      <Badge variant={sum?.status === 'published' ? 'success' : sum ? 'warning' : 'muted'}><FileText />{sum?.status === 'published' ? tc('status.published') : sum ? tc('status.draft') : tc('status.notStarted')}</Badge>
                      <Button asChild variant="outline" size="sm"><Link href={`/admin/summaries/${u.id}`}><PenLine /> {sum ? t('pages.summaries.edit') : t('pages.summaries.write')}</Link></Button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
