/**
 * Environment access. Only NEXT_PUBLIC_* values are used — the Supabase
 * service-role key is intentionally never read anywhere in this app.
 */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '',
  social: {
    telegram: process.env.NEXT_PUBLIC_SOCIAL_TELEGRAM ?? '',
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ?? '',
    youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE ?? '',
  },
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
