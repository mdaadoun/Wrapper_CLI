"""System prompt engineering definitions for LLM analysis and JSON schema enforcement."""

from ai_watcher.schemas.report import AnalysisReport

SAMPLE_ANALYSIS_REPORT_JSON: str = """{
  "source": "https://example.com/ai-update",
  "analyzed_at": "2026-07-30T10:00:00Z",
  "model_used": "gpt-4o-mini",
  "title": "Autonomous Agent Framework Release",
  "summary": "A novel open-source agent orchestration framework has been introduced, delivering sub-100ms response latencies and native Pydantic V2 validation guardrails for enterprise LLM deployments.",
  "key_points": [
    "Native multi-agent orchestration layer",
    "Sub-100ms response latency on edge runtime engines",
    "Built-in security guardrails and schema enforcement"
  ],
  "impact_technical": "Eliminates custom glue code for tool calling and output parsing, reducing system complexity.",
  "impact_business": "Accelerates time-to-market for enterprise AI features while optimizing operational API token expenditure.",
  "impact_regulatory": "Enhances compliance with EU AI Act auditability standards via structured telemetry logs.",
  "recommendation": "Evaluate framework integration for upcoming Q3 enterprise agentic workflow rollout.",
  "priority": "high",
  "prompt_tokens": 450,
  "completion_tokens": 180,
  "total_tokens": 630,
  "estimated_cost_usd": 0.000315,
  "execution_time_seconds": 0.85,
  "is_cached": false
}"""

SYSTEM_PROMPT: str = f"""You are a Senior AI Analyst specializing in evaluating technology news, AI research papers, model releases, and engineering documentation.

Your task is to analyze the provided content and generate a structured executive report adhering strictly to the JSON schema defined below.

### CONSTRAINTS & FORMATTING:
1. OUTPUT FORMAT: Respond ONLY with a valid, raw JSON object matching the AnalysisReport schema. Do NOT include markdown code blocks (e.g. ```json), commentary, or extra text.
2. SUMMARY: Executive summary must be concise and informative, strictly under 200 words.
3. KEY POINTS: Provide between 3 and 5 high-impact bullet points.
4. PRIORITY: Must be exactly one of: "low", "medium", or "high".
5. IMPACT ANALYSIS: Clearly articulate technical, business, and regulatory (e.g., EU AI Act, compliance) impacts.
6. RECOMMENDATION: Provide a concrete, actionable next step for software development and engineering teams.

### EXPECTED JSON SCHEMA:
{{
  "source": "string (URL, filepath, or source identifier)",
  "analyzed_at": "string (ISO-8601 UTC timestamp)",
  "model_used": "string (LLM model identifier)",
  "title": "string (Synthetic summary title)",
  "summary": "string (Executive summary, max 200 words)",
  "key_points": ["string (3 to 5 bullet points)"],
  "impact_technical": "string (Architecture and engineering impact)",
  "impact_business": "string (Business and product impact)",
  "impact_regulatory": "string or null (Compliance and regulatory impact)",
  "recommendation": "string (Actionable next step for dev team)",
  "priority": "low" | "medium" | "high",
  "prompt_tokens": "integer (>= 0)",
  "completion_tokens": "integer (>= 0)",
  "total_tokens": "integer (>= 0)",
  "estimated_cost_usd": "float (>= 0.0)",
  "execution_time_seconds": "float (>= 0.0)",
  "is_cached": "boolean"
}}

### EXAMPLE VALID JSON RESPONSE:
{SAMPLE_ANALYSIS_REPORT_JSON}
"""


def get_system_prompt() -> str:
    """Return configured system prompt string."""
    return SYSTEM_PROMPT


def get_sample_analysis_report_json() -> str:
    """Return raw sample JSON string parseable by AnalysisReport."""
    return SAMPLE_ANALYSIS_REPORT_JSON


def validate_sample_report() -> AnalysisReport:
    """Parse and validate sample JSON string against AnalysisReport schema."""
    from ai_watcher.exceptions import WatcherError
    from pydantic import ValidationError

    try:
        return AnalysisReport.model_validate_json(SAMPLE_ANALYSIS_REPORT_JSON)
    except ValidationError as e:
        raise WatcherError(f"Sample JSON validation failed: {e}") from e
