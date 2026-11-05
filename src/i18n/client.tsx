'use client';
import { createContext, useContext, useEffect, useMemo } from 'react';
import type { Locale } from './config';
import { createTranslator } from './core';
import { createFormat } from './format';
import { lookupServerText, setServerText } from './server-text';
import type { Messages } from './messages';

interface Ctx {
  locale: Locale;
  messages: Partial<Messages>;
  serverText: Record<string, string>;
}
const I18nContext = createContext<Ctx | null>(null);

/** Nested providers merge, so the admin area can add its own message group on top of the app's. */
export function I18nProvider({
  locale, messages, serverText, children,
}: {
  locale: Locale; messages: Partial<Messages>; serverText?: Record<string, string>; children: React.ReactNode;
}) {
  const parent = useContext(I18nContext);
  const value = useMemo<Ctx>(
    () => ({
      locale,
      messages: { ...(parent?.messages ?? {}), ...messages },
      serverText: { ...(parent?.serverText ?? {}), ...(serverText ?? {}) },
    }),
    [locale, messages, serverText, parent],
  );
  useEffect(() => {
    setServerText(value.serverText);
  }, [value.serverText]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useCtx() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT must be used inside <I18nProvider>');
  return ctx;
}

export function useLocale(): Locale {
  return useCtx().locale;
}

export function useT<N extends keyof Messages>(ns: N) {
  const { locale, messages } = useCtx();
  const group = messages[ns];
  if (!group) throw new Error(`i18n namespace "${String(ns)}" is not available here — add it to the nearest I18nProvider`);
  return useMemo(() => createTranslator(group as Messages[N], locale), [group, locale]);
}

export function useFormat() {
  const { locale } = useCtx();
  const t = useT('common');
  return useMemo(() => createFormat(locale, t), [locale, t]);
}

/** Translate a message that came from the server (action result, validation, DB error). */
export function useServerText() {
  const { serverText } = useCtx();
  return useMemo(
    () => (message: string | null | undefined) => {
      return lookupServerText(serverText, message);
    },
    [serverText],
  );
}
