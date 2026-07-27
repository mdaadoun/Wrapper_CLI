import { NextResponse } from "next/server";
import { parseGlossaryConcepts } from "@/lib/docs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const conceptId = parseInt(id, 10);
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "en";

  try {
    const concepts = parseGlossaryConcepts(lang);
    if (isNaN(conceptId) || conceptId < 0 || conceptId >= concepts.length) {
      return NextResponse.json(
        { status: "error", message: "Concept not found" },
        { status: 404 }
      );
    }

    const item = concepts[conceptId];
    return NextResponse.json({
      status: "success",
      concept: item.concept,
      html: item.definition_html,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
