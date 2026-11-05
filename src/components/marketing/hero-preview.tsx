import { BookOpen, Flame, Play, Sigma, Atom, FlaskConical } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getT } from '@/i18n/server';

/**
 * Illustrative product preview for the hero. Figures are sample values to show
 * the layout, not real statistics — it is labelled as a preview.
 */
export async function HeroPreview() {
  const t = await getT('marketing');
  return (
    <div className="relative mx-auto w-full max-w-xl" aria-hidden>
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary/15 via-secondary/10 to-accent/15 blur-2xl" />
      <div className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-pop)]">
        <div className="flex items-center gap-1.5 border-b bg-muted/60 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-destructive/60" />
          <span className="size-2.5 rounded-full bg-warning/60" />
          <span className="size-2.5 rounded-full bg-success/60" />
          <span className="ms-3 rounded-md bg-card px-2.5 py-0.5 text-[11px] text-muted-foreground">{t('preview.window')}</span>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{t('preview.hello')}</p>
              <p className="text-xs text-muted-foreground">{t('preview.ready')}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-medium text-warning">
              <Flame className="size-3.5" /> {t('preview.streak')}
            </span>
          </div>

          <div className="rounded-xl bg-midnight p-4 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">{t('preview.continue')}</p>
            <p className="mt-1 text-sm font-semibold">{t('preview.unit')}</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                <div className="h-full w-[62%] rounded-full bg-accent" />
              </div>
              <span className="text-xs font-medium tabular-nums">62%</span>
              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-white text-midnight">
                <Play className="size-3.5 fill-current" />
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              [t('preview.unitsDone'), '6'],
              [t('preview.quizzes'), '12'],
              [t('preview.avgScore'), '78%'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border bg-background p-3">
                <p className="text-[11px] text-muted-foreground">{k}</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums">{v}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2.5 rounded-xl border bg-background p-3.5">
            {[
              { icon: Sigma, name: t('preview.mathematics'), v: 45, bar: 'bg-indigo-500', tile: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' },
              { icon: Atom, name: t('preview.physics'), v: 30, bar: 'bg-violet-500', tile: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' },
              { icon: FlaskConical, name: t('preview.chemistry'), v: 18, bar: 'bg-blue-500', tile: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' },
            ].map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className={`flex size-8 items-center justify-center rounded-lg ${s.tile}`}><s.icon className="size-4" /></span>
                <div className="flex-1">
                  <div className="mb-1 flex justify-between text-xs"><span className="font-medium">{s.name}</span><span className="tabular-nums text-muted-foreground">{s.v}%</span></div>
                  <Progress value={s.v} className="h-1.5" barClassName={s.bar} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -start-3 hidden items-center gap-2.5 rounded-xl border bg-card px-3.5 py-2.5 shadow-[var(--shadow-pop)] sm:flex">
        <span className="flex size-8 items-center justify-center rounded-lg bg-success-soft text-success"><BookOpen className="size-4" /></span>
        <div>
          <p className="text-xs font-semibold">{t('preview.quizPassed')}</p>
          <p className="text-[11px] text-muted-foreground">{t('preview.quizPassedDetail')}</p>
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">{t('preview.caption')}</p>
    </div>
  );
}
