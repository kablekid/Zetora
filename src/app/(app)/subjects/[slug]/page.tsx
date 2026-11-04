import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CheckCircle2, Layers, Library, Timer } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { SubjectTile } from '@/components/subjects/subject-card';
import { UnitListItem } from '@/components/learn/unit-row';
import { getSubjectBySlug, getSubjectUnits } from '@/lib/queries/student';
import { subjectTone } from '@/lib/registry';
import { pct, plural } from '@/lib/utils';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const subject = await getSubjectBySlug(slug);
  return { title: subject?.title ?? 'Subject' };
}

export default async function SubjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const subject = await getSubjectBySlug(slug);
  if (!subject) notFound();
  const units = await getSubjectUnits(subject.id);
  const tone = subjectTone(subject.color);

  const completed = units.filter((u) => u.status === 'completed').length;
  const progress = pct(completed, units.length);
  const next = units.find((u) => u.status === 'in_progress') ?? units.find((u) => u.status !== 'completed') ?? null;
  const totalMinutes = units.reduce((n, u) => n + u.estimated_minutes, 0);
  const started = units.some((u) => u.status !== 'not_started');

  return (
    <div className="animate-fade-up">
      <Breadcrumbs items={[{ label: 'Subjects', href: '/subjects' }, { label: subject.title }]} />

      <Card className="overflow-hidden">
        <div aria-hidden className={`h-1.5 ${tone.solid}`} />
        <CardContent className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex gap-4 sm:gap-5">
            <SubjectTile icon={subject.icon} color={subject.color} size="lg" className="hidden sm:inline-flex" />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{subject.title}</h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{subject.description}</p>
              <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2"><Layers className="size-4 text-muted-foreground" /><dt className="sr-only">Total units</dt><dd><strong>{units.length}</strong> <span className="text-muted-foreground">{units.length === 1 ? 'unit' : 'units'}</span></dd></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-muted-foreground" /><dt className="sr-only">Completed units</dt><dd><strong>{completed}</strong> <span className="text-muted-foreground">completed</span></dd></div>
                <div className="flex items-center gap-2"><Timer className="size-4 text-muted-foreground" /><dt className="sr-only">Estimated time</dt><dd><strong>{Math.round(totalMinutes / 6) / 10}</strong> <span className="text-muted-foreground">hours of study</span></dd></div>
              </dl>
            </div>
          </div>
          <div className="w-full space-y-3 lg:w-72">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium">Overall progress</span>
                <span className="font-bold tabular-nums">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2.5" barClassName={tone.solid} aria-label={`${subject.title} progress`} />
            </div>
            {next ? (
              <Button asChild size="lg" className="w-full">
                <Link href={`/subjects/${subject.slug}/units/${next.id}`}>
                  {started ? 'Continue' : 'Start'} Unit {next.number} <ArrowRight />
                </Link>
              </Button>
            ) : units.length > 0 ? (
              <p className="rounded-lg bg-success-soft px-3 py-2.5 text-center text-sm font-medium text-success">You’ve completed every unit 🎉</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="mb-3 mt-8 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Units</h2>
        <span className="text-sm text-muted-foreground">{plural(units.length, 'unit')}</span>
      </div>
      {units.length === 0 ? (
        <EmptyState icon={<Library />} title="No units yet" description="The team is still preparing this subject. Check back soon." action={<Button asChild variant="outline"><Link href="/subjects">Back to subjects</Link></Button>} />
      ) : (
        <ol className="space-y-3">
          {units.map((u) => <UnitListItem key={u.id} unit={u} slug={subject.slug} color={subject.color} highlight={next?.id === u.id && !started} />)}
        </ol>
      )}
    </div>
  );
}
