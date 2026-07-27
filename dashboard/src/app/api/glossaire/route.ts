import { NextResponse } from "next/server";
import { parseGlossaryConcepts } from "@/lib/docs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "en";

  try {
    const concepts = parseGlossaryConcepts(lang);
    const cleanConcepts = concepts.map((c) => ({ id: c.id, concept: c.concept }));
    return NextResponse.json({ status: "success", concepts: cleanConcepts });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
