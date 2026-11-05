import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProsePage } from '@/components/marketing/prose-page';
import { getT, pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('marketing');
  return { title: await pageTitle('about'), description: t('about.intro'), alternates: { canonical: '/about' } };
}

export default async function AboutPage() {
  const t = await getT('marketing');
  return (
    <ProsePage title={t('about.title')} intro={t('about.intro')}>
      <section>
        <h2>{t('about.why.title')}</h2>
        {t.raw<string[]>('about.why.paragraphs').map((p) => <p key={p}>{p}</p>)}
      </section>
      <section>
        <h2>{t('about.what.title')}</h2>
        <ul>{t.raw<string[]>('about.what.list').map((li) => <li key={li}>{li}</li>)}</ul>
      </section>
      <section>
        <h2>{t('about.good.title')}</h2>
        {t.raw<string[]>('about.good.paragraphs').map((p) => <p key={p}>{p}</p>)}
      </section>
      <Button asChild size="lg"><Link href="/register">{t('about.cta')}</Link></Button>
    </ProsePage>
  );
}
