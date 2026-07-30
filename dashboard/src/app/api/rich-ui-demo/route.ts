import { NextResponse } from "next/server";

// Pricing table for FinOps metrics calculations (USD / 1M tokens)
const MODEL_PRICING: Record<string, { input_per_1m: number; output_per_1m: number }> = {
  "gemini-1.5-flash": { input_per_1m: 0.35, output_per_1m: 1.05 },
  "gemini-2.0-flash": { input_per_1m: 0.1, output_per_1m: 0.4 },
  "gpt-4o": { input_per_1m: 2.5, output_per_1m: 10.0 },
  "gpt-4o-mini": { input_per_1m: 0.15, output_per_1m: 0.6 },
  "claude-3-5-sonnet-20241022": { input_per_1m: 3.0, output_per_1m: 15.0 },
  "deepseek-chat": { input_per_1m: 0.14, output_per_1m: 0.28 },
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      content = "Analysis of agentic workflows and rich terminal output formatting.",
      format = "console",
      model = "gemini-1.5-flash",
      temperature = 0.2,
      theme = "emerald",
    } = body;

    const textContent = String(content || "").trim() || "Agentic workflow analysis sample.";
    const snippet = textContent.length > 70 ? textContent.substring(0, 70) + "..." : textContent;

    const promptTokens = Math.floor(280 + textContent.length * 1.1);
    const completionTokens = 195;
    const totalTokens = promptTokens + completionTokens;

    const pricing = MODEL_PRICING[model.toLowerCase()] || MODEL_PRICING["gemini-1.5-flash"];
    const promptCost = (promptTokens / 1_000_000) * pricing.input_per_1m;
    const completionCost = (completionTokens / 1_000_000) * pricing.output_per_1m;
    const totalCostUsd = Number((promptCost + completionCost).toFixed(6));
    const executionTimeSeconds = 0.0135;

    const isHighPriority =
      textContent.toLowerCase().includes("urgent") ||
      textContent.toLowerCase().includes("security") ||
      textContent.toLowerCase().includes("critical");

    const priority = isHighPriority ? "high" : "medium";
    const title = `[DEMO RICH UI] Synthèse Executive : ${snippet.substring(0, 35)}`;
    const nowIso = new Date().toISOString();

    const report = {
      source: "https://wrapper-cli.internal/demo",
      analyzed_at: nowIso,
      model_used: model,
      title,
      summary: `Rapport généré avec succés via le moteur Rich UI & Exporters Phase 6 pour le contenu : "${snippet}". Contrles de validation Pydantic V2 appliqués.`,
      key_points: [
        "Panneaux Rich Terminal avec mise en forme ANSI & gestion adaptive des thèmes.",
        "Export multi-format natif (stdout JSON, fichiers .md, console ANSI).",
        "Calculateurs FinOps et télémétrie intégrés avec grille tarifaire 40+ modèles.",
        "Gestion des erreurs I/O et fallback sécurisé avec levée d'exceptions ExportError.",
      ],
      impact_technical: "Optimisation de la clarté visuelle et intégration sans couture dans les pipelines CI/CD.",
      impact_business: "Gain de temps de lecture pour les décideurs via synthèses visuelles structurées.",
      impact_regulatory: isHighPriority ? "Conformité AI Act européenne et traçabilité des données d'entrée." : "Auditabilité standard.",
      recommendation: "Activer les exports Markdown automatiques pour l'archivage dans la base de connaissances.",
      priority,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      estimated_cost_usd: totalCostUsd,
      execution_time_seconds: executionTimeSeconds,
      is_cached: false,
    };

    // Generate output representation based on format requested
    let renderedOutput = "";
    if (format === "markdown") {
      renderedOutput = [
        `# ${report.title}`,
        ``,
        `## Metadata`,
        `- **Source:** \`${report.source}\``,
        `- **Model Used:** \`${report.model_used}\``,
        `- **Analyzed At:** \`${report.analyzed_at}\``,
        `- **Priority:** **${report.priority.toUpperCase()}**`,
        ``,
        `## Executive Summary`,
        report.summary,
        ``,
        `## Key Points`,
        ...report.key_points.map((kp) => `- ${kp}`),
        ``,
        `## Impacts & Recommendation`,
        `- **Technical Impact:** ${report.impact_technical}`,
        `- **Business Impact:** ${report.impact_business}`,
        `- **Recommendation:** ${report.recommendation}`,
        ``,
        `## FinOps Metrics`,
        `| Metric | Value |`,
        `| :--- | :--- |`,
        `| Model | ${report.model_used} |`,
        `| Total Tokens | ${report.total_tokens} |`,
        `| Estimated Cost | $${report.estimated_cost_usd} |`,
        `| Execution Time | ${report.execution_time_seconds}s |`,
      ].join("\n");
    } else if (format === "json") {
      renderedOutput = JSON.stringify(report, null, 2);
    } else {
      // Console Rich UI mock output representation
      renderedOutput = [
        `╭─ ${report.title} [${report.priority.toUpperCase()}] ─╮`,
        `│ Source: ${report.source}                                              │`,
        `│ Model: ${report.model_used} | Temp: ${temperature} | Theme: ${theme}            │`,
        `├──────────────────────────────────────────────────────────────────────────────┤`,
        `│ EXECUTIVE SUMMARY                                                            │`,
        `│ ${report.summary} │`,
        `├──────────────────────────────────────────────────────────────────────────────┤`,
        `│ KEY POINTS                                                                   │`,
        ...report.key_points.map((kp) => `│  • ${kp.padEnd(73)} │`),
        `├──────────────────────────────────────────────────────────────────────────────┤`,
        `│ FINOPS METRICS                                                               │`,
        `│ Tokens: ${report.total_tokens} (Prompt: ${report.prompt_tokens} | Compl: ${report.completion_tokens})                    │`,
        `│ Cost: $${report.estimated_cost_usd} USD | Latency: ${report.execution_time_seconds}s                         │`,
        `╰──────────────────────────────────────────────────────────────────────────────╯`,
      ].join("\n");
    }

    return NextResponse.json({
      status: "success",
      format,
      theme,
      temperature,
      report,
      rendered_output: renderedOutput,
      telemetry: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        estimated_cost_usd: totalCostUsd,
        execution_time_seconds: executionTimeSeconds,
        export_format: format,
        pydantic_validated: true,
        schema_version: "2.10.0",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to generate Rich UI export demo" },
      { status: 500 }
    );
  }
}
