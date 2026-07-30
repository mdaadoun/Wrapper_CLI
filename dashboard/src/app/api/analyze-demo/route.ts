import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source = "raw_text", content = "", model = "gemini-1.5-pro-latest (mocked)" } = body;

    const snippet = content ? (content.length > 80 ? content.substring(0, 80) + "..." : content) : "OpenAI launches GPT-5 agentic framework";

    const mockReport = {
      source: source || "https://example.com/ai-news",
      analyzed_at: new Date().toISOString(),
      model_used: model,
      title: `[DEMO LIVE] Synthèse d'analyse IA : ${snippet.substring(0, 35)}...`,
      summary: `Rapport généré automatiquement en mode démo interactif pour le contenu analysé : "${snippet}". Le système a validé le contrat Pydantic V2 et calculé la télémétrie FinOps en temps réel.`,
      key_points: [
        "Architecture découplée permettant l'exécution hors-ligne à coût zéro.",
        "Garantie de typage et de conformité du schéma via Pydantic V2.",
        "Calculateurs FinOps intégrés pour le suivi granulaire des tokens et des coûts.",
        "Compatibilité bilingue (FR/EN) et export multi-format."
      ],
      impact_technical: "Elimination du code spécifique grâce au parsing structuré et typage strict Mypy/Pydantic.",
      impact_business: "Réduction de 100% des dépenses API lors des cycles de dev et tests CI/CD.",
      impact_regulatory: "Conformité AI Act et souveraineté préservée grâce à l'évaluation sans fuite de données.",
      recommendation: "Activer le cache local de réponse pour minimiser les coûts d'inférence en production.",
      priority: content.toLowerCase().includes("urgent") || content.toLowerCase().includes("critical") ? "high" : "medium",
      prompt_tokens: Math.floor(250 + (content.length || 50) * 1.2),
      completion_tokens: 165,
      total_tokens: Math.floor(250 + (content.length || 50) * 1.2) + 165,
      estimated_cost_usd: Number(((Math.floor(250 + (content.length || 50) * 1.2) * 0.00000035) + (165 * 0.00000105)).toFixed(6)),
      execution_time_seconds: 0.0145,
      is_cached: false,
    };

    return NextResponse.json({ status: "success", report: mockReport });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}
