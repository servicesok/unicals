import { supabase } from "../lib/supabase";

export interface Course {
  id?: string;
  user_id?: string;
  code: string;
  title: string;
  passing_threshold?: number | null;
  created_at?: string;
  updated_at?: string;
  nombre_seances?: number | null;
}

export interface CourseInput {
  code: string;
  title: string;
  passing_threshold?: number | null;
  nombre_seances?: number | null;
}

/**
 * Liste tous les cours de l'utilisateur connecté
 * (RLS fait déjà le filtrage, donc pas besoin d'ajouter user_id ici)
 */
export async function listCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("code", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Course[];
}

export async function decrementCourseSessions(
  id: string
): Promise<Course | null> {
  // 1) Lire la valeur actuelle
  const { data, error } = await supabase
    .from("courses")
    .select("nombre_seances")
    .eq("id", id)
    .single();

  if (error) throw error;

  const current = (data?.nombre_seances ?? 0) as number;

  // Si déjà 0 ou null -> on ne fait rien
  if (!current || current <= 0) {
    return null;
  }

  // 2) Mettre à jour en décrémentant
  const { data: updated, error: updateError } = await supabase
    .from("courses")
    .update({ nombre_seances: current - 1 })
    .eq("id", id)
    .select()
    .single();

  if (updateError) throw updateError;

  return updated as Course;
}

/**
 * Crée un nouveau cours (utilise l'utilisateur connecté pour user_id)
 */
export async function createCourse(course: CourseInput): Promise<Course> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!userData?.user) throw new Error("Aucun utilisateur connecté");

  const { data, error } = await supabase
    .from("courses")
    .insert([
      {
        code: course.code.trim(),
        title: course.title.trim(),
        passing_threshold: course.passing_threshold ?? null,
        user_id: userData.user.id, // <-- clé RLS
        nombre_seances: course.nombre_seances ?? 15,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Course;
}

/**
 * Met à jour un cours existant.
 * (RLS vérifiera que c'est bien le cours de l'utiliseateur connecté)
 */
export async function updateCourse(
  id: string,
  patch: Partial<CourseInput>
): Promise<Course> {
  const { data, error } = await supabase
    .from("courses")
    .update({
      ...(patch.code !== undefined ? { code: patch.code.trim() } : {}),
      ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
      ...(patch.passing_threshold !== undefined
        ? { passing_threshold: patch.passing_threshold }
        : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Course;
}

/**
 * Supprime un cours.
 */
export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase.from("courses").delete().eq("id", id);

  if (error) throw error;
}

export async function getCourseById(id: string): Promise<Course> {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Course;
}
