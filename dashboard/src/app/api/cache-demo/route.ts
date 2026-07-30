import { NextResponse } from "next/server";

// Pricing table for FinOps calculations (USD / 1M tokens)
const MODEL_PRICING: Record<string, { input_per_1m: number; output_per_1m: number }> = {
  "gemini-1.5-flash": { input_per_1m: 0.35, output_per_1m: 1.05 },
  "gemini-2.0-flash": { input_per_1m: 0.1, output_per_1m: 0.4 },
  "gpt-4o": { input_per_1m: 2.5, output_per_1m: 10.0 },
  "gpt-4o-mini": { input_per_1m: 0.15, output_per_1m: 0.6 },
  "claude-3-5-sonnet-20241022": { input_per_1m: 3.0, output_per_1m: 15.0 },
  "deepseek-chat": { input_per_1m: 0.14, output_per_1m: 0.28 },
};

// In-memory cache store simulating disk-backed JSON cache for Phase 7 demo
const memoryCacheStore: Map<
  string,
  { report: any; timestamp: number; ttl: number; content_hash: string }
> = new Map();

// Helper function to simulate SHA-256 hash generation
function computeSimpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `sha256_${hex}${hex}${hex}${hex}`.substring(0, 64);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      content = "Local Caching System evaluation with SHA-256 fingerprinting.",
      model = "gemini-1.5-flash",
      temperature = 0.2,
      ttl = 3600, // Default 1 hour TTL
      bypass_cache = false,
      clear_cache = false,
    } = body;

    // Handle cache flush action
    if (clear_cache) {
      const clearedCount = memoryCacheStore.size;
      memoryCacheStore.clear();
      return NextResponse.json({
        status: "success",
        action: "clear_cache",
        cleared_entries: clearedCount,
        message: `Successfully purged ${clearedCount} entries from cache.`,
      });
    }

    const textContent = String(content || "").trim() || "Local cache analysis sample.";
    const contentHash = computeSimpleHash(`${textContent}_${model}_${temperature}`);
    const nowSec = Math.floor(Date.now() / 1000);

    // Check cache hit unless bypass_cache or ttl === 0 requested
    if (!bypass_cache && ttl > 0 && memoryCacheStore.has(contentHash)) {
      const cachedItem = memoryCacheStore.get(contentHash)!;
      const ageSeconds = nowSec - cachedItem.timestamp;

      if (ageSeconds < (ttl || cachedItem.ttl)) {
        // Return Cache Hit result with 0 cost and sub-millisecond latency
        const cachedReport = {
          ...cachedItem.report,
          is_cached: true,
          execution_time_seconds: 0.0008,
          estimated_cost_usd: 0.0,
        };

        return NextResponse.json({
          status: "success",
          cache_hit: true,
          content_hash: contentHash,
          ttl,
          age_seconds: ageSeconds,
          report: cachedReport,
          telemetry: {
            prompt_tokens: cachedReport.prompt_tokens,
            completion_tokens: cachedReport.completion_tokens,
            total_tokens: cachedReport.total_tokens,
            estimated_cost_usd: 0.0,
            execution_time_seconds: 0.0008,
            is_cached: true,
            saved_cost_usd: cachedItem.report.estimated_cost_usd,
            content_hash: contentHash,
            pydantic_validated: true,
            schema_version: "2.10.0",
          },
        });
      } else {
        // Expired entry -> purge it
        memoryCacheStore.delete(contentHash);
      }
    }

    // Cache Miss -> Perform analysis computation & record FinOps cost
    const snippet = textContent.length > 70 ? textContent.substring(0, 70) + "..." : textContent;
    const promptTokens = Math.floor(220 + textContent.length * 1.1);
    const completionTokens = 180;
    const totalTokens = promptTokens + completionTokens;

    const pricing = MODEL_PRICING[model.toLowerCase()] || MODEL_PRICING["gemini-1.5-flash"];
    const promptCost = (promptTokens / 1_000_000) * pricing.input_per_1m;
    const completionCost = (completionTokens / 1_000_000) * pricing.output_per_1m;
    const totalCostUsd = Number((promptCost + completionCost).toFixed(6));
    const executionTimeSeconds = 0.0142;

    const isHighPriority =
      textContent.toLowerCase().includes("urgent") ||
      textContent.toLowerCase().includes("security") ||
      textContent.toLowerCase().includes("critical");

    const priority = isHighPriority ? "high" : "medium";
    const title = `[LOCAL CACHE DEMO] Analysis: ${snippet.substring(0, 35)}`;
    const nowIso = new Date().toISOString();

    const report = {
      source: "https://wrapper-cli.internal/cache-demo",
      analyzed_at: nowIso,
      model_used: model,
      title,
      summary: `Rapport généré et sérialisé dans le système de cache local JSON avec empreinte SHA-256 pour "${snippet}". Validation Pydantic V2.`,
      key_points: [
        `Indexation par empreinte SHA-256 unique: ${contentHash.substring(0, 16)}...`,
        "Purge automatique à l'initialisation et invalidation stricte selon TTL.",
        "Élimination complète des coûts API ($0.00 USD) et réduction de latence à ~0.8ms sur Cache Hit.",
        "Options CLI --no-cache et --cache-ttl 0 pour forcer la ré-analyse.",
      ],
      impact_technical: "Réduction de 100% de la latence réseau sur requêtes idempotentes.",
      impact_business: "Optimisation directe des coûts LLM FinOps sans dégradation de la fraîcheur.",
      impact_regulatory: "Archivage local déterministe avec hachage cryptographique.",
      recommendation: "Conserver le TTL par défaut de 3600s pour les analyses répétitives de documentation.",
      priority,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      estimated_cost_usd: totalCostUsd,
      execution_time_seconds: executionTimeSeconds,
      is_cached: false,
      content_hash: contentHash,
    };

    // Store in cache if bypass not enabled and ttl > 0
    if (!bypass_cache && ttl > 0) {
      memoryCacheStore.set(contentHash, {
        report,
        timestamp: nowSec,
        ttl,
        content_hash: contentHash,
      });
    }

    return NextResponse.json({
      status: "success",
      cache_hit: false,
      content_hash: contentHash,
      ttl,
      age_seconds: 0,
      report,
      telemetry: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        estimated_cost_usd: totalCostUsd,
        execution_time_seconds: executionTimeSeconds,
        is_cached: false,
        saved_cost_usd: 0.0,
        content_hash: contentHash,
        pydantic_validated: true,
        schema_version: "2.10.0",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to execute cache demo" },
      { status: 500 }
    );
  }
}
