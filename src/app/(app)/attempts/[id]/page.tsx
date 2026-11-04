import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import 'katex/dist/katex.min.css';
import { QuizRunner } from '@/components/quiz/quiz-runner';
import { createClient } from '@/lib/supabase/server';
import type { AttemptPayload } from '@/lib/types';

export const metadata: Metadata = { title: 'Quiz', robots: { index: false } };

export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  // get_attempt auto-submits expired attempts, so a refresh can never extend the deadline.
  const { data, error } = await supabase.rpc('get_attempt', { p_attempt_id: id });
  if (error || !data) notFound();
  const payload = data as AttemptPayload;
  if (payload.attempt.status === 'submitted') redirect(`/attempts/${id}/results`);
  return <QuizRunner payload={payload} />;
}
