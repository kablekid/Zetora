import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { SubjectLibrary } from '@/components/subjects/subject-library';
import { getSubjectCards } from '@/lib/queries/subjects';

export const metadata: Metadata = { title: 'Subjects' };

export default async function SubjectsPage() {
  const subjects = await getSubjectCards();
  return (
    <div className="animate-fade-up">
      <PageHeader title="Subjects" description="Choose a subject to explore its units, summaries, materials and quizzes." />
      <SubjectLibrary subjects={subjects} />
    </div>
  );
}
