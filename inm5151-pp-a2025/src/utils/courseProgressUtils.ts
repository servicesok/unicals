// src/utils/courseProgressUtils.ts

import { CourseProgress, LearningUnit, CourseProgressStats } from "../types/courseProgress";

// ------------------------------------------------------
// Compter toutes les unités cochables dans un arbre
// ------------------------------------------------------

export function countUnits(root: LearningUnit): number {
  let total = 1; // lui-même

  if (root.children && root.children.length > 0) {
    for (const child of root.children) {
      total += countUnits(child);
    }
  }

  return total;
}

// ------------------------------------------------------
// Compter les unités complétées
// ------------------------------------------------------

export function countCompletedUnits(root: LearningUnit): number {
  let completed = root.completed ? 1 : 0;

  if (root.children && root.children.length > 0) {
    for (const child of root.children) {
      completed += countCompletedUnits(child);
    }
  }

  return completed;
}

// ------------------------------------------------------
// Calcul complet des statistiques d’un cours
// ------------------------------------------------------

export function computeCourseStats(course: CourseProgress): CourseProgressStats {
  let totalUnits = 0;
  let completedUnits = 0;

  for (const root of course.roots) {
    totalUnits += countUnits(root);
    completedUnits += countCompletedUnits(root);
  }

  const progress = totalUnits === 0 ? 0 : completedUnits / totalUnits;

  return {
    totalUnits,
    completedUnits,
    progress
  };
}

// ------------------------------------------------------
// Mettre à jour une unité cochée/décochée
// ------------------------------------------------------

export function updateUnitCompletion(
  unit: LearningUnit,
  unitId: string,
  completed: boolean
): LearningUnit {
  if (unit.id === unitId) {
    return {
      ...unit,
      completed
    };
  }

  if (unit.children) {
    return {
      ...unit,
      children: unit.children.map((child) =>
        updateUnitCompletion(child, unitId, completed)
      )
    };
  }

  return unit;
}

// ------------------------------------------------------
// Mettre à jour tout le cours après une coche
// ------------------------------------------------------

export function updateCourseProgress(
  course: CourseProgress,
  unitId: string,
  completed: boolean
): CourseProgress {
  // Mise à jour de toutes les racines
  const newRoots = course.roots.map((root) =>
    updateUnitCompletion(root, unitId, completed)
  );

  // Recalculer les stats
  const newStats = computeCourseStats({
    ...course,
    roots: newRoots
  });

  return {
    ...course,
    roots: newRoots,
    stats: newStats,
    updatedAt: new Date().toISOString()
  };
}
