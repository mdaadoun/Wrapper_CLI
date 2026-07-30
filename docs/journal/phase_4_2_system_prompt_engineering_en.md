# 📌 Session: Phase 4.2 — System Prompt Engineering & Schema Enforcement
**Date:** 30 July 2026

Design and author the core system prompt for AI Watcher CLI in `clients/prompts.py`, enforcing role persona instructions, conciseness constraints, and Pydantic V2 JSON schema specifications along with a validated raw sample response.

---

### 1. 🎓 New Concepts Introduced

*   **System Prompt Engineering:** Structuring system-level instructions with explicit role definition, formatting constraints, and schema guidelines to maximize LLM adherence and output quality.
*   **Few-Shot Schema Grounding:** Embedding a valid sample JSON output directly within the system prompt so the LLM has a concrete reference matching `AnalysisReport.model_validate_json()`.
*   **Zero-Naked-Code-Fence Constraint:** Instructing the LLM to output pure JSON without markdown triple-backtick code fences to streamline downstream parsing and avoid syntax stripping errors.

---

### 2. 🧠 Decisions & Technical Choices

#### Decision A: Prompt Storage as Typed Constant vs Dynamic Loader
*   **Option A.1: Dynamic File Loading (YAML/Jinja2)**
    *   *Pros/Cons:* Allows modifying prompts without Python code changes, but adds external file I/O overhead and runtime path resolution risks in CLI environments.
*   **Option A.2: Typed Module Constant (`SYSTEM_PROMPT`) (Retained)**
    *   *Why this choice?* Selected for static type safety, zero disk I/O latency, ease of unit testing, and instant bundle packaging.

#### Decision B: Sample JSON embedding in Prompt vs Schema-Only Description
*   **Option B.1: Schema Description Only**
    *   *Pros/Cons:* Smaller prompt token footprint but higher rate of malformed JSON field types from smaller models.
*   **Option B.2: Schema Description + Validated Few-Shot JSON Example (Retained)**
    *   *Why this choice?* Including an explicit, verified sample JSON string in the system prompt drastically increases LLM adherence to exact field names, date formats, and enum values.

---

### 3. 🛠️ Implementation & Auto-Documentation

The system prompt module in `src/ai_watcher/clients/prompts.py`:

```python
"""System prompt engineering definitions for LLM analysis and JSON schema enforcement."""

from ai_watcher.exceptions import WatcherError
from ai_watcher.schemas.report import AnalysisReport
from pydantic import ValidationError

SAMPLE_ANALYSIS_REPORT_JSON: str = """{
  "source": "https://example.com/ai-update",
  "analyzed_at": "2026-07-30T10:00:00Z",
  "model_used": "gpt-4o-mini",
  "title": "Autonomous Agent Framework Release",
  "summary": "A novel open-source agent orchestration framework has been introduced...",
  "key_points": [
    "Native multi-agent orchestration layer",
    "Sub-100ms response latency on edge runtime engines",
    "Built-in security guardrails and schema enforcement"
  ],
  "impact_technical": "Eliminates custom glue code for tool calling and output parsing...",
  "impact_business": "Accelerates time-to-market for enterprise AI features...",
  "impact_regulatory": "Enhances compliance with EU AI Act auditability standards...",
  "recommendation": "Evaluate framework integration for upcoming Q3 agentic workflow rollout.",
  "priority": "high",
  "prompt_tokens": 450,
  "completion_tokens": 180,
  "total_tokens": 630,
  "estimated_cost_usd": 0.000315,
  "execution_time_seconds": 0.85,
  "is_cached": false
}"""
```

#### Commands to validate:
```bash
# Run prompts unit tests
python3 -m pytest tests/test_prompts.py
# Check static typing with Mypy
python3 -m mypy src/ai_watcher/clients tests/test_prompts.py
```

---

#### Tests added

*   `test_system_prompt_is_typed_constant` — Verifies `SYSTEM_PROMPT` is a non-empty string constant.
*   `test_system_prompt_content_constraints` — Verifies prompt contains persona, 200-word limit, 3-5 key points, and priority enum values.
*   `test_sample_analysis_report_json_parseable` — Validates `SAMPLE_ANALYSIS_REPORT_JSON` parses via `AnalysisReport.model_validate_json()`.
*   `test_validate_sample_report_function` — Verifies `validate_sample_report()` helper function.
*   `test_get_sample_analysis_report_json_helper` — Verifies raw JSON string getter.
*   `test_embedded_sample_in_system_prompt_is_parseable` — Verifies embedded sample inside `SYSTEM_PROMPT` is valid and parseable.

---

### 4. 📌 Session Summary

1.  **System Prompt Engineering:** Defined `SYSTEM_PROMPT` in `src/ai_watcher/clients/prompts.py` with persona rules, JSON format constraints, and few-shot example.
2.  **Schema Adherence:** Verified that `SAMPLE_ANALYSIS_REPORT_JSON` parses cleanly using `AnalysisReport.model_validate_json()`.
3.  **Exception Wrapping:** Ensured validation errors in `validate_sample_report()` raise domain `WatcherError`.
4.  **Test Coverage:** Created `tests/test_prompts.py` with 6 unit tests passing at 100% line coverage for the prompts module.
