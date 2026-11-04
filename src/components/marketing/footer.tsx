import Link from 'next/link';
import { Globe, Mail, Send, Video } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';
import { env } from '@/lib/env';

function Social({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  const base = 'inline-flex size-10 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors';
  if (!href) {
    return (
      <span aria-disabled="true" title={`${label} — coming soon`} className={`${base} cursor-not-allowed opacity-50`}>
        {children}
        <span className="sr-only">{label} (coming soon)</span>
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={`${base} hover:border-input hover:text-foreground`}>
      {children}
    </a>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {APP_NAME} is a learning platform for Grade 12 remedial students. {APP_TAGLINE}
            </p>
            <div className="mt-5 flex gap-2">
              <Social href={env.social.telegram} label="Telegram"><Send className="size-4" /></Social>
              <Social href={env.social.youtube} label="YouTube"><Video className="size-4" /></Social>
              <Social href={env.social.facebook} label="Community page"><Globe className="size-4" /></Social>
              {env.contactEmail ? (
                <Social href={`mailto:${env.contactEmail}`} label="Email"><Mail className="size-4" /></Social>
              ) : null}
            </div>
          </div>
          <FooterColumn title="Learn" links={[['Explore subjects', '/#subjects'], ['Features', '/#features'], ['How it works', '/#how-it-works']]} />
          <FooterColumn title="Zetora" links={[['About Zetora', '/about'], ['Contact', '/contact'], ['Sign in', '/login']]} />
          <FooterColumn title="Legal" links={[['Privacy policy', '/privacy'], ['Terms of service', '/terms']]} />
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <p>Zetora is an independent study platform and is not affiliated with any government body or examination authority.</p>
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
