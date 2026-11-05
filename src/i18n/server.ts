import 'server-only';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './config';
import { createTranslator } from './core';
import { createFormat } from './format';
import { messages, type Messages } from './messages';
import serverTextAm from './messages/am/server-text';

/** cookie → Accept-Language → default. Cached per request. */
export const getLocale = cache(async (): Promise<Locale> => {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const accept = (await headers()).get('accept-language') ?? '';
  const first = accept.split(',')[0]?.trim().toLowerCase() ?? '';
  return first.startsWith('am') ? 'am' : DEFAULT_LOCALE;
});

export async function getT<N extends keyof Messages>(ns: N) {
  const locale = await getLocale();
  return createTranslator(messages[locale][ns] as Messages[N], locale);
}

export async function getFormat() {
  const locale = await getLocale();
  return createFormat(locale, createTranslator(messages[locale].common, locale));
}

/** The message groups a provider should ship to the browser for this request. */
export async function pickMessages(namespaces: readonly (keyof Messages)[]) {
  const locale = await getLocale();
  const out: Partial<Messages> = {};
  for (const ns of namespaces) (out as Record<string, unknown>)[ns] = messages[locale][ns];
  return out;
}

/** English → Amharic map for text produced by server actions, validators and the database. */
export async function getServerText(): Promise<Record<string, string>> {
  return (await getLocale()) === 'am' ? serverTextAm : {};
}

/** Localised <title> for a page: `export async function generateMetadata() { return { title: await pageTitle('dashboard') } }` */
export async function pageTitle(key: Exclude<keyof Messages['meta'], 'adminPages'> | `adminPages.${keyof Messages['meta']['adminPages']}`) {
  const locale = await getLocale();
  return createTranslator(messages[locale].meta, locale)(key as never);
}
