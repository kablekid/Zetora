import { APP_TIMEZONE } from '@/lib/constants';
import { LOCALE_META, type Locale } from './config';
import type { Translator } from './core';
import type { Messages } from './messages';

/** Locale-aware dates, relative times, durations and greetings. Latin digits in both languages. */
export function createFormat(locale: Locale, t: Translator<Messages['common']>) {
  const tag = LOCALE_META[locale].bcp47;
  const tz = APP_TIMEZONE;

  const date = (value: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions) =>
    value
      ? new Intl.DateTimeFormat(tag, { timeZone: tz, day: 'numeric', month: 'short', year: 'numeric', ...opts }).format(new Date(value))
      : '—';

  const dateTime = (value: string | Date | null | undefined) =>
    value
      ? new Intl.DateTimeFormat(tag, { timeZone: tz, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(value))
      : '—';

  const longDate = (value: Date = new Date()) =>
    new Intl.DateTimeFormat(tag, { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' }).format(value);

  const timeAgo = (value: string | Date | null | undefined) => {
    if (!value) return '—';
    const diff = (new Date(value).getTime() - Date.now()) / 1000;
    const abs = Math.abs(diff);
    const rtf = new Intl.RelativeTimeFormat(tag, { numeric: 'auto' });
    if (abs < 60) return t('time.justNow');
    if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
    if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), 'day');
    return date(value);
  };

  const hour = (d: Date = new Date()) =>
    Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).format(d));

  const greeting = (d: Date = new Date()) => {
    const h = hour(d);
    return h < 12 ? t('greeting.morning') : h < 17 ? t('greeting.afternoon') : t('greeting.evening');
  };

  const duration = (seconds: number | null | undefined) => {
    if (seconds == null) return '—';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    if (m === 0) return t('time.seconds', { s });
    return s === 0 ? t('time.minutes', { m }) : t('time.minSec', { m, s });
  };

  const number = (n: number, opts?: Intl.NumberFormatOptions) => new Intl.NumberFormat(tag, opts).format(n);

  return { locale, date, dateTime, longDate, timeAgo, greeting, duration, number };
}
export type Format = ReturnType<typeof createFormat>;
