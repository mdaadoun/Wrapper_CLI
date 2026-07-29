# 📌 Session: Phase 4.1 — Output Data Modeling (Pydantic V2)
**Date:** 29 July 2026

Implement the `AnalysisReport` data model in `schemas/report.py` using Pydantic V2, establishing a strictly validated, immutable data contract for LLM structured outputs and FinOps observability metrics.

---

### 1. 🎓 New Concepts Introduced

*   **Pydantic V2 Data Contract:** Strictly typed validation schema enforcing field types, value boundaries, and required keys on LLM JSON responses at runtime before domain consumption.
*   **Immutable Domain Entity (`frozen=True`):** Model configuration option preventing accidental state mutation after instantiation, preserving data integrity across execution layers.
*   **FinOps Telemetry Injection:** Embedding execution metadata (tokens, USD cost, latency, caching status) directly into the analysis report model for end-to-end observability.

---

### 2. 🧠 Decisions & Technical Choices

#### Decision A: Pydantic V2 BaseModel vs. Python standard `dataclass`
*   **Option A.1: Standard `dataclass` with manually written parsing logic**
    *   *Pros/Cons:* Zero third-party dependencies, but requires verbose manual validation logic for JSON parsing, default values, and type coercion.
*   **Option A.2: Pydantic V2 `BaseModel` (Retained)**
    *   *Why this choice?* Built-in `model_validate_json()`, zero-boilerplate type validation, automatic datetime parsing, schema export for LLM structured output prompts, and high performance via Rust `pydantic-core`.

#### Decision B: Field Validation & Auto-Computation vs. Explicit Caller Logic
*   **Option B.1: Force caller to compute `total_tokens` manually before model instantiation**
    *   *Pros/Cons:* Pushes repetitive calculation logic to every API caller module, increasing risk of discrepancy.
*   **Option B.2: `@model_validator(mode="before")` pre-computation in `AnalysisReport` (Retained)**
    *   *Why this choice?* Model automatically computes `total_tokens` whenever `prompt_tokens` and `completion_tokens` are supplied without explicit total, keeping the entity self-consistent and reducing caller boilerplate.

---

### 3. 🛠️ Implementation & Auto-Documentation

The `AnalysisReport` model in `src/ai_watcher/schemas/report.py`:

```python
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class AnalysisReport(BaseModel):
    model_config = ConfigDict(frozen=True)

    # Context & Origin
    source: str = Field(description="Raw source text, filepath, or URL scanned")
    analyzed_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    model_used: str = Field(description="Exact LLM model identifier used")

    # Core Deliverables
    title: str = Field(description="Short synthetic title")
    summary: str = Field(description="Executive summary (max 200 words)")
    key_points: List[str] = Field(description="3 to 5 key bullet points")
    impact_technical: str = Field(description="Architecture impact")
    impact_business: str = Field(description="Business impact")
    impact_regulatory: Optional[str] = Field(default=None)
    recommendation: str = Field(description="Actionable next step")
    priority: Literal["low", "medium", "high"] = Field(description="Priority")

    # FinOps Telemetry
    prompt_tokens: int = Field(default=0, ge=0)
    completion_tokens: int = Field(default=0, ge=0)
    total_tokens: int = Field(default=0, ge=0)
    estimated_cost_usd: float = Field(default=0.0, ge=0.0)
    execution_time_seconds: float = Field(default=0.0, ge=0.0)
    is_cached: bool = Field(default=False)
```

#### Commands to validate:
```bash
# Run schema unit tests
python3 -m pytest tests/test_schemas.py
# Check static typing with Mypy
python3 -m mypy src/ai_watcher/schemas tests/test_schemas.py
```

---

#### Tests added

*   `test_analysis_report_valid_instantiation` — Valid model instantiation with all fields.
*   `test_analysis_report_default_values` — Verification of default values for optional and FinOps fields.
*   `test_analysis_report_missing_required_field_raises` — Enforces `ValidationError` when required keys are omitted.
*   `test_analysis_report_invalid_priority_raises` — Enforces valid priority literal enum ("low", "medium", "high").
*   `test_analysis_report_negative_token_count_raises` — Rejects negative token values (`ge=0`).
*   `test_analysis_report_immutability` — Confirms model frozen state (`frozen=True`).
*   `test_analysis_report_total_tokens_autocomputed` — Auto-calculates `total_tokens`.
*   `test_analysis_report_json_serialization_roundtrip` — Verifies lossless JSON round-trip (`model_dump_json` / `model_validate_json`).

---

### 4. 📌 Session Summary

1.  **Output Data Modeling:** Defined `AnalysisReport` in `src/ai_watcher/schemas/report.py` with strict Pydantic V2 validation.
2.  **Immutability & Safety:** Configured `ConfigDict(frozen=True)` and non-negative constraints on all telemetry fields.
3.  **Test Coverage:** Created `tests/test_schemas.py` with 8 comprehensive test cases passing at 100% line coverage for the `schemas` package.
4.  **Static Typing:** Verified 0 Mypy errors across schemas and tests.
