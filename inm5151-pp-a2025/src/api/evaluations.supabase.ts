import { supabase } from "../lib/supabase";

export interface Evaluation {
  id?: string;
  user_id?: string;
  course_id: string;
  title: string;
  weight: number;        // ex : 20 pour 20%
  score?: number | null; // 0–100 ou null si pas encore noté
  created_at?: string;
  updated_at?: string;
}

export interface EvaluationInput {
  course_id: string;
  title: string;
  weight: number;
  score?: number | null;
}

/**
 * Liste toutes les évaluations d’un cours donné (triées par poids décroissant)
 */
export async function listEvaluationsByCourse(
  courseId: string
): Promise<Evaluation[]> {
  const { data, error } = await supabase
    .from("evaluations")
    .select("*")
    .eq("course_id", courseId)
    .order("weight", { ascending: false });

  if (error) throw error;
  return (data || []) as Evaluation[];
}

/**
 * Crée une nouvelle évaluation pour un cours.
 */
export async function createEvaluation(
  input: EvaluationInput
): Promise<Evaluation> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!userData?.user) {
    throw new Error("Aucun utilisateur connecté");
    }

  const { data, error } = await supabase
    .from("evaluations")
    .insert([
      {
        course_id: input.course_id,
        title: input.title.trim(),
        weight: input.weight,
        score: input.score ?? null,
        user_id: userData.user.id,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Evaluation;
}

/**
 * Met à jour une évaluation existante.
 */
export async function updateEvaluation(
  id: string,
  patch: Partial<EvaluationInput>
): Promise<Evaluation> {
  const { data, error } = await supabase
    .from("evaluations")
    .update({
      ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
      ...(patch.weight !== undefined ? { weight: patch.weight } : {}),
      ...(patch.score !== undefined ? { score: patch.score } : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Evaluation;
}

/**
 * Supprime une évaluation.
 */
export async function deleteEvaluation(id: string): Promise<void> {
  const { error } = await supabase
    .from("evaluations")
    .delete()
    .eq("id", id);

  if (error) throw error;
}