import type { Metadata } from 'next';
import { Mail } from 'lucide-react';
import { ProsePage } from '@/components/marketing/prose-page';
import { Card } from '@/components/ui/card';
import { env } from '@/lib/env';
import { getT, pageTitle } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('marketing');
  return { title: await pageTitle('contact'), description: t('contact.intro'), alternates: { canonical: '/contact' } };
}

export default async function ContactPage() {
  const t = await getT('marketing');
  return (
    <ProsePage title={t('contact.title')} intro={t('contact.intro')}>
      <Card className="flex items-start gap-4 p-6">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><Mail className="size-5" /></span>
        <div>
          <h2 className="!mb-1 !text-base">{t('contact.email')}</h2>
          {env.contactEmail ? (
            <a href={`mailto:${env.contactEmail}`} className="font-medium text-primary hover:underline">{env.contactEmail}</a>
          ) : (
            <p className="text-muted-foreground">{t('contact.soon')}</p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">{t('contact.hint')}</p>
        </div>
      </Card>
    </ProsePage>
  );
}
