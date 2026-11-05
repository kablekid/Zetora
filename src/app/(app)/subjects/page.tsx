import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { SubjectLibrary } from '@/components/subjects/subject-library';
import { getSubjectCards } from '@/lib/queries/subjects';
import { getT, pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('subjects') };
}

export default async function SubjectsPage() {
  const [subjects, t] = await Promise.all([getSubjectCards(), getT('subjects')]);
  return (
    <div className="animate-fade-up">
      <PageHeader title={t('list.title')} description={t('list.description')} />
      <SubjectLibrary subjects={subjects} />
    </div>
  );
}
