import { notFound, redirect } from 'next/navigation';

/** Exams start from the list (or the unit's "Unit test" tab); deep links go to the list. */
export default async function ExamRedirect({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(examId)) notFound();
  redirect('/exams');
}
