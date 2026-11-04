'use server';

import { z } from 'zod';
import { assertAdmin } from '@/lib/auth';
import { fail, type ActionResult } from '@/lib/actions-helpers';

export interface BankQuestion {
  id: string; body: string; type: string; difficulty: string; unit_id: string | null; unit_number: number | null;
}

const filterSchema = z.object({
  subjectId: z.uuid(),
  unitId: z.uuid().nullish(),
  difficulty: z.enum(['easy', 'medium', 'hard']).nullish(),
  q: z.string().max(100).nullish(),
});

/** Question-bank lookup for the quiz builder (admin only). */
export async function searchBankAction(input: unknown): Promise<ActionResult<BankQuestion[]>> {
  try {
    const { supabase } = await assertAdmin();
    const f = filterSchema.safeParse(input);
    if (!f.success) return fail('Invalid filter.');
    let query = supabase
      .from('questions')
      .select('id,body,type,difficulty,unit_id,units(number)')
      .eq('subject_id', f.data.subjectId)
      .order('created_at', { ascending: false })
      .limit(40);
    if (f.data.unitId) query = query.eq('unit_id', f.data.unitId);
    if (f.data.difficulty) query = query.eq('difficulty', f.data.difficulty);
    if (f.data.q?.trim()) query = query.ilike('body', `%${f.data.q.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
    const { data, error } = await query;
    if (error) return fail(error);
    const rows = ((data ?? []) as unknown as Array<{ id: string; body: string; type: string; difficulty: string; unit_id: string | null; units: { number: number } | { number: number }[] | null }>).map((r) => {
      const u = Array.isArray(r.units) ? r.units[0] : r.units;
      return { id: r.id, body: r.body, type: r.type, difficulty: r.difficulty, unit_id: r.unit_id, unit_number: u?.number ?? null };
    });
    return { ok: true, data: rows };
  } catch (e) {
    return fail(e);
  }
}
