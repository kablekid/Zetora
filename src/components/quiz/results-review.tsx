'use client';
import { useState } from 'react';
import { Check, CheckCircle2, Lightbulb, MinusCircle, X, XCircle } from 'lucide-react';
import { MathText } from './math-text';
import { cn } from '@/lib/utils';
import { QUESTION_TYPE_LABEL } from '@/lib/registry';
import type { ResultQuestion } from '@/lib/types';

type Filter = 'all' | 'incorrect' | 'correct';

function answered(q: ResultQuestion) {
  return q.selected_option_ids.length > 0 || Boolean(q.text_answer?.trim());
}

export function ResultsReview({ questions }: { questions: ResultQuestion[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const correct = questions.filter((q) => q.is_correct).length;
  const shown = questions.map((q, i) => ({ q, i })).filter(({ q }) => (filter === 'all' ? true : filter === 'correct' ? q.is_correct : !q.is_correct));
  const tabs: { id: Filter; label: string; n: number }[] = [
    { id: 'all', label: 'All', n: questions.length },
    { id: 'incorrect', label: 'Incorrect', n: questions.length - correct },
    { id: 'correct', label: 'Correct', n: correct },
  ];

  return (
    <section aria-labelledby="review">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="review" className="text-lg font-semibold tracking-tight">Review your answers</h2>
        <div role="group" aria-label="Filter answers" className="flex gap-1.5 rounded-xl bg-muted p-1">
          {tabs.map((t) => (
            <button key={t.id} type="button" aria-pressed={filter === t.id} onClick={() => setFilter(t.id)}
              className={cn('h-9 rounded-lg px-3.5 text-sm font-medium transition-all', filter === t.id ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              {t.label} <span className="ml-1 text-xs text-muted-foreground tabular-nums">{t.n}</span>
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nothing to show in this view.</p>
      ) : (
        <ol className="space-y-4">
          {shown.map(({ q, i }) => {
            const skipped = !answered(q);
            return (
              <li key={q.id} className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
                <div className="mb-3 flex flex-wrap items-center gap-2.5">
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', q.is_correct ? 'bg-success-soft text-success' : skipped ? 'bg-muted text-muted-foreground' : 'bg-destructive-soft text-destructive')}>
                    {q.is_correct ? <CheckCircle2 className="size-3.5" /> : skipped ? <MinusCircle className="size-3.5" /> : <XCircle className="size-3.5" />}
                    {q.is_correct ? 'Correct' : skipped ? 'Not answered' : 'Incorrect'}
                  </span>
                  <span className="text-xs text-muted-foreground">Question {i + 1} · {QUESTION_TYPE_LABEL[q.type]}</span>
                </div>
                <p className="font-medium leading-relaxed"><MathText text={q.body} /></p>

                {q.type === 'short_answer' ? (
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex gap-2"><dt className="w-28 shrink-0 text-muted-foreground">Your answer</dt><dd className={cn('font-medium', q.is_correct ? 'text-success' : 'text-destructive')}>{q.text_answer?.trim() || '—'}</dd></div>
                    <div className="flex gap-2"><dt className="w-28 shrink-0 text-muted-foreground">Accepted</dt><dd className="font-medium">{q.accepted_answers?.join(', ')}</dd></div>
                  </dl>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {q.options.map((o) => {
                      const picked = q.selected_option_ids.includes(o.id);
                      return (
                        <li key={o.id} className={cn('flex items-start gap-3 rounded-lg border px-3.5 py-2.5 text-sm',
                          o.is_correct ? 'border-success/50 bg-success-soft' : picked ? 'border-destructive/40 bg-destructive-soft' : 'bg-background')}>
                          <span className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full', o.is_correct ? 'bg-success text-white' : picked ? 'bg-destructive text-white' : 'border')}>
                            {o.is_correct ? <Check className="size-3" strokeWidth={3} /> : picked ? <X className="size-3" strokeWidth={3} /> : null}
                          </span>
                          <span className="flex-1"><MathText text={o.body} /></span>
                          {picked && <span className="shrink-0 text-xs font-medium text-muted-foreground">Your answer</span>}
                          {o.is_correct && !picked && <span className="shrink-0 text-xs font-medium text-success">Correct answer</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {q.explanation && (
                  <div className="mt-4 flex gap-2.5 rounded-lg bg-muted/70 p-3.5 text-sm leading-relaxed">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" />
                    <p><span className="font-semibold">Explanation. </span><MathText text={q.explanation} /></p>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
