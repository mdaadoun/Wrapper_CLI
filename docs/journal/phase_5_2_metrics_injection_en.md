# Dev Journal Session 5.2: Metrics Injection into Report

**Date:** 2026-07-30

Enhanced `LLMClient.analyze()` to accurately time API requests via `time.perf_counter()`, extract prompt and completion token counts from provider payloads (Gemini and OpenAI schemas), calculate inference costs via `cost.py`, and populate FinOps fields inside `AnalysisReport`.

---

### 1. Concepts Introduced

- **Transparent Metrics Instrumentation:** Measuring API response time using high-precision performance counters (`time.perf_counter()`) and extracting token usage metrics directly at the transport client boundary.
- **FinOps Cost Calculation Integration:** Dynamic mapping of prompt and completion token counts to USD cost estimates based on pre-configured per-model pricing matrices.

---

### 2. Architecture Decisions (ADR)

#### ADR 1: Metrics Extraction at LLMClient Level
- **Option 1 (Higher-level decorator):** Measure timing and tokens in calling CLI or orchestrator layer.
- **Option 2 (Selected - Client boundary):** Incorporate `perf_counter()` and usage parsing inside `LLMClient.analyze()` before `AnalysisReport` construction.
- **Rationale:** Keeps business logic decoupled from token tracking while guaranteeing that every report generated from live API calls carries exact latency, token, and cost metrics.

---

### 3. Implementation & Code

```python
# src/ai_watcher/clients/llm_client.py
start_time = time.perf_counter()
# ... network call ...
elapsed_time = round(time.perf_counter() - start_time, 4)

report_dict["prompt_tokens"] = prompt_tokens
report_dict["completion_tokens"] = completion_tokens
report_dict["total_tokens"] = prompt_tokens + completion_tokens
report_dict["execution_time_seconds"] = elapsed_time
report_dict["estimated_cost_usd"] = calculate_cost(
    model=self.model_name,
    prompt_tokens=prompt_tokens,
    completion_tokens=completion_tokens,
)
```

Validation:
```bash
cd projets/3_Wrapper_CLI
./.venv/bin/pytest tests/test_llm_client.py -v
```

---

### 4. Session Checklist & Deliverables
1. [x] `LLMClient.analyze()` times execution using `time.perf_counter()`
2. [x] `LLMClient._parse_response()` extracts token counts across Gemini and OpenAI usage metadata
3. [x] `calculate_cost()` computes estimated USD cost and injects into `AnalysisReport`
4. [x] Unit test suite passing with 100% line coverage on `LLMClient`
