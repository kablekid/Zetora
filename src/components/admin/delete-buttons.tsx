'use client';
import { ConfirmDelete, useRunAction } from './ui';
import { deleteExamAction, deleteQuizAction } from '@/lib/actions/admin';

export function DeleteQuizButton({ id, title }: { id: string; title: string }) {
  const { run } = useRunAction();
  return <ConfirmDelete title={`Delete “${title}”?`} description="Students’ past results are kept, but the quiz is removed and can’t be taken again." onConfirm={() => run(() => deleteQuizAction(id))} />;
}

export function DeleteExamButton({ id, title }: { id: string; title: string }) {
  const { run } = useRunAction();
  return <ConfirmDelete title={`Delete “${title}”?`} description="Students’ past exam results are kept, but the exam is removed and can’t be taken again." onConfirm={() => run(() => deleteExamAction(id))} />;
}
