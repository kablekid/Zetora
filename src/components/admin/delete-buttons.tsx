'use client';
import { ConfirmDelete, useRunAction } from './ui';
import { deleteExamAction, deleteQuizAction } from '@/lib/actions/admin';
import { useT } from '@/i18n/client';

export function DeleteQuizButton({ id, title }: { id: string; title: string }) {
  const { run } = useRunAction();
  const t = useT('admin');
  return <ConfirmDelete title={t('ui.deleteTitle', { title })} description={t('quizBuilder.deleteBody')} onConfirm={() => run(() => deleteQuizAction(id))} />;
}

export function DeleteExamButton({ id, title }: { id: string; title: string }) {
  const { run } = useRunAction();
  const t = useT('admin');
  return <ConfirmDelete title={t('ui.deleteTitle', { title })} description={t('exams.deleteBody')} onConfirm={() => run(() => deleteExamAction(id))} />;
}
