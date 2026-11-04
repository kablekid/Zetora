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
import type { SearchResult } from '@/lib/types';

export const metadata: Metadata = { title: 'Search' };

const GROUPS: { kind: SearchResult['kind']; label: string; icon: typeof BookOpen }[] = [
  { kind: 'subject', label: 'Subjects', icon: BookOpen },
  { kind: 'unit', label: 'Units', icon: Layers },
  { kind: 'topic', label: 'Topics', icon: Hash },
  { kind: 'summary', label: 'Summaries', icon: FileText },
  { kind: 'resource', label: 'Learning materials', icon: FolderOpen },
];

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const term = q.trim().slice(0, 80);
  const results = term.length >= 2 ? await searchContent(term, 40) : [];

  return (
    <div className="animate-fade-up">
      <PageHeader title="Search" description="Find subjects, units, topics, summaries and learning materials." />
      <form action="/search" className="mb-8 flex max-w-xl gap-2" role="search">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={term} placeholder="Search…" className="pl-9" aria-label="Search query" autoFocus={!term} />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {term.length < 2 ? (
        <EmptyState icon={<Search />} title="What are you looking for?" description="Type at least two letters. Try a topic like “osmosis”, “limits” or “Newton”." />
      ) : results.length === 0 ? (
        <EmptyState icon={<Search />} title={`No results for “${term}”`} description="Check the spelling, or try a shorter or more general word." />
      ) : (
        <div className="space-y-8">
          {GROUPS.map((g) => {
            const items = results.filter((r) => r.kind === g.kind);
            if (!items.length) return null;
            return (
              <section key={g.kind} aria-labelledby={`g-${g.kind}`}>
                <h2 id={`g-${g.kind}`} className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground"><g.icon className="size-4" /> {g.label} <span className="font-normal">({items.length})</span></h2>
                <Card className="divide-y overflow-hidden">
                  {items.map((r) => (
                    <Link key={`${r.kind}-${r.id}`} href={searchResultHref(r)} className="block px-5 py-4 transition-colors hover:bg-muted/50">
                      <p className="font-medium">{r.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {r.subject_title}{r.unit_number != null && r.kind !== 'subject' && r.kind !== 'unit' ? ` · Unit ${r.unit_number}: ${r.unit_title}` : ''}{r.kind === 'unit' ? ` · Unit ${r.unit_number}` : ''}
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
