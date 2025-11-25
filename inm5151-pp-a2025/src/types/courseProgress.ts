// src/types/courseProgress.ts

// Type de chaque unité d'apprentissage dans le document
export type LearningUnitType =
  | "course"      // racine logique (optionnel)
  | "chapter"     // chapitre (H1)
  | "section"     // section (H2)
  | "subsection"  // sous-section (H3)
  | "exercise"    // TP / labo / exercice
  | "other";      // tout ce qui ne rentre pas bien ailleurs

// Une unité d'apprentissage dans l'arbre (chapitre, section, exercice, etc.)
export interface LearningUnit {
  id: string;                 // identifiant unique (ex: uuid)
  parentId: string | null;    // null si c'est un niveau racine
  title: string;              // ex: "Chapitre 1 – Listes"
  type: LearningUnitType;
  order: number;              // ordre d'affichage (0,1,2,...)
  completed: boolean;         // coché ou pas
  children?: LearningUnit[];  // sous-éléments hiérarchiques
}

// Statistiques de progression calculées à partir de units
export interface CourseProgressStats {
  totalUnits: number;         // nombre total d’unités "cochables"
  completedUnits: number;     // nombre d’unités complétées
  progress: number;           // entre 0 et 1 (ex: 0.6 = 60%)
}

// Un cours téléversé et analysé
export interface CourseProgress {
  id: string;                     // identifiant interne Unical
  courseCode?: string;            // ex: "INF3105" (optionnel)
  title: string;                  // titre global du document
  fileName: string;               // nom du fichier téléversé
  fileType: "pdf" | "pptx" | "docx" | "other";
  createdAt: string;              // ISO string
  updatedAt: string;              // ISO string

  // Racines de l’arbre d’apprentissage (souvent les chapitres)
  roots: LearningUnit[];

  // Statistiques mises à jour à chaque coche
  stats: CourseProgressStats;
}
