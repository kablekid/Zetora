export const LOCALES = ['en', 'am'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'zetora-locale';

export const LOCALE_META: Record<Locale, { label: string; short: string; bcp47: string; dir: 'ltr' }> = {
  en: { label: 'English', short: 'EN', bcp47: 'en-GB', dir: 'ltr' },
  am: { label: 'አማርኛ', short: 'አማ', bcp47: 'am-ET', dir: 'ltr' },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Message groups that client components read. They are sent to the browser with the page.
 * Everything else (marketing prose, dashboard, legal text …) is rendered on the server only.
 */
export const CLIENT_NAMESPACES = [
  'common', 'nav', 'auth', 'subjects', 'learn', 'quiz', 'charts', 'notifications', 'search', 'settings', 'viewer',
] as const;
export const ADMIN_CLIENT_NAMESPACES = ['admin'] as const;
export type ClientNamespace = (typeof CLIENT_NAMESPACES)[number];
