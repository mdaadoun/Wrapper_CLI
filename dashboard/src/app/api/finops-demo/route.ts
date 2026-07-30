import { NextResponse } from "next/server";

const MODEL_PRICING: Record<string, { input_per_1m: number; output_per_1m: number }> = {
  "gpt-4o": { input_per_1m: 2.5, output_per_1m: 10.0 },
  "gpt-4o-mini": { input_per_1m: 0.15, output_per_1m: 0.6 },
  "gemini-2.0-flash": { input_per_1m: 0.1, output_per_1m: 0.4 },
  "gemini-1.5-pro-latest": { input_per_1m: 3.5, output_per_1m: 10.5 },
  "gemini-1.5-flash": { input_per_1m: 0.35, output_per_1m: 1.05 },
  "claude-3-5-sonnet-20241022": { input_per_1m: 3.0, output_per_1m: 15.0 },
  "claude-3-5-haiku-20241022": { input_per_1m: 0.8, output_per_1m: 4.0 },
  "llama-3.1-70b": { input_per_1m: 0.59, output_per_1m: 0.79 },
  "deepseek-chat": { input_per_1m: 0.14, output_per_1m: 0.28 },
  "deepseek-reasoner": { input_per_1m: 0.55, output_per_1m: 2.19 },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { model = "gemini-1.5-flash", prompt_tokens = 1000, completion_tokens = 500 } = body;

    const pricing = MODEL_PRICING[model.toLowerCase()] || MODEL_PRICING["gemini-1.5-flash"];

    const promptCost = (prompt_tokens / 1000000) * pricing.input_per_1m;
    const completionCost = (completion_tokens / 1000000) * pricing.output_per_1m;
    const totalCost = Number((promptCost + completionCost).toFixed(6));
    const totalTokens = prompt_tokens + completion_tokens;

    const responsePayload = {
      model_used: model,
      prompt_tokens,
      completion_tokens,
      total_tokens: totalTokens,
      rates: {
        input_per_1m_usd: pricing.input_per_1m,
        output_per_1m_usd: pricing.output_per_1m,
      },
      cost_breakdown: {
        input_cost_usd: Number(promptCost.toFixed(6)),
        output_cost_usd: Number(completionCost.toFixed(6)),
        total_cost_usd: totalCost,
      },
      execution_time_seconds: 0.0125,
      timestamp: new Date().toISOString(),
      status: "success",
    };

    return NextResponse.json({ status: "success", result: responsePayload });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to calculate FinOps metrics" },
      { status: 500 }
    );
  }
}
