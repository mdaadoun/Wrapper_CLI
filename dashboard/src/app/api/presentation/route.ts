import { NextResponse } from "next/server";
import fs from "fs";
import { getDocFile } from "@/lib/docs";
import { markdownToHtml } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "en";

  const presentationFile = getDocFile("presentation", lang);
  if (!fs.existsSync(presentationFile)) {
    return NextResponse.json(
      { status: "error", message: `Presentation file not found` },
      { status: 404 }
    );
  }

  try {
    const content = fs.readFileSync(presentationFile, "utf-8");
    const htmlContent = markdownToHtml(content);
    return NextResponse.json({ status: "success", html: htmlContent });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
