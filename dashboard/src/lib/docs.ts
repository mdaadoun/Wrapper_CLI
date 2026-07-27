import fs from "fs";
import path from "path";
import { markdownToHtml } from "./markdown";

export const PROJECT_DIR = path.resolve(process.cwd(), "..");
export const DOCS_DIR = path.join(PROJECT_DIR, "docs");

const ALIASES: Record<string, string> = {
  roadmap_details: "roadmap",
  faq_entretien: "questions",
  glossaire: "glossary",
  journal_apprentissage: "journal",
  cahier_charges: "specifications",
};

export function getDocFile(baseName: string, lang: string = "en"): string {
  const resolvedName = ALIASES[baseName] || baseName;
  const suffix = lang === "en" ? "_en" : "_fr";
  const targetPath = path.join(DOCS_DIR, `${resolvedName}${suffix}.md`);
  if (fs.existsSync(targetPath)) {
    return targetPath;
  }

  const fallbackSuffix = lang === "en" ? "_fr" : "_en";
  const fallbackPath = path.join(DOCS_DIR, `${resolvedName}${fallbackSuffix}.md`);
  if (fs.existsSync(fallbackPath)) {
    return fallbackPath;
  }

  return path.join(DOCS_DIR, `${resolvedName}.md`);
}

export function getMarkdownDoc(baseName: string, lang: string = "en"): string {
  const file = getDocFile(baseName, lang);
  if (!fs.existsSync(file)) {
    return `# Document ${baseName} introuvable\nLe fichier de documentation est manquant.`;
  }
  return fs.readFileSync(file, "utf-8");
}

export interface QuestionItem {
  question: string;
  answer_markdown: string;
  answer_html: string;
}

export function parseFaqQuestions(lang: string = "en"): QuestionItem[] {
  const faqFile = getDocFile("questions", lang);
  if (!fs.existsSync(faqFile)) return [];

  const content = fs.readFileSync(faqFile, "utf-8");
  const questions: QuestionItem[] = [];

  const parts = content.split(/^### /m);
  for (let i = 1; i < parts.length; i++) {
    const rawBlock = parts[i].trim();
    if (!rawBlock) continue;

    const lines = rawBlock.split("\n");
    const heading = lines[0].trim();
    const bodyLines = lines.slice(1);

    if (/^Q\d+/i.test(heading)) {
      const questionTitle = heading.replace(/^Q\d+\s*[:.]?\s*/i, "").trim();
      const body = bodyLines.join("\n").trim();
      questions.push({
        question: questionTitle,
        answer_markdown: body,
        answer_html: markdownToHtml(body),
      });
    } else {
      let currentQuestion = heading;
      let currentBodyLines: string[] = [];

      for (const bLine of bodyLines) {
        const trimmed = bLine.trim();
        if (trimmed.startsWith("**Q") && (trimmed.includes(":") || trimmed.includes("**"))) {
          if (currentBodyLines.length > 0 && currentQuestion) {
            const body = currentBodyLines.join("\n").trim();
            questions.push({
              question: currentQuestion,
              answer_markdown: body,
              answer_html: markdownToHtml(body),
            });
            currentBodyLines = [];
          }
          currentQuestion = trimmed
            .replace(/^\*\*Q\s*:?\s*\*\*:?/i, "")
            .replace(/^\*\*Q\d*[:.]?\s*\*\*/i, "")
            .trim();
        } else {
          currentBodyLines.push(bLine);
        }
      }

      if (currentQuestion && currentBodyLines.length > 0) {
        const body = currentBodyLines.join("\n").trim();
        questions.push({
          question: currentQuestion,
          answer_markdown: body,
          answer_html: markdownToHtml(body),
        });
      }
    }
  }

  return questions;
}

export interface GlossaryConcept {
  id: number;
  concept: string;
  definition_markdown: string;
  definition_html: string;
}

export function parseGlossaryConcepts(lang: string = "en"): GlossaryConcept[] {
  const glossaireFile = getDocFile("glossary", lang);
  if (!fs.existsSync(glossaireFile)) return [];

  const content = fs.readFileSync(glossaireFile, "utf-8");
  const concepts: GlossaryConcept[] = [];

  const parts = content.split(/### /);
  for (let i = 1; i < parts.length; i++) {
    const lines = parts[i].trim().split("\n");
    if (lines.length === 0) continue;
    const conceptName = lines[0].trim();
    const definition = lines.slice(1).join("\n").trim();
    concepts.push({
      id: concepts.length,
      concept: conceptName,
      definition_markdown: definition,
      definition_html: markdownToHtml(definition),
    });
  }
  return concepts;
}

export interface JournalEntryInfo {
  id: string;
  title: string;
  date: string;
}

export function parseJournalFileInfo(filePath: string, fileId: string): JournalEntryInfo {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    let title: string | null = null;
    let date = "Unknown date";

    for (const line of content.split("\n")) {
      const lineStr = line.trim();
      if (lineStr.startsWith("# ") && title === null) {
        let rawTitle = lineStr.slice(2).trim();
        if (rawTitle.startsWith("📌")) {
          rawTitle = rawTitle.slice(1).trim();
        }
        title = rawTitle;
      } else if (lineStr.includes("Date") && (lineStr.includes(":") || lineStr.includes("**"))) {
        const dateMatch = lineStr.match(/\*\*Date\s*:?\s*\*\*:?\s*(.*)/i);
        if (dateMatch && dateMatch[1].trim()) {
          date = dateMatch[1].trim();
        } else {
          date = lineStr
            .replace("Date :", "")
            .replace("Date:", "")
            .replace(/\*\*/g, "")
            .trim();
        }
      }
    }

    if (!title) {
      title = path.basename(filePath, ".md").replace(/_/g, " ");
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }

    return { id: fileId, title, date };
  } catch {
    return {
      id: fileId,
      title: path.basename(filePath, ".md").replace(/_/g, " "),
      date: "Unknown date",
    };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanRoadmapText(txt: string): string {
  let clean = escapeHtml(txt.trim());
  clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #ffffff;">$1</strong>');
  clean = clean.replace(
    /`(.*?)`/g,
    '<code style="background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px; color: #d8b4fe; font-family: monospace;">$1</code>'
  );
  clean = clean.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" style="color: var(--secondary); text-decoration: none; border-bottom: 1px dashed var(--secondary);" target="_blank">$1</a>'
  );
  return clean;
}

export function parseRoadmapToHtml(lang: string = "en"): string {
  const roadmapFile = getDocFile("roadmap", lang);
  if (!fs.existsSync(roadmapFile)) {
    return "<div style='color: var(--danger); padding: 20px;'>Roadmap file not found.</div>";
  }

  try {
    const content = fs.readFileSync(roadmapFile, "utf-8");
    const lines = content.split("\n");

    const htmlOut: string[] = [];
    htmlOut.push('<div class="roadmap-container">');
    htmlOut.push('  <div class="roadmap-header-section">');
    htmlOut.push('    <h2 class="roadmap-main-title">🗺️ Roadmap & Tracking</h2>');
    htmlOut.push(
      '    <p class="roadmap-main-subtitle">Chronological tracking of project progress</p>'
    );
    htmlOut.push("  </div>");

    let inStepsGrid = false;
    let inPhase = false;
    let inPreBlock = false;
    let preLines: string[] = [];
    let currentStepLines: string[] = [];

    const flushStep = () => {
      if (currentStepLines.length === 0) return "";

      const stepHeaderLine = currentStepLines[0];
      const parts = stepHeaderLine.split("—");
      const titlePart = parts[0].replace("###", "").trim();
      const statusPart = parts.length > 1 ? parts[1].trim() : "🔲 Pending";

      const titleSubparts = titlePart.split(":");
      const stepNum = titleSubparts[0].trim();
      const stepTitle =
        titleSubparts.length > 1
          ? titleSubparts.slice(1).join(":").trim()
          : titlePart;

      let statusClass = "pending";
      let badgeText = "Pending";
      let badgeClass = "badge-pending";

      if (
        statusPart.includes("✅") ||
        statusPart.includes("Validé") ||
        statusPart.includes("Completed") ||
        statusPart.includes("Complété")
      ) {
        statusClass = "completed";
        badgeText = lang === "en" ? "Completed" : "Validé";
        badgeClass = "badge-completed";
      } else if (
        statusPart.includes("En cours") ||
        statusPart.includes("In Progress") ||
        statusPart.includes("⏳")
      ) {
        statusClass = "active";
        badgeText = lang === "en" ? "In Progress" : "En cours";
        badgeClass = "badge-active";
      }

      const stepHtml: string[] = [];
      stepHtml.push(`<div class="step-card ${statusClass}">`);
      stepHtml.push('  <div class="step-header">');
      stepHtml.push(`    <span class="step-number">${stepNum}</span>`);
      stepHtml.push(
        `    <span class="step-badge ${badgeClass}">${badgeText}</span>`
      );
      stepHtml.push("  </div>");
      stepHtml.push(`  <h4 class="step-title">${stepTitle}</h4>`);
      stepHtml.push('  <div class="step-details">');

      for (let i = 1; i < currentStepLines.length; i++) {
        let rawLine = currentStepLines[i].trim();
        if (!rawLine) continue;

        // Strip leading list bullet symbols (*, -, 1.) and surrounding whitespace
        let lineStr = rawLine.replace(/^[*\-\d.\s]+/, "").trim();

        if (
          lineStr.startsWith("**Description :**") ||
          lineStr.startsWith("**Description:**") ||
          lineStr.startsWith("Description :") ||
          lineStr.startsWith("Description:")
        ) {
          const descText = lineStr
            .replace(/\*\*Description\s*:?\s*\*\*:?/i, "")
            .replace(/Description\s*:?/i, "")
            .trim();
          const label = lang === "en" ? "Description:" : "Description :";
          stepHtml.push(
            `    <div class="detail-item"><strong>${label}</strong> ${cleanRoadmapText(descText)}</div>`
          );
        } else if (
          lineStr.startsWith("**Concept clé :**") ||
          lineStr.startsWith("**Concept clé:**") ||
          lineStr.startsWith("**Concept clef :**") ||
          lineStr.startsWith("**Concept clef:**") ||
          lineStr.startsWith("**Key Concept:**") ||
          lineStr.startsWith("**Key Concept :**") ||
          lineStr.startsWith("Concept clé :") ||
          lineStr.startsWith("Key Concept:")
        ) {
          const conceptText = lineStr
            .replace(/\*\*(Concept cl[ée]f?|Key Concept)\s*:?\s*\*\*:?/i, "")
            .replace(/(Concept cl[ée]f?|Key Concept)\s*:?/i, "")
            .trim();
          const label = lang === "en" ? "Key Concept:" : "Concept clé :";
          stepHtml.push(
            `    <div class="detail-item"><strong>${label}</strong> ${cleanRoadmapText(conceptText)}</div>`
          );
        } else if (
          lineStr.startsWith("**Critère de validation :**") ||
          lineStr.startsWith("**Critère de validation:**") ||
          lineStr.startsWith("**Validation Criterion:**") ||
          lineStr.startsWith("**Validation Criterion :**") ||
          lineStr.startsWith("Critère de validation :") ||
          lineStr.startsWith("Validation Criterion:")
        ) {
          const validationText = lineStr
            .replace(/\*\*(Critère de validation|Validation Criterion)\s*:?\s*\*\*:?/i, "")
            .replace(/(Critère de validation|Validation Criterion)\s*:?/i, "")
            .trim();
          const label =
            lang === "en" ? "Validation Criterion:" : "Critère de validation :";
          stepHtml.push(
            `    <div class="detail-item validation-item"><strong>${label}</strong> ${cleanRoadmapText(validationText)}</div>`
          );
        } else {
          stepHtml.push(
            `    <div class="detail-item">${cleanRoadmapText(lineStr)}</div>`
          );
        }
      }

      stepHtml.push("  </div>");
      stepHtml.push("</div>");
      return stepHtml.join("\n");
    };

    for (const line of lines) {
      const lineRaw = line;
      const lineStr = line.trim();

      if (lineStr.startsWith("```")) {
        if (inPreBlock) {
          inPreBlock = false;
          const codeText = escapeHtml(preLines.join("\n"));
          htmlOut.push(
            `<pre style='background: rgba(10, 15, 30, 0.75); border: 1px solid rgba(255,255,255,0.1); padding: 12px 14px; border-radius: 6px; overflow-x: auto; color: #d8b4fe; font-family: monospace; font-size: 0.8rem; margin: 14px 0; line-height: 1.45;'><code>${codeText}</code></pre>`
          );
          preLines = [];
        } else {
          inPreBlock = true;
          preLines = [];
        }
        continue;
      }

      if (inPreBlock) {
        preLines.push(lineRaw);
        continue;
      }

      if (lineStr.startsWith("## Phase")) {
        if (currentStepLines.length > 0) {
          htmlOut.push(flushStep());
          currentStepLines = [];
        }
        if (inStepsGrid) {
          htmlOut.push("    </div>");
          inStepsGrid = false;
        }
        if (inPhase) {
          htmlOut.push("  </div>");
        }

        inPhase = true;

        const parts = lineStr.split("—");
        const phasePart = parts[0].replace("##", "").trim();
        const statusPart = parts.length > 1 ? parts[1].trim() : "🔲 Pending";

        const phaseSubparts = phasePart.split(":");
        const phaseIdx = phaseSubparts[0].trim();
        const phaseTitle =
          phaseSubparts.length > 1
            ? phaseSubparts.slice(1).join(":").trim()
            : phasePart;

        let statusClass = "pending";
        let statusText = lang === "en" ? "Pending" : "À venir";
        if (
          statusPart.includes("✅") ||
          statusPart.includes("Validé") ||
          statusPart.includes("Completed") ||
          statusPart.includes("Complété")
        ) {
          statusClass = "completed";
          statusText = lang === "en" ? "Completed" : "Validé";
        } else if (
          statusPart.includes("En cours") ||
          statusPart.includes("In Progress") ||
          statusPart.includes("⏳")
        ) {
          statusClass = "active";
          statusText = lang === "en" ? "In Progress" : "En cours";
        }

        htmlOut.push(`  <div class="phase-section ${statusClass}">`);
        htmlOut.push(`    <div class="phase-banner ${statusClass}">`);
        htmlOut.push('      <div class="phase-banner-info">');
        htmlOut.push(`        <span class="phase-index">${phaseIdx}</span>`);
        htmlOut.push(`        <h3 class="phase-title">${phaseTitle}</h3>`);
        htmlOut.push("      </div>");
        htmlOut.push(
          `      <span class="phase-status-badge ${statusClass}">${statusText}</span>`
        );
        htmlOut.push("    </div>");
      } else if (
        lineStr.toLowerCase().includes("objectif") ||
        lineStr.toLowerCase().includes("objective")
      ) {
        const objText = lineStr.replace(/[*_#]/g, "").trim();
        htmlOut.push(`    <p class="phase-objective"><em>${objText}</em></p>`);
        if (!inStepsGrid) {
          htmlOut.push('    <div class="steps-grid">');
          inStepsGrid = true;
        }
      } else if (lineStr.startsWith("### Étape") || lineStr.startsWith("### Step")) {
        if (currentStepLines.length > 0) {
          htmlOut.push(flushStep());
          currentStepLines = [];
        }
        if (!inStepsGrid) {
          htmlOut.push('    <div class="steps-grid">');
          inStepsGrid = true;
        }
        currentStepLines.push(lineStr);
      } else if (currentStepLines.length > 0) {
        currentStepLines.push(line);
      } else {
        if (!lineStr) continue;
        if (lineStr.startsWith("# ")) {
          htmlOut.push(
            `<h1 style="color: #ffffff; font-size: 1.6rem; border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom: 16px; font-family: var(--font-outfit);">${cleanRoadmapText(lineStr.substring(2))}</h1>`
          );
        } else if (lineStr.startsWith("## ")) {
          htmlOut.push(
            `<h2 style="color: var(--secondary); font-size: 1.3rem; margin-top: 24px; border-bottom: 1px solid rgba(139, 92, 246, 0.15); padding-bottom: 6px; font-family: var(--font-outfit);">${cleanRoadmapText(lineStr.substring(3))}</h2>`
          );
        } else {
          htmlOut.push(
            `<p style="margin: 10px 0; color: #e2e8f0; font-size: 0.95rem;">${cleanRoadmapText(lineStr)}</p>`
          );
        }
      }
    }

    if (currentStepLines.length > 0) {
      htmlOut.push(flushStep());
    }
    if (inStepsGrid) {
      htmlOut.push("    </div>");
    }
    if (inPhase) {
      htmlOut.push("  </div>");
    }

    htmlOut.push("</div>");
    return htmlOut.join("\n");
  } catch (e: any) {
    return `<div style='color: var(--danger); padding: 20px;'>Read error: ${e.message}</div>`;
  }
}
