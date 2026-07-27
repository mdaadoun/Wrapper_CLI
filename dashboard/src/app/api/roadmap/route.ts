import { NextResponse } from "next/server";
import { parseRoadmapToHtml } from "@/lib/docs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "en";

  try {
    const htmlContent = parseRoadmapToHtml(lang);
    return NextResponse.json({ status: "success", html: htmlContent });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
