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
import { getFormat, getT, pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('saved') };
}

type Row = {
  id: string; created_at: string; unit_id: string;
  units: { id: string; number: number; title: string; description: string; estimated_minutes: number; subjects: { slug: string; title: string; color: string; icon: string } | { slug: string; title: string; color: string; icon: string }[] | null } | null;
};

export default async function BookmarksPage() {
  const [supabase, t, tm, tl, tc, f] = await Promise.all([createClient(), getT('pages'), getT('meta'), getT('learn'), getT('common'), getFormat()]);
  const { data } = await supabase
    .from('bookmarks')
    .select('id,created_at,unit_id,units(id,number,title,description,estimated_minutes,subjects(slug,title,color,icon))')
    .order('created_at', { ascending: false });
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.units && one(r.units.subjects));

  return (
    <div className="animate-fade-up">
      <PageHeader title={tm('saved')} description={t('bookmarks.description')} />
      {rows.length === 0 ? (
        <EmptyState icon={<Bookmark />} title={t('bookmarks.emptyTitle')} description={t('bookmarks.emptyBody')} action={<Button asChild><Link href="/subjects">{t('bookmarks.browse')}</Link></Button>} />
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
                  <p className="mt-0.5 font-semibold leading-snug">{tl('pager.line', { n: u.number, title: u.title })}</p>
                  <p className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{tc('time.minutes', { m: u.estimated_minutes })}</span><span>{t('bookmarks.saved', { date: f.date(r.created_at) })}</span></p>
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
