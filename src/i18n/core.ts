// Shared by server and client. No React, no Next.
import { LOCALE_META, type Locale } from './config';

export type Plural = { one: string; other: string };
export type Leaf = string | Plural;
export interface Tree { [key: string]: Leaf | Tree }
export type Vars = Record<string, string | number>;

/** "a.b.c" for every string / plural leaf of a message tree. */
export type Paths<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : T[K] extends { one: string; other: string }
      ? K
      : T[K] extends readonly unknown[]
        ? never // arrays of copy are read with t.raw()
        : `${K}.${Paths<T[K]>}`;
}[keyof T & string];

export interface Translator<M> {
  (key: Paths<M>, vars?: Vars): string;
  /** Raw value (arrays/objects of copy, e.g. legal-page sections). */
  raw: <R = unknown>(key: string) => R;
}

function lookup(messages: unknown, key: string): unknown {
  let cur: unknown = messages;
  for (const part of key.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

export function createTranslator<M>(messages: M, locale: Locale): Translator<M> {
  const rules = new Intl.PluralRules(LOCALE_META[locale].bcp47);
  const t = ((key: string, vars?: Vars) => {
    let v = lookup(messages, key);
    if (v && typeof v === 'object' && 'one' in v && 'other' in v) {
      const form = rules.select(Number(vars?.count ?? 0));
      v = form === 'one' ? (v as Plural).one : (v as Plural).other;
    }
    if (typeof v !== 'string') return key; // a loud, visible fallback; the type system prevents this for static keys
    return vars ? v.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : v;
  }) as unknown as Translator<M>;
  t.raw = <R,>(key: string) => lookup(messages, key) as R;
  return t;
}

/** Splits "Agree to <terms>our Terms</terms> and <privacy>Privacy</privacy>" into text + tagged chunks. */
export function parseRich(input: string): Array<{ tag: string | null; text: string }> {
  const out: Array<{ tag: string | null; text: string }> = [];
  const re = /<(\w+)>(.*?)<\/\1>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) {
    if (m.index > last) out.push({ tag: null, text: input.slice(last, m.index) });
    out.push({ tag: m[1], text: m[2] });
    last = m.index + m[0].length;
  }
  if (last < input.length) out.push({ tag: null, text: input.slice(last) });
  return out;
}
