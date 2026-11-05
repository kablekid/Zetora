import { en } from './en';
import { am } from './am';
import type { Locale } from '../config';

/** `am` is typed as `typeof en`, so a missing or extra translation key is a compile error. */
export const messages: Record<Locale, typeof en> = { en, am };
export type Messages = typeof en;
