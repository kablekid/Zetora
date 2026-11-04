import type { Metadata } from 'next';
import { Mail } from 'lucide-react';
import { ProsePage } from '@/components/marketing/prose-page';
import { Card } from '@/components/ui/card';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Zetora team.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <ProsePage title="Contact" intro="Questions, feedback or a problem with your account? We’d like to hear from you.">
      <Card className="flex items-start gap-4 p-6">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><Mail className="size-5" /></span>
        <div>
          <h2 className="!mb-1 !text-base">Email</h2>
          {env.contactEmail ? (
            <a href={`mailto:${env.contactEmail}`} className="font-medium text-primary hover:underline">{env.contactEmail}</a>
          ) : (
            <p className="text-muted-foreground">Contact details will be published here soon.</p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">Please include the email address you registered with so we can help faster.</p>
        </div>
      </Card>
    </ProsePage>
  );
}
