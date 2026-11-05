import { ProsePage, type LegalSection } from './prose-page';
import { Rich } from '@/i18n/rich';
import { env } from '@/lib/env';
import { getT } from '@/i18n/server';

/** Renders the privacy policy or terms from the dictionary (so both languages share one layout). */
export async function LegalBody({ doc }: { doc: 'privacy' | 'terms' }) {
  const t = await getT('legal');
  const sections = t.raw<LegalSection[]>(`${doc}.sections`);
  const how = doc === 'privacy'
    ? env.contactEmail ? t('privacy.howEmail', { email: env.contactEmail }) : t('privacy.howPage')
    : '';
  const mail = (c: string) => <a className="font-medium text-primary hover:underline" href={`mailto:${env.contactEmail}`}>{c}</a>;
  const fill = (text: string) => text.replace('{how}', how);

  return (
    <ProsePage title={t(`${doc}.title`)} intro={t(`${doc}.intro`)} updated={t('updated', { date: t(`${doc}.date`) })}>
      {sections.map((s) => (
        <section key={s.title}>
          <h2>{s.title}</h2>
          {s.paragraphs?.map((p) => <p key={p}><Rich text={fill(p)} tags={{ mail }} /></p>)}
          {s.list && <ul>{s.list.map((li) => <li key={li}><Rich text={li} /></li>)}</ul>}
          {s.after?.map((p) => <p key={p}>{p}</p>)}
        </section>
      ))}
    </ProsePage>
  );
}
