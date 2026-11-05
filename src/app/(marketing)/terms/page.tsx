import type { Metadata } from 'next';
import { LegalBody } from '@/components/marketing/legal-body';
import { getT, pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('legal');
  return { title: await pageTitle('terms'), description: t('terms.intro'), alternates: { canonical: '/terms' } };
}

// NOTE for the site owner: plain-language starting points that match what the app does — have them reviewed
// (in both languages) against the laws that apply to you before launch.
export default function Page() {
  return <LegalBody doc="terms" />;
}
