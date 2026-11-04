import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env, isSupabaseConfigured } from '@/lib/env';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/subjects',
  '/quiz',
  '/attempts',
  '/exams',
  '/progress',
  '/bookmarks',
  '/notifications',
  '/search',
  '/settings',
  '/admin',
];
const AUTH_PAGES = ['/login', '/register', '/forgot-password'];

const matches = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || path.startsWith(p + '/'));

/**
 * Refreshes the Supabase session cookie on every request and does the coarse
 * "are you signed in?" redirect. Authorisation (admin vs student) is enforced
 * again in server layouts/actions and, ultimately, by database RLS.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getClaims() verifies the JWT and refreshes it when it is about to expire.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const path = request.nextUrl.pathname;

  if (!signedIn && matches(path, PROTECTED_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', path + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (signedIn && matches(path, AUTH_PAGES)) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}
