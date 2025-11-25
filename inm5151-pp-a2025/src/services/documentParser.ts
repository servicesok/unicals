// ============================================
// UNICAL - Document Parser ULTRA-ROBUSTE
// Compatible pdfjs-dist 5.x + Ionic + Vite
// PDF + DOCX + PPTX + TS Strict
// VERSION SIMPLIFIÉE ET FIABLE
// ============================================

import { v4 as uuidv4 } from "uuid";
import * as pdfjsLib from "pdfjs-dist";

// 🔥 Configuration Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

import mammoth from "mammoth";
import JSZip from "jszip";

import {
  CourseProgress,
  LearningUnit,
  LearningUnitType,
  CourseProgressStats,
} from "../types/courseProgress";

// ==================================================
// HELPERS
// ==================================================
function createUnit(
  title: string,
  type: LearningUnitType,
  parentId: string | null = null
): LearningUnit {
  return {
    id: uuidv4(),
    parentId,
    title,
    type,
    order: 0,
    completed: false,
    children: [],
  };
}

function countUnits(units: LearningUnit[]): number {
  let total = 0;
  const dfs = (u: LearningUnit) => {
    total++;
    u.children?.forEach(dfs);
  };
  units.forEach(dfs);
  return total;
}

// ==================================================
// VALIDATION DE TITRE (Ultra-stricte)
// ==================================================
function isValidTitle(line: string): boolean {
  const cleaned = line.trim();
  
  // Filtres de base
  if (cleaned.length < 5 || cleaned.length > 100) return false;
  
  const wordCount = cleaned.split(/\s+/).length;
  if (wordCount > 12) return false;
  
  // Patterns à ignorer
  const rejectPatterns = [
    /^(le|la|les|un|une|des|ce|cette|il|elle|on)\s/i,
    /©/,
    /^\d{4}$/,  // Juste une année
    /^page/i,
    /^figure/i,
    /^tableau/i,
    /^exemple/i,
    /prof/i,
    /université/i,
    /département/i,
    /droits/i,
    /réservés/i,
  ];
  
  for (const pattern of rejectPatterns) {
    if (pattern.test(cleaned)) return false;
  }
  
  return true;
}

// ==================================================
// PDF PARSER
// ==================================================
async function extractPDFLines(file: File): Promise<string[]> {
  try {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

    const lines: string[] = [];

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const txt = await page.getTextContent();

      if (!txt.items) continue;

      for (const it of txt.items as any[]) {
        if (typeof it.str === "string" && it.str.trim().length > 0) {
          lines.push(it.str.trim());
        }
      }
    }

    return lines;
  } catch (err) {
    console.error("Erreur PDF:", err);
    throw new Error("Impossible de lire ce PDF.");
  }
}

// ==================================================
// DOCX PARSER
// ==================================================
async function extractDOCXLines(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });

  return result.value
    .split("\n")
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0);
}

// ==================================================
// PPTX PARSER
// ==================================================
async function extractPPTXLines(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const lines: string[] = [];
  const slides = Object.keys(zip.files).filter((f) =>
    f.match(/ppt\/slides\/slide\d+\.xml/)
  );

  for (const s of slides) {
    const xml = await zip.files[s].async("string");
    const matches = [...xml.matchAll(/<a:t>(.*?)<\/a:t>/g)];
    for (const m of matches) {
      const text = m[1].trim();
      if (text.length > 0) lines.push(text);
    }
  }

  return lines;
}

// ==================================================
// DETECTION STRUCTURE (Ultra-simple et efficace)
// ==================================================
function detectStructure(lines: string[]): LearningUnit[] {
  const chapters: LearningUnit[] = [];
  const stack: (LearningUnit | undefined)[] = [];

  // Patterns TRÈS stricts pour éviter les faux positifs
  const chapterRegex = /^(chapitre|chapter)\s+\d+/i;
  const sectionRegex = /^\d+\.\d+\s+/;  // Ex: "2.1 "
  const subsectionRegex = /^\d+\.\d+\.\d+\s+/;  // Ex: "2.1.1 "
  const simpleNumberRegex = /^\d+[\.\s]\s+[A-Z]/;  // Ex: "2. Introduction" ou "2 Introduction"

  function push(unit: LearningUnit, level: number) {
    if (level === 1) {
      stack[0] = unit;
      chapters.push(unit);
    } else if (level === 2 && stack[0]) {
      unit.parentId = stack[0].id;
      (stack[0].children ??= []).push(unit);
      stack[1] = unit;
    } else if (level === 3 && stack[1]) {
      unit.parentId = stack[1].id;
      (stack[1].children ??= []).push(unit);
    }
  }

  for (const line of lines) {
    const cleaned = line.trim();
    
    // Validation stricte
    if (!isValidTitle(cleaned)) continue;
    
    let level = 0;
    let type: LearningUnitType = "chapter";

    // Détection par ordre de priorité
    if (subsectionRegex.test(cleaned)) {
      level = 3;
      type = "subsection";
    }
    else if (sectionRegex.test(cleaned)) {
      level = 2;
      type = "section";
    }
    else if (chapterRegex.test(cleaned) || simpleNumberRegex.test(cleaned)) {
      level = 1;
      type = "chapter";
    }

    if (level > 0) {
      console.log(`[PARSER] Détecté niveau ${level}: ${cleaned.substring(0, 50)}`);
      push(createUnit(cleaned, type), level);
    }
  }

  console.log(`[PARSER] Total chapitres détectés: ${chapters.length}`);
  return chapters;
}

// ==================================================
// STRUCTURE DE SECOURS
// ==================================================
function fallbackStructure(lines: string[]): LearningUnit[] {
  const chapters: LearningUnit[] = [];
  
  // Créer au moins un chapitre avec toutes les lignes valides comme sous-sections
  const mainChapter = createUnit("Contenu du document", "chapter");
  
  let sectionCount = 0;
  for (const line of lines) {
    if (isValidTitle(line) && sectionCount < 20) {  // Max 20 sections
      (mainChapter.children ??= []).push(
        createUnit(line, "section", mainChapter.id)
      );
      sectionCount++;
    }
  }
  
  if ((mainChapter.children ?? []).length > 0) {
    chapters.push(mainChapter);
  }
  
  console.log(`[PARSER] Fallback: ${sectionCount} sections créées`);
  return chapters;
}

// ==================================================
// CREATION COURSEPROGRESS
// ==================================================
function toCourseProgress(
  file: File,
  roots: LearningUnit[]
): CourseProgress {
  const now = new Date().toISOString();

  let fileType: "pdf" | "pptx" | "docx" | "other" = "other";
  if (file.name.endsWith(".pdf")) fileType = "pdf";
  if (file.name.endsWith(".pptx")) fileType = "pptx";
  if (file.name.endsWith(".docx")) fileType = "docx";

  const stats: CourseProgressStats = {
    totalUnits: countUnits(roots),
    completedUnits: 0,
    progress: 0,
  };

  console.log(`[PARSER] Cours créé: ${stats.totalUnits} unités au total`);

  return {
    id: uuidv4(),
    title: file.name.replace(/\.(pdf|pptx|docx)$/i, ""),
    fileName: file.name,
    fileType,
    createdAt: now,
    updatedAt: now,
    roots,
    stats,
  };
}

// ==================================================
// PUBLIC PARSER
// ==================================================
export async function parseDocument(file: File): Promise<CourseProgress> {
  console.log(`[PARSER] Début de l'analyse: ${file.name}`);
  
  const lower = file.name.toLowerCase();
  let lines: string[] = [];

  if (lower.endsWith(".pdf")) {
    console.log("[PARSER] Extraction PDF...");
    lines = await extractPDFLines(file);
  }
  else if (lower.endsWith(".docx")) {
    console.log("[PARSER] Extraction DOCX...");
    lines = await extractDOCXLines(file);
  }
  else if (lower.endsWith(".pptx")) {
    console.log("[PARSER] Extraction PPTX...");
    lines = await extractPPTXLines(file);
  }
  else {
    throw new Error("Format non supporté.");
  }

  console.log(`[PARSER] ${lines.length} lignes extraites`);

  const detected = detectStructure(lines);
  
  let roots: LearningUnit[];
  if (detected.length > 0) {
    roots = detected;
    console.log("[PARSER] Structure détectée avec succès");
  } else {
    console.log("[PARSER] Aucune structure détectée, utilisation du fallback");
    roots = fallbackStructure(lines);
  }

  return toCourseProgress(file, roots);
}