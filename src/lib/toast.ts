import { toast as sonner } from 'sonner';
import { translateServerText } from '@/i18n/server-text';

type Opts = Parameters<typeof sonner.success>[1];
const wrap = (fn: (m: string, o?: Opts) => string | number) => (message: string, opts?: Opts) => fn(translateServerText(message), opts);

/** sonner, but messages that come from the server are shown in the user's language. */
export const toast = {
  success: wrap(sonner.success),
  error: wrap(sonner.error),
  info: wrap(sonner.info),
  warning: wrap(sonner.warning),
};
