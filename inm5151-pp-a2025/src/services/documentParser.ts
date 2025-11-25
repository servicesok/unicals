// ============================================
// UNICAL - Document Parser AMÉLIORÉ v2.0
// Compatible PDF + DOCX + PPTX
// Extraction intelligente de hiérarchie
// ============================================

import { v4 as uuidv4 } from "uuid";
import * as pdfjsLib from "pdfjs-dist";

// Configuration Worker PDF.js
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
// TYPES INTERNES
// ==================================================

interface ParsedLine {
  text: string;
  level: number;        // 1=chapitre, 2=section, 3=subsection
  fontSize?: number;    // Taille de police (PDF)
  isBold?: boolean;     // Est en gras
  type: LearningUnitType;
}

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
    title: title.trim(),
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
// VALIDATION DE TITRE AMÉLIORÉE
// ==================================================

function isValidTitle(text: string): boolean {
  const cleaned = text.trim();

  // Longueur raisonnable
  if (cleaned.length < 3 || cleaned.length > 200) return false;

  // Pas que des chiffres ou symboles
  if (/^[\d\s\.\-_:;,]+$/.test(cleaned)) return false;

  // Patterns à rejeter
  const rejectPatterns = [
    /©/,
    /^\d{4}$/,                    // Juste une année
    /^page\s+\d+/i,
    /^figure\s+\d+/i,
    /^tableau\s+\d+/i,
    /prof(esseur)?/i,
    /université/i,
    /département/i,
    /tous droits réservés/i,
    /^\s*$/,
  ];

  for (const pattern of rejectPatterns) {
    if (pattern.test(cleaned)) return false;
  }

  return true;
}

// ==================================================
// DÉTECTION DE NUMÉROTATION HIÉRARCHIQUE
// ==================================================

function detectNumberingLevel(text: string): { level: number; cleanTitle: string } | null {
  const patterns = [
    // Format: "1.1.1 Titre" ou "1.1.1. Titre"
    { regex: /^(\d+)\.(\d+)\.(\d+)\.?\s+(.+)$/, level: 3 },
    // Format: "1.1 Titre" ou "1.1. Titre"
    { regex: /^(\d+)\.(\d+)\.?\s+(.+)$/, level: 2 },
    // Format: "1. Titre" ou "1 Titre"
    { regex: /^(\d+)[\.\s]\s*(.+)$/, level: 1 },
    // Format: "Chapitre 1", "Chapter 1"
    { regex: /^(chapitre|chapter)\s+(\d+)[:\s]*(.*)$/i, level: 1 },
  ];

  for (const { regex, level } of patterns) {
    const match = text.match(regex);
    if (match) {
      const cleanTitle = match[match.length - 1].trim();
      if (cleanTitle.length > 0) {
        return { level, cleanTitle: text }; // Garder le numéro dans le titre
      }
    }
  }

  return null;
}

// ==================================================
// PDF PARSER AMÉLIORÉ (avec détection de taille de police)
// ==================================================

async function extractPDFLinesAdvanced(file: File): Promise<ParsedLine[]> {
  try {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

    const lines: ParsedLine[] = [];
    const fontSizes: number[] = [];

    // Première passe : collecter toutes les tailles de police
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const txt = await page.getTextContent();

      for (const item of txt.items as any[]) {
        if (item.transform && item.transform[0]) {
          fontSizes.push(Math.abs(item.transform[0]));
        }
      }
    }

    // Calculer les seuils de taille (percentiles)
    fontSizes.sort((a, b) => b - a);
    const avgSize = fontSizes.reduce((a, b) => a + b, 0) / fontSizes.length;
    const largeThreshold = avgSize * 1.3;  // 30% plus grand = titre important
    const mediumThreshold = avgSize * 1.1; // 10% plus grand = sous-titre

    console.log(`[PDF] Taille moyenne: ${avgSize.toFixed(1)}, Seuil large: ${largeThreshold.toFixed(1)}, Seuil moyen: ${mediumThreshold.toFixed(1)}`);

    // Deuxième passe : extraire avec détection de niveau
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const txt = await page.getTextContent();

      for (const item of txt.items as any[]) {
        const text = item.str?.trim();
        if (!text || text.length === 0) continue;

        const fontSize = item.transform ? Math.abs(item.transform[0]) : avgSize;
        const isBold = item.fontName?.toLowerCase().includes('bold') || false;

        // Déterminer le niveau par taille de police
        let level = 0;
        let type: LearningUnitType = 'other';

        if (fontSize >= largeThreshold || (fontSize >= mediumThreshold && isBold)) {
          level = 1;
          type = 'chapter';
        } else if (fontSize >= mediumThreshold) {
          level = 2;
          type = 'section';
        } else if (fontSize > avgSize || isBold) {
          level = 3;
          type = 'subsection';
        }

        // Vérifier aussi la numérotation
        const numbering = detectNumberingLevel(text);
        if (numbering) {
          level = numbering.level;
          type = level === 1 ? 'chapter' : level === 2 ? 'section' : 'subsection';
        }

        if (level > 0 && isValidTitle(text)) {
          lines.push({ text, level, fontSize, isBold, type });
        }
      }
    }

    console.log(`[PDF] ${lines.length} titres détectés`);
    return lines;
  } catch (err) {
    console.error("Erreur PDF:", err);
    throw new Error("Impossible de lire ce PDF.");
  }
}

// ==================================================
// DOCX PARSER AMÉLIORÉ (avec détection de styles)
// ==================================================

async function extractDOCXLinesAdvanced(file: File): Promise<ParsedLine[]> {
  try {
    const buffer = await file.arrayBuffer();

    // Convertir en HTML pour garder les styles
    const result = await mammoth.convertToHtml(
      { arrayBuffer: buffer },
      {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Titre 1'] => h1:fresh",
          "p[style-name='Titre 2'] => h2:fresh",
          "p[style-name='Titre 3'] => h3:fresh",
        ]
      }
    );

    const lines: ParsedLine[] = [];

    // Parser le HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(result.value, 'text/html');

    // Extraire les titres
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

    headings.forEach((heading) => {
      const text = heading.textContent?.trim() || '';
      if (!isValidTitle(text)) return;

      const tagName = heading.tagName.toLowerCase();
      let level = 1;
      let type: LearningUnitType = 'chapter';

      switch (tagName) {
        case 'h1':
          level = 1;
          type = 'chapter';
          break;
        case 'h2':
          level = 2;
          type = 'section';
          break;
        case 'h3':
        case 'h4':
          level = 3;
          type = 'subsection';
          break;
      }

      // Vérifier aussi la numérotation
      const numbering = detectNumberingLevel(text);
      if (numbering) {
        level = numbering.level;
        type = level === 1 ? 'chapter' : level === 2 ? 'section' : 'subsection';
      }

      lines.push({ text, level, type });
    });

    // Si aucun heading détecté, essayer par paragraphes en gras
    if (lines.length === 0) {
      const strongTags = doc.querySelectorAll('strong, b');
      strongTags.forEach((strong) => {
        const text = strong.textContent?.trim() || '';
        if (!isValidTitle(text)) return;

        const numbering = detectNumberingLevel(text);
        if (numbering) {
          lines.push({
            text,
            level: numbering.level,
            type: numbering.level === 1 ? 'chapter' : numbering.level === 2 ? 'section' : 'subsection',
            isBold: true
          });
        }
      });
    }

    console.log(`[DOCX] ${lines.length} titres détectés`);
    return lines;
  } catch (err) {
    console.error("Erreur DOCX:", err);
    throw new Error("Impossible de lire ce fichier Word.");
  }
}

// ==================================================
// PPTX PARSER AMÉLIORÉ (détection des titres de slides)
// ==================================================

async function extractPPTXLinesAdvanced(file: File): Promise<ParsedLine[]> {
  try {
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    const lines: ParsedLine[] = [];
    const slides = Object.keys(zip.files)
      .filter((f) => f.match(/ppt\/slides\/slide\d+\.xml/))
      .sort();

    for (const slidePath of slides) {
      const xml = await zip.files[slidePath].async("string");

      // Chercher les titres de slides (généralement dans <p:sp> avec type="title")
      const titleMatches = [
        ...xml.matchAll(/<p:sp[^>]*>[\s\S]*?<p:nvSpPr>[\s\S]*?<p:ph[^>]*type="title"[\s\S]*?<\/p:nvSpPr>[\s\S]*?<a:t>(.*?)<\/a:t>/g),
        ...xml.matchAll(/<p:sp[^>]*>[\s\S]*?<p:nvSpPr>[\s\S]*?<p:ph[^>]*type="ctrTitle"[\s\S]*?<\/p:nvSpPr>[\s\S]*?<a:t>(.*?)<\/a:t>/g),
      ];

      for (const match of titleMatches) {
        const text = match[1].trim();
        if (isValidTitle(text)) {
          // Détecter le niveau par numérotation
          const numbering = detectNumberingLevel(text);
          const level = numbering ? numbering.level : 2; // Par défaut, slide = section
          const type: LearningUnitType = level === 1 ? 'chapter' : level === 2 ? 'section' : 'subsection';

          lines.push({ text, level, type });
        }
      }

      // Si pas de titre trouvé, chercher le premier texte important
      if (titleMatches.length === 0) {
        const textMatches = [...xml.matchAll(/<a:t>(.*?)<\/a:t>/g)];
        if (textMatches.length > 0) {
          const text = textMatches[0][1].trim();
          if (isValidTitle(text)) {
            lines.push({ text, level: 2, type: 'section' });
          }
        }
      }
    }

    console.log(`[PPTX] ${lines.length} slides/titres détectés`);
    return lines;
  } catch (err) {
    console.error("Erreur PPTX:", err);
    throw new Error("Impossible de lire ce PowerPoint.");
  }
}

// ==================================================
// CONSTRUCTION DE LA HIÉRARCHIE
// ==================================================

function buildHierarchy(parsedLines: ParsedLine[]): LearningUnit[] {
  const roots: LearningUnit[] = [];
  const stack: (LearningUnit | null)[] = [null, null, null, null]; // index 0, 1, 2, 3 pour niveaux

  for (const line of parsedLines) {
    const unit = createUnit(line.text, line.type);
    const level = line.level;

    if (level === 1) {
      // Chapitre - ajouter à la racine
      stack[1] = unit;
      stack[2] = null;
      stack[3] = null;
      roots.push(unit);
    } else if (level === 2) {
      // Section - ajouter au chapitre parent ou à la racine
      if (stack[1]) {
        unit.parentId = stack[1].id;
        stack[1].children = stack[1].children || [];
        stack[1].children.push(unit);
      } else {
        roots.push(unit);
      }
      stack[2] = unit;
      stack[3] = null;
    } else if (level === 3) {
      // Sous-section - ajouter à la section parente
      if (stack[2]) {
        unit.parentId = stack[2].id;
        stack[2].children = stack[2].children || [];
        stack[2].children.push(unit);
      } else if (stack[1]) {
        unit.parentId = stack[1].id;
        stack[1].children = stack[1].children || [];
        stack[1].children.push(unit);
      } else {
        roots.push(unit);
      }
      stack[3] = unit;
    }
  }

  return roots;
}

// ==================================================
// STRUCTURE DE SECOURS AMÉLIORÉE
// ==================================================

function fallbackStructure(lines: ParsedLine[]): LearningUnit[] {
  console.log("[PARSER] Utilisation de la structure de secours");

  if (lines.length === 0) {
    return [createUnit("Document sans structure détectée", "chapter")];
  }

  // Grouper par sections (tous les 5-10 items)
  const roots: LearningUnit[] = [];
  const chunkSize = Math.max(5, Math.min(10, Math.ceil(lines.length / 10)));

  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize);
    const chapterTitle = chunk[0].text;
    const chapter = createUnit(chapterTitle, 'chapter');

    // Ajouter les autres comme sous-sections
    for (let j = 1; j < chunk.length; j++) {
      const section = createUnit(chunk[j].text, 'section', chapter.id);
      chapter.children = chapter.children || [];
      chapter.children.push(section);
    }

    roots.push(chapter);
  }

  return roots;
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

  console.log(`[PARSER] Cours créé: ${stats.totalUnits} unités, ${roots.length} chapitres`);

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
  console.log(`[PARSER] ============================================`);
  console.log(`[PARSER] Début de l'analyse: ${file.name}`);
  console.log(`[PARSER] Taille: ${(file.size / 1024).toFixed(2)} Ko`);

  const lower = file.name.toLowerCase();
  let parsedLines: ParsedLine[] = [];

  try {
    if (lower.endsWith(".pdf")) {
      console.log("[PARSER] Type: PDF");
      parsedLines = await extractPDFLinesAdvanced(file);
    }
    else if (lower.endsWith(".docx")) {
      console.log("[PARSER] Type: DOCX");
      parsedLines = await extractDOCXLinesAdvanced(file);
    }
    else if (lower.endsWith(".pptx")) {
      console.log("[PARSER] Type: PPTX");
      parsedLines = await extractPPTXLinesAdvanced(file);
    }
    else {
      throw new Error("Format non supporté. Utilisez PDF, DOCX ou PPTX.");
    }

    console.log(`[PARSER] ${parsedLines.length} lignes parsées`);

    // Construire la hiérarchie
    let roots: LearningUnit[];

    if (parsedLines.length > 0) {
      roots = buildHierarchy(parsedLines);
      console.log(`[PARSER] Hiérarchie construite: ${roots.length} chapitres racines`);
    } else {
      console.log("[PARSER] Aucune ligne détectée, utilisation du fallback");
      roots = [createUnit("Contenu du document", "chapter")];
    }

    // Si la structure est trop faible, utiliser le fallback
    if (roots.length === 0) {
      roots = fallbackStructure(parsedLines);
    }

    console.log(`[PARSER] ✅ Parsing terminé avec succès`);
    console.log(`[PARSER] ============================================`);

    return toCourseProgress(file, roots);
  } catch (err) {
    console.error("[PARSER] ❌ Erreur:", err);
    throw err;
  }
}
