export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };

export function fail(error: unknown, fallback = 'Something went wrong. Please try again.'): { ok: false; error: string } {
  if (typeof error === 'string') return { ok: false, error };
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    const msg = (error as { message: string }).message;
    // Postgres / PostgREST errors are user-readable for our own RAISE EXCEPTION messages.
    return { ok: false, error: msg || fallback };
  }
  return { ok: false, error: fallback };
}

export function ok<T>(data?: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}
