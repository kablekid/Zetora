import type { MetadataRoute } from 'next';
import { APP_NAME } from '@/lib/constants';
import { createTranslator } from '@/i18n/core';
import { getLocale } from '@/i18n/server';
import { messages } from '@/i18n/messages';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const locale = await getLocale();
  const tc = createTranslator(messages[locale].common, locale);
  const tm = createTranslator(messages[locale].marketing, locale);
  return {
    name: `${APP_NAME} — ${tc('tagline')}`,
    short_name: APP_NAME,
    description: tm('meta.description'),
    lang: locale,
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f6f7fb',
    theme_color: '#4338ca',
    categories: ['education'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
