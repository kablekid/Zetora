import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight, BarChart3, ClipboardCheck, FileText, FolderOpen, ListChecks, Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { HeroPreview } from '@/components/marketing/hero-preview';
import { SubjectCard } from '@/components/subjects/subject-card';
import { getUser } from '@/lib/auth';
import { getSubjectCards } from '@/lib/queries/subjects';
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from '@/lib/constants';
import { BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: { absolute: `${APP_NAME} — ${APP_TAGLINE}` },
  description: APP_DESCRIPTION,
  alternates: { canonical: '/' },
};

const FEATURES = [
  { icon: FolderOpen, title: 'Organised learning materials', text: 'Everything sorted by subject, unit and topic, with PDFs you can read right in the app.' },
  { icon: FileText, title: 'Unit summaries', text: 'Clean, focused summaries with definitions, formulas, tables and worked examples.' },
  { icon: ListChecks, title: 'Interactive quizzes', text: 'Practise with instant feedback, clear explanations and a retry whenever you want.' },
  { icon: ClipboardCheck, title: 'Mock examinations', text: 'Timed exams with randomised questions to rehearse the real thing.' },
  { icon: BarChart3, title: 'Progress tracking', text: 'See completed units, quiz scores and the topics that need more revision.' },
  { icon: Smartphone, title: 'Mobile-friendly learning', text: 'Designed for phones first. Install it to your home screen and study anywhere.' },
];

const STEPS = [
  ['Create your account', 'Sign up free with your email.'],
  ['Choose a subject', 'Pick what you want to revise.'],
  ['Study a unit', 'Read the summary and open the materials.'],
  ['Practise questions', 'Take quizzes and get instant feedback.'],
  ['Track your progress', 'See what you’ve mastered and what’s next.'],
];

export default async function LandingPage() {
  const [user, subjects] = await Promise.all([getUser(), getSubjectCards()]);
  const primaryHref = user ? '/dashboard' : '/register';

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(60%_50%_at_70%_0%,color-mix(in_oklab,var(--secondary)_14%,transparent),transparent),radial-gradient(50%_45%_at_10%_10%,color-mix(in_oklab,var(--accent)_12%,transparent),transparent)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-28 lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
              <span className="size-1.5 rounded-full bg-success" /> For Grade 12 remedial students across Ethiopia
            </span>
            <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
              Your Journey to Academic Excellence Starts Here.
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Everything you need to prepare, practice and succeed in your Grade 12 remedial studies — all in one place.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={primaryHref}>Start Learning <ArrowRight /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/#subjects">Explore Subjects</Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">Free to join · Works on any phone · Study at your own pace</p>
          </div>
          <HeroPreview />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-y bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionIntro eyebrow="Platform" title="Everything in one calm, focused place" text="Zetora brings your study materials, practice and progress together so you can spend your time learning, not searching." />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title} className="p-6 transition-shadow hover:shadow-[var(--shadow-pop)]">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary"><f.icon className="size-5" /></span>
                <h3 className="mt-5 text-base font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionIntro eyebrow="How it works" title="From sign-up to results in five steps" />
          <ol className="relative mt-14 grid gap-8 md:grid-cols-5 md:gap-4">
            <div aria-hidden className="absolute left-[10%] right-[10%] top-5 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
            {STEPS.map(([title, text], i) => (
              <li key={title} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
                <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border bg-card text-sm font-bold text-primary shadow-sm">{i + 1}</span>
                <div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Subjects */}
      <section id="subjects" className="scroll-mt-20 border-t bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionIntro eyebrow="Subjects" title="Explore what you can study" text="Subjects are added and updated by the Zetora team, so the library keeps growing." />
          <div className="mt-12">
            {subjects.length === 0 ? (
              <EmptyState icon={<BookOpen />} title="Subjects are on their way" description="We’re preparing the first subjects. Create an account and you’ll be notified as soon as they’re live." action={<Button asChild><Link href={primaryHref}>Create account</Link></Button>} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {subjects.map((s) => (
                  <SubjectCard key={s.id} subject={s} href={user ? `/subjects/${s.slug}` : '/register'} showProgress={false} cta={user ? 'Explore subject' : 'Sign up to explore'} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-20 pt-4 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-midnight px-6 py-14 text-center text-white sm:px-12 sm:py-16">
          <div aria-hidden className="absolute -left-16 -top-16 size-72 rounded-full bg-secondary/30 blur-3xl" />
          <div aria-hidden className="absolute -bottom-20 -right-10 size-72 rounded-full bg-accent/25 blur-3xl" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">Ready to make every study session count?</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">Create your free account, pick a subject and take your first quiz today.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-white text-midnight hover:bg-white/90">
                <Link href={primaryHref}>Start Learning <ArrowRight /></Link>
              </Button>
              {!user && (
                <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10">
                  <Link href="/login">I already have an account</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {text && <p className="mt-4 text-pretty text-muted-foreground">{text}</p>}
    </div>
  );
}
