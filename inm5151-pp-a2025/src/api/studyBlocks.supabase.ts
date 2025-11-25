import { supabase } from "../lib/supabase";

export interface StudyBlock {
  id?: string;
  user_id?: string;
  title?: string | null;
  start_at: string;          // ISO string
  end_at: string;            // ISO string
  duration_minutes: number;
  source?: "auto" | "manual" | string | null;
  course_id?: string | null; // ✅ lien optionnel vers un cours
  created_at?: string;
  updated_at?: string;
}

export interface StudyBlockInput {
  title?: string | null;
  start_at: string;
  end_at: string;
  duration_minutes: number;
  source?: "auto" | "manual" | string | null;
  course_id?: string | null;
}

/**
 * Liste tous les blocs d'étude de l'utilisateur connecté
 */
export async function listStudyBlocks(): Promise<StudyBlock[]> {
  const USER_ID = import.meta.env.VITE_USER_ID;

  const { data, error } = await supabase
    .from("study_blocks")
    .select("*")
    .eq("user_id", USER_ID)
    .order("start_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as StudyBlock[];
}

/**
 * Crée un bloc d'étude
 */
export async function createStudyBlock(
  block: StudyBlockInput
): Promise<StudyBlock> {
  const USER_ID = import.meta.env.VITE_USER_ID;

  const { data, error } = await supabase
    .from("study_blocks")
    .insert([
      {
        ...block,
        user_id: USER_ID,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as StudyBlock;
}

/**
 * Supprime un bloc d'étude par id
 */
export async function deleteStudyBlock(id: string): Promise<void> {
  const { error } = await supabase
    .from("study_blocks")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
