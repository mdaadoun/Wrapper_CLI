# Dev Journal Session 5.1: Model Pricing Matrix & Cost Calculator

**Date:** 2026-07-30

Implemented the FinOps cost calculator module — a comprehensive 40-model pricing matrix with strict `UnknownModelError` on unknown models, switching from legacy per-1K to industry-standard per-1M token pricing.

---

### 1. Concepts Introduced

- **Per-1M Token Pricing:** Industry standard (2025+) where model rates are quoted per 1,000,000 tokens rather than per 1,000. Simplifies mental math: `gpt-4o-mini = $0.15/$0.60 per 1M`.
- **UnknownModelError:** Custom exception inheriting from `WatcherError`, raised when `calculate_cost()` receives a model not in the pricing matrix. No silent fallback.
- **Pricing Matrix Integrity:** Invariant checks enforced via tests: all rates > 0, output rate >= input rate, minimum 20 models.

---

### 2. Architecture Decisions (ADR)

#### ADR 1: Switch from per-1K to per-1M token pricing
- **Option 1 (per-1K):** Legacy format, tiny decimals (0.00015). Used in initial cost.py.
- **Option 2 (per-1M):** Aligns with current OpenAI/Google/Anthropic pricing pages. Cleaner numbers (0.15 vs 0.00015).
- **Selected:** Per-1M. Rationale: Industry standard, readability, simpler arithmetic. Division factor changes from 1000 to 1,000,000.

#### ADR 2: Raise UnknownModelError instead of default fallback
- **Option 1 (silent fallback):** Return estimated cost using default rates. Masks misconfiguration.
- **Option 2 (strict error):** Raise `UnknownModelError` forcing developer to add model to matrix.
- **Selected:** Strict error. Rationale: FinOps accuracy requires every model to have known rates. Default fallback leads to budget drift.

#### ADR 3: Comprehensive matrix across 8 providers instead of single-provider scope
- **Option 1 (single provider):** Only Gemini models (original project scope).
- **Option 2 (multi-provider):** 40 models across OpenAI, Google, Anthropic, Meta, Mistral, DeepSeek, Cohere, Amazon.
- **Selected:** Multi-provider. Rationale: Single source of truth for cost calculation regardless of which LLM provider is used.

---

### 3. Implementation & Code

```python
# utils/cost.py — core calculate_cost function
def calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    pricing = MODEL_PRICING.get(model.lower())
    if pricing is None:
        raise UnknownModelError(f"Unknown model '{model}'. ...")
    cost = (prompt_tokens / 1_000_000.0 * pricing["input_per_1m"]) + (
        completion_tokens / 1_000_000.0 * pricing["output_per_1m"])
    return round(cost, 6)
```

Integration with existing `LLMClient._parse_response()`:
```python
# In llm_client.py line 196-200
report_dict["estimated_cost_usd"] = calculate_cost(
    model=self.model_name,
    prompt_tokens=prompt_tokens,
    completion_tokens=completion_tokens,
)
```

Validation:
```bash
cd projets/3_Wrapper_CLI
poetry run python -m pytest tests/test_cost.py -v
# 13 passed
```

---

### 4. Session Checklist & Deliverables
1. [x] `exceptions.py` — Added `UnknownModelError(WatcherError)`
2. [x] `utils/cost.py` — 40-model pricing matrix per-1M, case-insensitive, strict error on unknown
3. [x] `tests/test_cost.py` — 13 tests covering known models, unknown models, case insensitivity, matrix integrity, edge cases
4. [x] All 13 tests passing
5. [x] `tmp_metadata.json` — Raw metadata written to project root
