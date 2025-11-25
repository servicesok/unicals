import { supabase } from "../lib/supabase";

export type DeadlineKind = "exam" | "tp" | "quiz" | "payment";

export interface Deadline {
  id?: string;
  user_id?: string;
  title: string;
  kind: DeadlineKind;
  course_id?: string | null;   // lien optionnel vers un cours
  due_at: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Input envoyé par le formulaire (pas d'id ni de champs système)
export type DeadlineInput = Omit<
  Deadline,
  "id" | "created_at" | "updated_at" | "user_id"
>;

export async function listDeadlines() {
  const { data, error } = await supabase
    .from("deadlines")
    .select("*")
    .order("due_at", { ascending: true });

  if (error) throw error;
  return data as Deadline[];
}

export async function createDeadline(d: DeadlineInput) {
  const USER_ID = import.meta.env.VITE_USER_ID as string | undefined;

  const { data, error } = await supabase
    .from("deadlines")
    .insert([{ ...d, user_id: USER_ID }])
    .select()
    .single();

  if (error) throw error;
  return data as Deadline;
}

export async function updateDeadline(
  id: string,
  patch: Partial<DeadlineInput>
) {
  const { data, error } = await supabase
    .from("deadlines")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Deadline;
}

export async function deleteDeadline(id: string) {
  const { error } = await supabase
    .from("deadlines")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
