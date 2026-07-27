import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DOCS_DIR, getDocFile } from "@/lib/docs";
import { markdownToHtml } from "@/lib/markdown";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "en";

  let filePath: string;

  if (id === "intro") {
    filePath = getDocFile("journal", lang);
  } else {
    let cleanId = id.replace(/[^a-zA-Z0-9_.-]/g, "");
    if (cleanId.endsWith("_en") || cleanId.endsWith("_fr")) {
      cleanId = cleanId.slice(0, -3);
    }

    const suffix = lang === "en" ? "_en" : "_fr";
    filePath = path.join(DOCS_DIR, "journal", `${cleanId}${suffix}.md`);

    if (!fs.existsSync(filePath)) {
      const fallbackSuffix = lang === "en" ? "_fr" : "_en";
      filePath = path.join(DOCS_DIR, "journal", `${cleanId}${fallbackSuffix}.md`);
    }

    if (!fs.existsSync(filePath)) {
      filePath = path.join(DOCS_DIR, "journal", `${cleanId}.md`);
    }
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { status: "error", message: `Article '${id}' not found` },
      { status: 404 }
    );
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const htmlContent = markdownToHtml(content);
    return NextResponse.json({ status: "success", html: htmlContent });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
