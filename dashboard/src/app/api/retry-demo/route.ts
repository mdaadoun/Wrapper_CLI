import { NextResponse } from "next/server";

// Pricing matrix for FinOps calculations (USD / 1M tokens)
const MODEL_PRICING: Record<string, { input_per_1m: number; output_per_1m: number }> = {
  "gemini-1.5-flash": { input_per_1m: 0.35, output_per_1m: 1.05 },
  "gemini-2.0-flash": { input_per_1m: 0.1, output_per_1m: 0.4 },
  "gpt-4o": { input_per_1m: 2.5, output_per_1m: 10.0 },
  "gpt-4o-mini": { input_per_1m: 0.15, output_per_1m: 0.6 },
  "claude-3-5-sonnet-20241022": { input_per_1m: 3.0, output_per_1m: 15.0 },
  "deepseek-chat": { input_per_1m: 0.14, output_per_1m: 0.28 },
};

export interface RetryAttemptLog {
  attempt: number;
  timestamp: string;
  status: "success" | "retryable_error" | "fatal_error";
  status_code?: number;
  error_type?: string;
  error_message?: string;
  sleep_seconds: number;
  backoff_strategy: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      content = "Network Resilience evaluation with Tenacity exponential backoff and jitter.",
      model = "gemini-1.5-flash",
      max_retries = 4,
      initial_delay = 2.0,
      scenario = "rate_limit_recovered", // success | rate_limit_recovered | network_flake_recovered | outage_failed
      jitter = true,
    } = body;

    const textContent = String(content || "").trim() || "Network resilience sample test.";
    const snippet = textContent.length > 70 ? textContent.substring(0, 70) + "..." : textContent;
    const nowIso = new Date().toISOString();

    const attemptsLog: RetryAttemptLog[] = [];
    let isSuccess = false;
    let totalSleepTime = 0;
    let finalAttempt = 1;

    // Simulate scenario execution paths with Tenacity retry policy
    if (scenario === "success") {
      attemptsLog.push({
        attempt: 1,
        timestamp: new Date().toISOString(),
        status: "success",
        status_code: 200,
        sleep_seconds: 0,
        backoff_strategy: "None (Direct HTTP 200 OK)",
      });
      isSuccess = true;
      finalAttempt = 1;
    } else if (scenario === "rate_limit_recovered") {
      // Attempt 1: HTTP 429 Rate Limit
      const sleep1 = Number((initial_delay * (jitter ? 1.1 : 1.0)).toFixed(1));
      attemptsLog.push({
        attempt: 1,
        timestamp: new Date().toISOString(),
        status: "retryable_error",
        status_code: 429,
        error_type: "LLMRetryableError",
        error_message: "HTTP 429: Rate Limit Exceeded. Retry-After header present.",
        sleep_seconds: sleep1,
        backoff_strategy: `Exponential Backoff (Wait ${sleep1}s)`,
      });
      totalSleepTime += sleep1;

      // Attempt 2: HTTP 429 Rate Limit
      const sleep2 = Number((initial_delay * 2 * (jitter ? 0.95 : 1.0)).toFixed(1));
      attemptsLog.push({
        attempt: 2,
        timestamp: new Date(Date.now() + sleep1 * 1000).toISOString(),
        status: "retryable_error",
        status_code: 429,
        error_type: "LLMRetryableError",
        error_message: "HTTP 429: Rate Limit Exceeded (Attempt 2).",
        sleep_seconds: sleep2,
        backoff_strategy: `Exponential Backoff (Wait ${sleep2}s)`,
      });
      totalSleepTime += sleep2;

      // Attempt 3: HTTP 200 Success
      attemptsLog.push({
        attempt: 3,
        timestamp: new Date(Date.now() + (sleep1 + sleep2) * 1000).toISOString(),
        status: "success",
        status_code: 200,
        sleep_seconds: 0,
        backoff_strategy: "Recovered successfully after 2 retries",
      });
      isSuccess = true;
      finalAttempt = 3;
    } else if (scenario === "network_flake_recovered") {
      // Attempt 1: Connection Timeout
      const sleep1 = Number((initial_delay * (jitter ? 1.05 : 1.0)).toFixed(1));
      attemptsLog.push({
        attempt: 1,
        timestamp: new Date().toISOString(),
        status: "retryable_error",
        error_type: "httpx.ConnectTimeout",
        error_message: "Connection timed out to LLM API gateway.",
        sleep_seconds: sleep1,
        backoff_strategy: `Exponential Jitter Backoff (Wait ${sleep1}s)`,
      });
      totalSleepTime += sleep1;

      // Attempt 2: Success
      attemptsLog.push({
        attempt: 2,
        timestamp: new Date(Date.now() + sleep1 * 1000).toISOString(),
        status: "success",
        status_code: 200,
        sleep_seconds: 0,
        backoff_strategy: "Recovered successfully after 1 retry",
      });
      isSuccess = true;
      finalAttempt = 2;
    } else if (scenario === "outage_failed") {
      // 4 consecutive failures hitting max_retries limit
      let cumulativeDelay = 0;
      for (let i = 1; i <= Math.min(max_retries, 4); i++) {
        const sleep = i < max_retries ? Number((initial_delay * Math.pow(2, i - 1) * (jitter ? 1.02 : 1.0)).toFixed(1)) : 0;
        attemptsLog.push({
          attempt: i,
          timestamp: new Date(Date.now() + cumulativeDelay * 1000).toISOString(),
          status: i === max_retries ? "fatal_error" : "retryable_error",
          status_code: 503,
          error_type: "LLMRetryableError",
          error_message: i === max_retries
            ? `❌ Failed after ${max_retries} attempts: HTTP 503 Service Unavailable`
            : `HTTP 503: Service Unavailable (Attempt ${i}/${max_retries})`,
          sleep_seconds: sleep,
          backoff_strategy: i === max_retries ? "Max retries exhausted -> Graceful CLI Exit Code 1" : `Exponential Backoff (Wait ${sleep}s)`,
        });
        cumulativeDelay += sleep;
      }
      totalSleepTime = cumulativeDelay;
      isSuccess = false;
      finalAttempt = Math.min(max_retries, 4);
    }

    // FinOps Token & Cost Calculations
    const promptTokens = Math.floor(280 + textContent.length * 1.2);
    const completionTokens = isSuccess ? 190 : 0;
    const totalTokens = promptTokens + completionTokens;

    const pricing = MODEL_PRICING[model.toLowerCase()] || MODEL_PRICING["gemini-1.5-flash"];
    const promptCost = (promptTokens / 1_000_000) * pricing.input_per_1m;
    const completionCost = (completionTokens / 1_000_000) * pricing.output_per_1m;
    const totalCostUsd = Number((promptCost + completionCost).toFixed(6));
    const executionTimeSeconds = Number((0.015 + totalSleepTime).toFixed(3));

    // Structured Pydantic V2 AnalysisReport schema response
    const report = isSuccess
      ? {
          source: "https://wrapper-cli.internal/retry-demo",
          analyzed_at: nowIso,
          model_used: model,
          title: `[NETWORK RESILIENCE DEMO] Analysis: ${snippet.substring(0, 35)}`,
          summary: `Report generated successfully following network resilience recovery under Tenacity @retry policy (Scenario: ${scenario}, Attempts: ${finalAttempt}).`,
          key_points: [
            `Tenacity retry orchestrator executed ${finalAttempt} attempt(s) with exponential backoff & jitter.`,
            `Total backoff wait time: ${totalSleepTime.toFixed(1)}s (Total execution time: ${executionTimeSeconds}s).`,
            "Pydantic V2 immutable contract validation enforced on final payload.",
            "Graceful error recovery prevents CLI process crashes during transient API outages.",
          ],
          impact_technical: `Survives HTTP 429 rate limits and transient 5xx errors across ${max_retries} max attempts.`,
          impact_business: "Guarantees CLI reliability and idempotency in unstable CI/CD environments.",
          impact_regulatory: "Ensures no incomplete or corrupted payloads bypass Pydantic V2 bounds.",
          recommendation: "Maintain exponential backoff jitter (initial=2s, max=10s) with max 4 attempts.",
          priority: "high",
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
          estimated_cost_usd: totalCostUsd,
          execution_time_seconds: executionTimeSeconds,
          is_cached: false,
        }
      : null;

    return NextResponse.json({
      status: isSuccess ? "success" : "failed",
      scenario,
      is_success: isSuccess,
      attempts_count: finalAttempt,
      max_retries,
      total_backoff_seconds: Number(totalSleepTime.toFixed(1)),
      execution_time_seconds: executionTimeSeconds,
      attempts_log: attemptsLog,
      error_summary: !isSuccess ? `❌ Failed after ${finalAttempt} attempts: LLM API service unavailable` : null,
      report,
      telemetry: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        estimated_cost_usd: totalCostUsd,
        execution_time_seconds: executionTimeSeconds,
        total_backoff_seconds: Number(totalSleepTime.toFixed(1)),
        attempts: finalAttempt,
        pydantic_validated: isSuccess,
        schema_version: "2.10.0",
        exit_code: isSuccess ? 0 : 1,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to execute retry demo" },
      { status: 500 }
    );
  }
}
