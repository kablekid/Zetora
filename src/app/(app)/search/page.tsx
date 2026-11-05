import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, FileText, FolderOpen, Hash, Layers, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { HighlightedSnippet } from '@/components/search/highlight';
import { searchContent } from '@/lib/queries/student';
import { searchResultHref } from '@/lib/search-links';
import { getT, pageTitle } from '@/i18n/server';
import type { SearchResult } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('search') };
}

const GROUPS: { kind: SearchResult['kind']; icon: typeof BookOpen }[] = [
  { kind: 'subject', icon: BookOpen },
  { kind: 'unit', icon: Layers },
  { kind: 'topic', icon: Hash },
  { kind: 'summary', icon: FileText },
  { kind: 'resource', icon: FolderOpen },
];

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const t = await getT('search');
  const term = q.trim().slice(0, 80);
  const results = term.length >= 2 ? await searchContent(term, 40) : [];

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('page.title')} description={t('page.description')} />
      <form action="/search" className="mb-8 flex max-w-xl gap-2" role="search">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={term} placeholder={t('page.button') + '…'} className="ps-9" aria-label={t('page.inputLabel')} autoFocus={!term} />
        </div>
        <Button type="submit">{t('page.button')}</Button>
      </form>

      {term.length < 2 ? (
        <EmptyState icon={<Search />} title={t('page.emptyTitle')} description={t('page.emptyBody')} />
      ) : results.length === 0 ? (
        <EmptyState icon={<Search />} title={t('page.noResultsTitle', { q: term })} description={t('page.noResultsBody')} />
      ) : (
        <div className="space-y-8">
          {GROUPS.map((g) => {
            const items = results.filter((r) => r.kind === g.kind);
            if (!items.length) return null;
            return (
              <section key={g.kind} aria-labelledby={`g-${g.kind}`}>
                <h2 id={`g-${g.kind}`} className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground"><g.icon className="size-4" /> {t(`page.groups.${g.kind}`)} <span className="font-normal">({items.length})</span></h2>
                <Card className="divide-y overflow-hidden">
                  {items.map((r) => (
                    <Link key={`${r.kind}-${r.id}`} href={searchResultHref(r)} className="block px-5 py-4 transition-colors hover:bg-muted/50">
                      <p className="font-medium">{r.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {r.subject_title}{r.unit_number != null && r.kind !== 'subject' && r.kind !== 'unit' ? ` · ${t('unitLine', { n: r.unit_number, title: r.unit_title ?? '' })}` : ''}{r.kind === 'unit' ? ` · ${t('unitN', { n: r.unit_number ?? '' })}` : ''}
                      </p>
                      {r.snippet && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{r.kind === 'summary' ? <HighlightedSnippet text={r.snippet} /> : r.snippet}</p>}
                    </Link>
                  ))}
                </Card>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
