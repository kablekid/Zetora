'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, Flag, Grid3x3, Lightbulb, Loader2, Send, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MathText } from './math-text';
import { checkAnswerAction, saveAnswerAction, submitAttemptAction } from '@/lib/actions/learning';
import { cn, formatClock } from '@/lib/utils';
import { QUESTION_TYPE_LABEL } from '@/lib/registry';
import type { AttemptPayload, RunnerAnswer, RunnerQuestion } from '@/lib/types';

type LocalAnswer = { optionIds: string[]; text: string };
type Feedback = RunnerAnswer;

const LETTERS = 'ABCDEFGHIJ';

export function QuizRunner({ payload }: { payload: AttemptPayload }) {
  const router = useRouter();
  const { attempt, questions } = payload;
  const practice = attempt.mode === 'practice';

  // ---- answers (local source of truth; autosaved to the server) -----------
  const [answers, setAnswers] = useState<Record<string, LocalAnswer>>(() => {
    const m: Record<string, LocalAnswer> = {};
    for (const a of payload.answers) m[a.question_id] = { optionIds: a.selected_option_ids ?? [], text: a.text_answer ?? '' };
    return m;
  });
  const [feedback, setFeedback] = useState<Record<string, Feedback>>(() => {
    const m: Record<string, Feedback> = {};
    for (const a of payload.answers) if (a.checked) m[a.question_id] = a;
    return m;
  });
  const [index, setIndex] = useState(() => {
    const firstOpen = questions.findIndex((q) => !payload.answers.some((a) => a.question_id === q.id && (a.selected_option_ids?.length || a.text_answer)));
    return firstOpen === -1 ? 0 : firstOpen;
  });
  const [checking, setChecking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [flags, setFlags] = useState<Set<string>>(new Set());

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  const submittingRef = useRef(false);
  const textTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const q = questions[index];
  const isAnswered = useCallback(
    (id: string) => {
      const a = answers[id];
      return Boolean(a && (a.optionIds.length > 0 || a.text.trim()));
    },
    [answers],
  );
  const answeredCount = questions.filter((x) => isAnswered(x.id)).length;

  // ---- submit -------------------------------------------------------------
  const submit = useCallback(
    async (auto = false) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setConfirmOpen(false);
      Object.values(textTimers.current).forEach(clearTimeout);
      const payloadAnswers = Object.entries(answersRef.current)
        .filter(([, a]) => a.optionIds.length || a.text.trim())
        .map(([question_id, a]) => ({ question_id, option_ids: a.optionIds, text: a.text || null }));
      let res = await submitAttemptAction({ attemptId: attempt.id, answers: payloadAnswers });
      if (!res.ok) {
        // one retry for flaky connections
        await new Promise((r) => setTimeout(r, 800));
        res = await submitAttemptAction({ attemptId: attempt.id, answers: payloadAnswers });
      }
      if (!res.ok) {
        submittingRef.current = false;
        setSubmitting(false);
        toast.error(`${res.error} Your answers are safe — please try submitting again.`);
        return;
      }
      if (auto) toast.info('Time is up — your answers were submitted.');
      router.replace(`/attempts/${attempt.id}/results`);
    },
    [attempt.id, router],
  );

  // ---- timer (deadline lives on the server; refreshing never resets it) ----
  // Clock skew between this device and the server, measured once when the attempt loads.
  const [offset] = useState(() => new Date(payload.server_now).getTime() - Date.now());
  const deadline = attempt.expires_at ? new Date(attempt.expires_at).getTime() : null;
  // First render must be identical on server and client, so it uses the server's own timestamp;
  // the interval below then keeps it accurate against this device's clock.
  const [remaining, setRemaining] = useState<number | null>(() =>
    deadline ? Math.max(0, Math.round((deadline - new Date(payload.server_now).getTime()) / 1000)) : null,
  );
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - (Date.now() + offset)) / 1000));
      setRemaining(left);
      if (left <= 0) void submit(true);
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [deadline, offset, submit]);

  const announced = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (remaining == null) return;
    for (const mark of [300, 60]) {
      if (remaining <= mark && remaining > 0 && !announced.current.has(mark) && (payload.attempt.time_limit_seconds ?? 0) > mark) {
        announced.current.add(mark);
        toast.warning(mark === 300 ? '5 minutes remaining' : '1 minute remaining');
      }
    }
  }, [remaining, payload.attempt.time_limit_seconds]);

  // ---- saving ---------------------------------------------------------------
  const persist = useCallback(
    async (question: RunnerQuestion, a: LocalAnswer) => {
      const res = await saveAnswerAction({ attemptId: attempt.id, questionId: question.id, optionIds: a.optionIds, text: a.text || null });
      if (!res.ok) {
        if (res.error === 'TIME_UP') return void submit(true);
        setSaveError(true);
        return;
      }
      setSaveError(false);
    },
    [attempt.id, submit],
  );

  const locked = Boolean(q && feedback[q.id]);
  const current = (q && answers[q.id]) || { optionIds: [], text: '' };

  async function check(question: RunnerQuestion, a: LocalAnswer) {
    setChecking(true);
    const res = await checkAnswerAction({ attemptId: attempt.id, questionId: question.id, optionIds: a.optionIds, text: a.text || null });
    setChecking(false);
    if (!res.ok) {
      if (res.error === 'TIME_UP') return void submit(true);
      toast.error(res.error);
      return;
    }
    setFeedback((f) => ({ ...f, [question.id]: res.data }));
  }

  function choose(optionId: string) {
    if (!q || locked || submitting) return;
    const single = q.type !== 'multiple_select';
    const next: LocalAnswer = {
      text: '',
      optionIds: single ? [optionId] : current.optionIds.includes(optionId) ? current.optionIds.filter((x) => x !== optionId) : [...current.optionIds, optionId],
    };
    setAnswers((s) => ({ ...s, [q.id]: next }));
    if (practice && single) void check(q, next);
    else void persist(q, next);
  }

  function typeText(value: string) {
    if (!q || locked || submitting) return;
    const next: LocalAnswer = { optionIds: [], text: value.slice(0, 500) };
    setAnswers((s) => ({ ...s, [q.id]: next }));
    clearTimeout(textTimers.current[q.id]);
    const question = q;
    textTimers.current[q.id] = setTimeout(() => void persist(question, next), 700);
  }

  // keyboard shortcuts: ←/→ navigate, 1-9/A-D choose
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /input|textarea/i.test(e.target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, questions.length - 1));
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
      else if (q && q.type !== 'short_answer') {
        const n = /^[1-9]$/.test(e.key) ? Number(e.key) - 1 : LETTERS.indexOf(e.key.toUpperCase());
        if (n >= 0 && n < q.options.length) choose(q.options[n].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!q) return <p className="py-20 text-center text-muted-foreground">This attempt has no questions.</p>;

  const fb = feedback[q.id];
  const last = index === questions.length - 1;
  const lowTime = remaining != null && remaining <= 60;
  const warnTime = remaining != null && remaining <= 300;
  const unanswered = questions.length - answeredCount;

  return (
    <div className="mx-auto max-w-3xl pb-28 lg:pb-8">
      {/* Header */}
      <div className="sticky top-16 z-20 -mx-4 border-b bg-background/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:bg-card/90">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{attempt.title}</p>
            <p className="text-xs text-muted-foreground">
              Question {index + 1} of {questions.length} · {answeredCount} answered
            </p>
          </div>
          {remaining != null && (
            <div
              role="timer"
              aria-label={`Time remaining ${formatClock(remaining)}`}
              className={cn(
                'flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold tabular-nums',
                lowTime ? 'border-destructive/40 bg-destructive-soft text-destructive' : warnTime ? 'border-warning/40 bg-warning-soft text-warning' : 'bg-card',
              )}
            >
              <Clock className="size-4" /> {formatClock(remaining)}
            </div>
          )}
          <Button variant="outline" size="icon" onClick={() => setNavOpen(true)} aria-label="Open question navigator"><Grid3x3 /></Button>
        </div>
        <Progress value={(answeredCount / questions.length) * 100} className="mt-3 h-1.5" aria-label="Questions answered" />
      </div>

      {saveError && (
        <div role="status" className="mt-4 flex items-center gap-2 rounded-lg border border-warning/40 bg-warning-soft px-3.5 py-2.5 text-sm text-warning">
          <AlertTriangle className="size-4 shrink-0" /> We couldn’t save your last answer. Check your connection — everything will be sent again when you submit.
        </div>
      )}

      {/* Question */}
      <div className="mt-6 rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] sm:p-8" key={q.id}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">{QUESTION_TYPE_LABEL[q.type]}</span>
          <button
            type="button"
            onClick={() => setFlags((f) => { const n = new Set(f); if (n.has(q.id)) n.delete(q.id); else n.add(q.id); return n; })}
            aria-pressed={flags.has(q.id)}
            className={cn('inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors', flags.has(q.id) ? 'bg-warning-soft text-warning' : 'text-muted-foreground hover:bg-muted')}
          >
            <Flag className="size-3.5" /> {flags.has(q.id) ? 'Flagged' : 'Flag for review'}
          </button>
        </div>
        <h2 className="text-lg font-semibold leading-relaxed sm:text-xl"><MathText text={q.body} /></h2>
        {q.type === 'multiple_select' && <p className="mt-2 text-sm text-muted-foreground">Select all the answers that apply.</p>}

        {q.type === 'short_answer' ? (
          <div className="mt-6">
            <label htmlFor="short" className="mb-2 block text-sm font-medium">Your answer</label>
            <Input id="short" value={current.text} onChange={(e) => typeText(e.target.value)} disabled={locked} placeholder="Type your answer" autoComplete="off" autoCapitalize="off" spellCheck={false} className="h-12 text-base" />
          </div>
        ) : (
          <div className={cn('mt-6 gap-3', q.type === 'true_false' ? 'grid sm:grid-cols-2' : 'flex flex-col')} role={q.type === 'multiple_select' ? 'group' : 'radiogroup'} aria-label="Answer options">
            {q.options.map((o, i) => {
              const selected = current.optionIds.includes(o.id);
              const isCorrect = fb?.correct_option_ids?.includes(o.id);
              const showWrong = fb && selected && !isCorrect;
              const showRight = fb && isCorrect;
              return (
                <button
                  key={o.id}
                  type="button"
                  role={q.type === 'multiple_select' ? 'checkbox' : 'radio'}
                  aria-checked={selected}
                  disabled={locked || submitting}
                  onClick={() => choose(o.id)}
                  className={cn(
                    'group flex min-h-14 w-full items-center gap-3.5 rounded-xl border-2 px-4 py-3 text-left text-[15px] transition-all',
                    !fb && (selected ? 'border-primary bg-primary-soft' : 'border-border bg-background hover:border-primary/40 hover:bg-muted/50'),
                    showRight && 'border-success bg-success-soft',
                    showWrong && 'border-destructive bg-destructive-soft',
                    fb && !showRight && !showWrong && 'border-border bg-background opacity-70',
                    q.type === 'true_false' && 'justify-center text-base font-semibold',
                  )}
                >
                  {q.type !== 'true_false' && (
                    <span className={cn(
                      'flex size-8 shrink-0 items-center justify-center border-2 text-xs font-bold transition-colors',
                      q.type === 'multiple_select' ? 'rounded-md' : 'rounded-full',
                      !fb && (selected ? 'border-primary bg-primary text-primary-foreground' : 'border-input text-muted-foreground'),
                      showRight && 'border-success bg-success text-white',
                      showWrong && 'border-destructive bg-destructive text-white',
                    )}>
                      {showRight ? <Check className="size-4" /> : showWrong ? <XCircle className="size-4" /> : selected && q.type === 'multiple_select' ? <Check className="size-4" /> : LETTERS[i]}
                    </span>
                  )}
                  <span className="flex-1"><MathText text={o.body} /></span>
                  {q.type === 'true_false' && showRight && <CheckCircle2 className="size-5 text-success" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Practice mode: explicit check for answers that need confirmation */}
        {practice && !fb && (q.type === 'multiple_select' || q.type === 'short_answer') && (
          <Button className="mt-5" size="lg" loading={checking} disabled={!isAnswered(q.id)} onClick={() => void check(q, current)}>
            <Check /> Check answer
          </Button>
        )}
        {checking && !fb && q.type !== 'multiple_select' && q.type !== 'short_answer' && (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Checking…</p>
        )}

        {fb && (
          <div role="status" className={cn('mt-6 rounded-xl border p-4 sm:p-5', fb.is_correct ? 'border-success/40 bg-success-soft' : 'border-destructive/30 bg-destructive-soft')}>
            <p className={cn('flex items-center gap-2 font-semibold', fb.is_correct ? 'text-success' : 'text-destructive')}>
              {fb.is_correct ? <><CheckCircle2 className="size-5" /> Correct!</> : <><XCircle className="size-5" /> Not quite</>}
            </p>
            {!fb.is_correct && q.type === 'short_answer' && fb.accepted_answers?.length ? (
              <p className="mt-2 text-sm">Accepted answer{fb.accepted_answers.length > 1 ? 's' : ''}: <strong>{fb.accepted_answers.join(', ')}</strong></p>
            ) : null}
            {fb.explanation && (
              <div className="mt-3 flex gap-2.5 text-sm leading-relaxed text-foreground/90">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" />
                <p><MathText text={fb.explanation} /></p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer navigation (fixed above the bottom nav on phones) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Button variant="outline" size="lg" onClick={() => setIndex((i) => Math.max(i - 1, 0))} disabled={index === 0}><ArrowLeft /> <span className="hidden sm:inline">Previous</span></Button>
          <div className="flex-1" />
          {last ? (
            <Button size="lg" loading={submitting} onClick={() => setConfirmOpen(true)}><Send /> Submit {attempt.kind === 'exam' ? 'exam' : 'quiz'}</Button>
          ) : (
            <Button size="lg" onClick={() => setIndex((i) => Math.min(i + 1, questions.length - 1))}>Next <ArrowRight /></Button>
          )}
        </div>
      </div>

      {/* Navigator */}
      <Dialog open={navOpen} onOpenChange={setNavOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Questions</DialogTitle>
            <DialogDescription>{answeredCount} of {questions.length} answered{flags.size ? ` · ${flags.size} flagged` : ''}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-6">
            {questions.map((x, i) => (
              <button
                key={x.id}
                type="button"
                onClick={() => { setIndex(i); setNavOpen(false); }}
                aria-label={`Question ${i + 1}${isAnswered(x.id) ? ', answered' : ', not answered'}${flags.has(x.id) ? ', flagged' : ''}`}
                aria-current={i === index}
                className={cn(
                  'relative flex h-12 items-center justify-center rounded-lg border-2 text-sm font-semibold transition-colors',
                  i === index ? 'border-primary' : 'border-transparent',
                  isAnswered(x.id) ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                )}
              >
                {i + 1}
                {flags.has(x.id) && <Flag className="absolute -right-1 -top-1 size-4 rounded-full bg-warning p-0.5 text-white" />}
              </button>
            ))}
          </div>
          <Button size="lg" onClick={() => { setNavOpen(false); setConfirmOpen(true); }}><Send /> Review &amp; submit</Button>
        </DialogContent>
      </Dialog>

      {/* Submit confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit {attempt.kind === 'exam' ? 'your exam' : 'your quiz'}?</AlertDialogTitle>
            <AlertDialogDescription>
              {unanswered > 0
                ? `You have ${unanswered} unanswered ${unanswered === 1 ? 'question' : 'questions'}. Unanswered questions score zero.`
                : 'You’ve answered every question.'}{' '}
              You won’t be able to change your answers after submitting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep working</AlertDialogCancel>
            <AlertDialogAction onClick={() => void submit(false)}>Submit now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {submitting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/70 backdrop-blur-sm" role="status">
          <div className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 shadow-[var(--shadow-pop)]"><Loader2 className="size-5 animate-spin" /> Grading your answers…</div>
        </div>
      )}
    </div>
  );
}
