import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';
import type { SubjectCard } from '@/lib/types';

/** Published subjects with counts (+ the caller's progress when signed in). */
export const getSubjectCards = cache(async (): Promise<SubjectCard[]> => {
  if (!isSupabaseConfigured) return [];
  // Create the client outside try/catch: cookies() signals dynamic rendering by throwing.
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.rpc('get_subject_cards');
    if (error) throw error;
    return (data ?? []) as SubjectCard[];
  } catch (e) {
    console.error('getSubjectCards failed', e);
    return [];
  }
});
