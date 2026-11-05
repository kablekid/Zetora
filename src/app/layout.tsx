import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { ServiceWorkerRegister } from '@/components/pwa/sw-register';
import { APP_NAME } from '@/lib/constants';
import { env } from '@/lib/env';
import { CLIENT_NAMESPACES } from '@/i18n/config';
import { I18nProvider } from '@/i18n/client';
import { createTranslator } from '@/i18n/core';
import { getLocale, getServerText, pickMessages } from '@/i18n/server';
import { messages } from '@/i18n/messages';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const tc = createTranslator(messages[locale].common, locale);
  const tm = createTranslator(messages[locale].marketing, locale);
  const title = `${APP_NAME} — ${tc('tagline')}`;
  const description = tm('meta.description');
  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: title, template: `%s · ${APP_NAME}` },
    description,
    applicationName: APP_NAME,
    keywords: tm.raw<string[]>('meta.keywords'),
    openGraph: { title, description, siteName: APP_NAME, type: 'website', locale: locale === 'am' ? 'am_ET' : 'en_ET' },
    twitter: { card: 'summary', title, description },
    icons: { apple: '/icons/apple-touch-icon.png' },
    appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: 'default' },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f7fb' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0b13' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const [clientMessages, serverText] = await Promise.all([pickMessages(CLIENT_NAMESPACES), getServerText()]);
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <I18nProvider locale={locale} messages={clientMessages} serverText={serverText}>
            {children}
            <Toaster />
            <ServiceWorkerRegister />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
