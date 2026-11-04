'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, FileText, FolderOpen, Hash, Layers, Loader2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/lib/types';
import { HighlightedSnippet } from '@/components/search/highlight';
import { searchResultHref } from '@/lib/search-links';

const KIND_ICON = { subject: BookOpen, unit: Layers, topic: Hash, summary: FileText, resource: FolderOpen } as const;
const KIND_LABEL = { subject: 'Subject', unit: 'Unit', topic: 'Topic', summary: 'Summary', resource: 'Material' } as const;

export function SearchTrigger({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === '/' && !(e.target instanceof HTMLElement && /input|textarea|select/i.test(e.target.tagName) || (e.target as HTMLElement)?.isContentEditable)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'group flex h-10 items-center gap-2.5 rounded-lg border bg-card px-3 text-sm text-muted-foreground shadow-xs transition hover:border-input hover:text-foreground',
          className,
        )}
        aria-label="Search subjects, units and materials"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left sm:hidden">Search</span>
        <span className="hidden flex-1 text-left sm:inline">Search subjects, units, summaries…</span>
        <kbd className="ml-auto hidden rounded-md border bg-muted px-1.5 py-0.5 font-sans text-[11px] font-medium text-muted-foreground md:inline">
          Ctrl K
        </kbd>
      </button>
      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) {
      setQ('');
      setResults([]);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    abort.current?.abort();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    abort.current = ctrl;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error('Search failed');
        const json = (await res.json()) as { results: SearchResult[] };
        setResults(json.results);
        setActive(0);
        setError(null);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError('Search is unavailable right now.');
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const go = useCallback(
    (r: SearchResult) => {
      onOpenChange(false);
      router.push(searchResultHref(r));
    },
    [router, onOpenChange],
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[active]) go(results[active]);
      else if (q.trim().length >= 2) {
        onOpenChange(false);
        router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="top-0 max-h-[85dvh] gap-0 p-0 sm:top-[12%] sm:translate-y-0 sm:max-w-xl"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription className="sr-only">Search subjects, units, topics, summaries and learning materials.</DialogDescription>
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search subjects, units, summaries…"
            className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
            aria-label="Search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="search-results"
            autoComplete="off"
            spellCheck={false}
          />
          {loading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">Esc</kbd>
          )}
        </div>
        <div id="search-results" role="listbox" className="max-h-[60dvh] overflow-y-auto p-2">
          {q.trim().length < 2 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Type at least two letters. Try a topic like “osmosis” or “limits”.
            </p>
          )}
          {error && <p className="px-3 py-6 text-center text-sm text-destructive">{error}</p>}
          {!loading && !error && q.trim().length >= 2 && results.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No results for “{q.trim()}”. Check the spelling or try a shorter word.
            </p>
          )}
          {results.map((r, i) => {
            const Icon = KIND_ICON[r.kind];
            return (
              <button
                key={`${r.kind}-${r.id}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                  i === active ? 'bg-muted' : 'hover:bg-muted/60',
                )}
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{r.title}</span>
                    <span className="shrink-0 rounded bg-muted px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {KIND_LABEL[r.kind]}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {r.subject_title}
                    {r.unit_number != null && r.kind !== 'subject' && r.kind !== 'unit' ? ` · Unit ${r.unit_number}: ${r.unit_title}` : ''}
                    {r.kind === 'unit' ? ` · Unit ${r.unit_number}` : ''}
                  </span>
                  {r.snippet && r.kind === 'summary' && (
                    <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">
                      <HighlightedSnippet text={r.snippet} />
                    </span>
                  )}
                </span>
                {i === active && <ArrowRight className="mt-2 size-4 shrink-0 text-muted-foreground" />}
              </button>
            );
          })}
          {q.trim().length >= 2 && results.length > 0 && (
            <button
              onClick={() => {
                onOpenChange(false);
                router.push(`/search?q=${encodeURIComponent(q.trim())}`);
              }}
              className="mt-1 w-full rounded-lg px-3 py-2.5 text-center text-sm font-medium text-primary hover:bg-primary-soft"
            >
              See all results
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
