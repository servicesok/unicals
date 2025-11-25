import { supabase } from '../lib/supabase';

export interface Revenue {
  id: string; 
  user_id: string;
  type: string;
  montant: number;
  date: string;
  description?: string | null;
  recurrence: string;
  created_at?: string;
}

export type RevenueInput = Omit<Revenue, 'id' | 'created_at' | 'user_id'>;

export async function listRevenues() {
  const { data, error } = await supabase
    .from('revenues')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) throw error;
  return data as Revenue[];
}

export async function createRevenue(r: RevenueInput) {
  // 1. Récupérer l'utilisateur actuellement connecté
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilisateur non connecté : Impossible d'ajouter un revenu");
  }

  // 2. Insérer avec le vrai user_id
  const { data, error } = await supabase
    .from('revenues')
    .insert([{ 
      ...r, 
      user_id: user.id 
    }])
    .select()
    .single();

  if (error) {
    console.error("Erreur Supabase:", error); 
    throw error;
  }
  
  return data as Revenue;
}

export async function updateRevenue(id: string, patch: Partial<RevenueInput>) {
  const { data, error } = await supabase
    .from('revenues')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data as Revenue;
}

export async function deleteRevenue(id: string) {
  const { error } = await supabase
    .from('revenues')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}