import { supabase } from '../lib/supabase';

export interface Depense {
  id: string;
  user_id: string;
  type: string;
  montant: number;
  date: string;
  description?: string | null;
  recurrence: string;
  created_at?: string;
}

export type DepenseInput = Omit<Depense, 'id' | 'created_at' | 'user_id'>;

export async function listDepenses() {
  const { data, error } = await supabase
    .from('depenses')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data as Depense[];
}

export async function createDepense(d: DepenseInput) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Utilisateur non connecté");

  const { data, error } = await supabase
    .from('depenses')
    .insert([{ ...d, user_id: user.id }])
    .select()
    .single();
  if (error) throw error;
  return data as Depense;
}

export async function updateDepense(id: string, patch: Partial<DepenseInput>) {
  const { data, error } = await supabase
    .from('depenses')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Depense;
}

export async function deleteDepense(id: string) {
  const { error } = await supabase.from('depenses').delete().eq('id', id);
  if (error) throw error;
}