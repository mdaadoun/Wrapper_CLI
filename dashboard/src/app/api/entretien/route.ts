import { NextResponse } from "next/server";
import { parseFaqQuestions } from "@/lib/docs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "en";

  try {
    const questions = parseFaqQuestions(lang);
    const cleanQuestions = questions.map((q, idx) => ({
      id: idx,
      question: q.question,
    }));
    return NextResponse.json({ status: "success", questions: cleanQuestions });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
