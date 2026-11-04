import type { Metadata } from 'next';
import Link from 'next/link';
import { Bookmark, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/page-header';
import { SubjectTile } from '@/components/subjects/subject-card';
import { RemoveBookmark } from '@/components/learn/remove-bookmark';
import { createClient } from '@/lib/supabase/server';
import { one } from '@/lib/queries/student';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Saved units' };

type Row = {
  id: string; created_at: string; unit_id: string;
  units: { id: string; number: number; title: string; description: string; estimated_minutes: number; subjects: { slug: string; title: string; color: string; icon: string } | { slug: string; title: string; color: string; icon: string }[] | null } | null;
};

export default async function BookmarksPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('bookmarks')
    .select('id,created_at,unit_id,units(id,number,title,description,estimated_minutes,subjects(slug,title,color,icon))')
    .order('created_at', { ascending: false });
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.units && one(r.units.subjects));

  return (
    <div className="animate-fade-up">
      <PageHeader title="Saved units" description="Units you bookmarked so you can find them again quickly." />
      {rows.length === 0 ? (
        <EmptyState icon={<Bookmark />} title="Nothing saved yet" description="Open a unit and tap Bookmark to keep it here." action={<Button asChild><Link href="/subjects">Browse subjects</Link></Button>} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {rows.map((r) => {
            const u = r.units!;
            const s = one(u.subjects)!;
            return (
              <li key={r.id} className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
                <SubjectTile icon={s.icon} color={s.color} />
                <Link href={`/subjects/${s.slug}/units/${u.id}`} className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{s.title}</p>
                  <p className="mt-0.5 font-semibold leading-snug">Unit {u.number}: {u.title}</p>
                  <p className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{u.estimated_minutes} min</span><span>Saved {formatDate(r.created_at)}</span></p>
                </Link>
                <RemoveBookmark unitId={u.id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
