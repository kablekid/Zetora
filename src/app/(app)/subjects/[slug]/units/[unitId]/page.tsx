import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, FileText, ListTree } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { BookmarkButton, CompleteButton, ReadingTracker, UnitOpenedTracker } from '@/components/learn/unit-client';
import { MaterialsTab, OverviewTab, QuizTab, TestTab, UnitPager, UnitTabNav, parseTab } from '@/components/learn/unit-parts';
import { requireUser } from '@/lib/auth';
import { renderSummary } from '@/lib/html';
import { getUnitBundle } from '@/lib/queries/student';

export async function generateMetadata({ params }: { params: Promise<{ slug: string; unitId: string }> }): Promise<Metadata> {
  const { slug, unitId } = await params;
  const b = await getUnitBundle(slug, unitId, 'overview').catch(() => null);
  return { title: b ? `Unit ${b.unit.number}: ${b.unit.title}` : 'Unit' };
}

export default async function UnitPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; unitId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug, unitId } = await params;
  const { tab } = await searchParams;
  await requireUser();
  const active = parseTab(tab);
  const bundle = await getUnitBundle(slug, unitId, active);
  if (!bundle) notFound();

  const { unit, subject, progress } = bundle;
  const basePath = `/subjects/${subject.slug}/units/${unit.id}`;
  const completed = progress?.status === 'completed';

  return (
    <div className="animate-fade-up">
      <UnitOpenedTracker unitId={unit.id} />
      <Breadcrumbs items={[{ label: 'Subjects', href: '/subjects' }, { label: subject.title, href: `/subjects/${subject.slug}` }, { label: `Unit ${unit.number}` }]} />

      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="default">Unit {unit.number}</Badge>
            <Badge variant="muted"><Clock /> {unit.estimated_minutes} min</Badge>
            {completed ? <Badge variant="success">Completed</Badge> : progress ? <Badge variant="accent">In progress · {progress.reading_progress}%</Badge> : <Badge variant="muted">Not started</Badge>}
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{unit.title}</h1>
          {unit.description && <p className="mt-2 max-w-2xl text-[15px] text-muted-foreground">{unit.description}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <BookmarkButton unitId={unit.id} initial={bundle.bookmarked} />
          <CompleteButton unitId={unit.id} completed={completed} />
        </div>
      </header>

      <UnitTabNav basePath={basePath} active={active} bundle={bundle} />

      <div className="pt-6">
        {active === 'overview' && <OverviewTab bundle={bundle} basePath={basePath} />}

        {active === 'summary' && (
          bundle.summary?.status === 'published' && 'content_html' in bundle.summary && bundle.summary.content_html ? (
            <SummaryView
              unitId={unit.id}
              html={bundle.summary.content_html}
              initial={progress?.reading_progress ?? 0}
              completed={completed}
              words={bundle.summary.word_count}
            />
          ) : (
            <EmptyState icon={<FileText />} title="Summary coming soon" description="The summary for this unit hasn’t been published yet. You can start with the overview, materials or the practice quiz." action={<Button asChild variant="outline"><Link href={basePath}>Back to overview</Link></Button>} />
          )
        )}

        {active === 'materials' && <MaterialsTab resources={bundle.resources} />}
        {active === 'quiz' && <QuizTab bundle={bundle} />}
        {active === 'test' && <TestTab bundle={bundle} />}
      </div>

      <UnitPager bundle={bundle} slug={subject.slug} />
    </div>
  );
}

function SummaryView({ unitId, html, initial, completed, words }: { unitId: string; html: string; initial: number; completed: boolean; words: number }) {
  const { html: rendered, headings } = renderSummary(html);
  const minutes = Math.max(1, Math.round(words / 180));
  return (
    <ReadingTracker unitId={unitId} initial={initial} completed={completed}>
      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] xl:gap-12">
        {headings.length > 0 && (
          <aside className="hidden lg:block">
            <nav aria-label="On this page" className="sticky top-32">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><ListTree className="size-4" /> On this page</p>
              <ul className="space-y-0.5 border-l">
                {headings.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} className={`-ml-px block border-l-2 border-transparent py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground ${h.level === 3 ? 'pl-7' : 'pl-4'}`}>{h.text}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}
        <div className="min-w-0">
          {headings.length > 0 && (
            <details className="mb-5 rounded-xl border bg-card lg:hidden">
              <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 text-sm font-medium"><ListTree className="size-4 text-primary" /> On this page <span className="ml-auto text-xs text-muted-foreground">{headings.length} sections</span></summary>
              <ul className="border-t px-2 py-2">
                {headings.map((h) => <li key={h.id}><a href={`#${h.id}`} className={`block rounded-md px-3 py-2.5 text-sm hover:bg-muted ${h.level === 3 ? 'pl-7 text-muted-foreground' : ''}`}>{h.text}</a></li>)}
              </ul>
            </details>
          )}
          <Card>
            <CardContent className="px-4 py-6 sm:px-8 sm:py-9">
              <p className="mb-6 flex items-center gap-2 text-xs text-muted-foreground"><Clock className="size-3.5" /> About {minutes} min read</p>
              <article className="summary-prose" dangerouslySetInnerHTML={{ __html: rendered }} />
            </CardContent>
          </Card>
          <div className="mt-6 rounded-xl border bg-card p-5 text-center sm:p-6">
            <p className="font-semibold">Finished reading?</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Mark this unit as completed to update your progress, then test yourself with the practice quiz.</p>
            <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
              <CompleteButton unitId={unitId} completed={completed} size="lg" />
            </div>
          </div>
        </div>
      </div>
    </ReadingTracker>
  );
}
