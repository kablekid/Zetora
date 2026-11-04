import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Layers, PenLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/page-header';
import { requireAdmin } from '@/lib/auth';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Summaries' };

export default async function AdminSummariesPage() {
  const { supabase } = await requireAdmin();
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
      <PageHeader title="Summaries" description="Write, save as a draft, and publish the reading summary for each unit." />
      {all.length === 0 ? (
        <EmptyState icon={<Layers />} title="No units yet" description="Create a unit first, then write its summary." action={<Button asChild><Link href="/admin/units">Go to units</Link></Button>} />
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
                        <p className="text-xs text-muted-foreground">{sum ? `${sum.word_count.toLocaleString('en')} words · edited ${formatDate(sum.updated_at)}` : 'No summary yet'}</p>
                      </div>
                      <Badge variant={sum?.status === 'published' ? 'success' : sum ? 'warning' : 'muted'}><FileText />{sum?.status === 'published' ? 'Published' : sum ? 'Draft' : 'Not started'}</Badge>
                      <Button asChild variant="outline" size="sm"><Link href={`/admin/summaries/${u.id}`}><PenLine /> {sum ? 'Edit' : 'Write'}</Link></Button>
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
