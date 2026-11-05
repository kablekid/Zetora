import Link from 'next/link';
import { Globe, Mail, Send, Video } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { env } from '@/lib/env';
import { getT } from '@/i18n/server';

function Social({ href, label, soon, soonSr, children }: { href: string; label: string; soon: string; soonSr: string; children: React.ReactNode }) {
  const base = 'inline-flex size-10 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors';
  if (!href) {
    return (
      <span aria-disabled="true" title={soon} className={`${base} cursor-not-allowed opacity-50`}>
        {children}
        <span className="sr-only">{soonSr}</span>
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={`${base} hover:border-input hover:text-foreground`}>
      {children}
    </a>
  );
}

export async function MarketingFooter() {
  const t = await getT('marketing');
  const soon = (label: string) => ({ soon: t('footer.comingSoon', { label }), soonSr: t('footer.comingSoonSr', { label }) });
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">{t('footer.blurb')}</p>
            <div className="mt-5 flex gap-2">
              <Social href={env.social.telegram} label={t('footer.telegram')} {...soon(t('footer.telegram'))}><Send className="size-4" /></Social>
              <Social href={env.social.youtube} label={t('footer.youtube')} {...soon(t('footer.youtube'))}><Video className="size-4" /></Social>
              <Social href={env.social.facebook} label={t('footer.community')} {...soon(t('footer.community'))}><Globe className="size-4" /></Social>
              {env.contactEmail ? (
                <Social href={`mailto:${env.contactEmail}`} label={t('footer.email')} {...soon(t('footer.email'))}><Mail className="size-4" /></Social>
              ) : null}
            </div>
          </div>
          <FooterColumn title={t('footer.learn')} links={[[t('footer.exploreSubjects'), '/#subjects'], [t('footer.features'), '/#features'], [t('footer.howItWorks'), '/#how-it-works']]} />
          <FooterColumn title={t('footer.company')} links={[[t('footer.about'), '/about'], [t('footer.contact'), '/contact'], [t('footer.signIn'), '/login']]} />
          <FooterColumn title={t('footer.legal')} links={[[t('footer.privacy'), '/privacy'], [t('footer.terms'), '/terms']]} />
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <p>{t('footer.disclaimer')}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
