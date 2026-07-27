import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DOCS_DIR, getDocFile, parseJournalFileInfo } from "@/lib/docs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "en";

  const entries: any[] = [];

  const journalFile = getDocFile("journal", lang);
  if (fs.existsSync(journalFile)) {
    entries.push(parseJournalFileInfo(journalFile, "intro"));
  }

  const journalDir = path.join(DOCS_DIR, "journal");
  if (fs.existsSync(journalDir) && fs.statSync(journalDir).isDirectory()) {
    const files = fs.readdirSync(journalDir);
    const uniqueStems = new Set<string>();

    for (const f of files) {
      if (f === "journal_template.md" || !f.endsWith(".md")) continue;
      let stem = path.basename(f, ".md");
      if (stem.endsWith("_en") || stem.endsWith("_fr")) {
        stem = stem.slice(0, -3);
      }
      uniqueStems.add(stem);
    }

    const sortedStems = Array.from(uniqueStems).sort();

    for (const baseStem of sortedStems) {
      const suffix = lang === "en" ? "_en" : "_fr";
      let targetPath = path.join(journalDir, `${baseStem}${suffix}.md`);

      if (!fs.existsSync(targetPath)) {
        const fallbackSuffix = lang === "en" ? "_fr" : "_en";
        targetPath = path.join(journalDir, `${baseStem}${fallbackSuffix}.md`);
      }

      if (!fs.existsSync(targetPath)) {
        targetPath = path.join(journalDir, `${baseStem}.md`);
      }

      if (fs.existsSync(targetPath)) {
        entries.push(parseJournalFileInfo(targetPath, baseStem));
      }
    }
  }

  return NextResponse.json({ status: "success", entries });
}
