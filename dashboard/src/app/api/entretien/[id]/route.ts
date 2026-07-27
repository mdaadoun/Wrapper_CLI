import { NextResponse } from "next/server";
import { parseFaqQuestions } from "@/lib/docs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const questionId = parseInt(id, 10);
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "en";

  try {
    const questions = parseFaqQuestions(lang);
    if (isNaN(questionId) || questionId < 0 || questionId >= questions.length) {
      return NextResponse.json(
        { status: "error", message: "Question not found" },
        { status: 404 }
      );
    }

    const item = questions[questionId];
    return NextResponse.json({
      status: "success",
      question: item.question,
      answer_html: item.answer_html,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
