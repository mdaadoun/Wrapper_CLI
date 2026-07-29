# 🏛️ Software Architecture Specification: AI Watcher CLI Wrapper

> **Status:** Active Standard
> **Version:** 1.0.0
> **Scope:** Architecture & Technical Invariants for `ai-watcher`

---

## 1. Executive Overview & System Topology

`ai-watcher` is a single-process, local CLI utility designed for high-performance, fault-tolerant text ingestion, LLM-based analysis, and structured reporting.

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                 CLI ENTRYPOINT                                   │
│                                (src/main.py)                                     │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                                         ▼
                               ┌───────────────────┐
                               │  Config & Models  │
                               │(config.py, schemas)
                               └─────────┬─────────┘
                                         │
                  ┌──────────────────────┼──────────────────────┐
                  │                      │                      │
                  ▼                      ▼                      ▼
        ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
        │ Extractor Engine │   │ Cache Persistence│   │ LLM Client Engine│
        │ (core/extractor) │   │  (utils/cache)   │   │  (clients/llm)   │
        └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
                 │                      │                      │
                 │              Hash    │ Hit                  │ Network / API
                 └───────────────► [SHA-256] ──────────────────┤ Call (Tenacity)
                                        │ Miss                 │
                                        ▼                      ▼
                               ┌──────────────────────────────────┐
                               │     Structured Output Schema     │
                               │   (schemas/report.AnalysisReport)│
                               └────────────────┬─────────────────┘
                                                │
                                                ▼
                               ┌──────────────────────────────────┐
                               │        Formatters & FinOps       │
                               │(formatters/console, utils/cost)  │
                               └────────────────┬─────────────────┘
                                                │
                                                ▼
                                   [Rich Console / JSON / MD]

```

---

## 2. Invariants & Architectural Rules (AI Enforcement Rules)

> ⚠️ **STRICT COMPLIANCE REQUIRED:** Any pull request or LLM-generated diff violating these rules MUST be rejected.

### Rule 1: Layered Dependency Boundaries (Strict Directional Flow)

* **Rule:** Dependencies flow downward **ONLY**.
* `main.py` ──> `core/`, `clients/`, `formatters/`, `utils/`
* `core/` ──> `clients/`, `utils/`, `schemas/`, `exceptions.py`
* `clients/` ──> `schemas/`, `exceptions.py`, `utils/cost.py`
* `formatters/` ──> `schemas/`
* `schemas/` & `exceptions.py` ──> **NO INTERNAL DEPENDENCIES** (Leaf modules)


* **Violation:** `core/` importing `main.py`, or `formatters/` calling `clients/` directly.

### Rule 2: Exception Hierarchy & Zero Naked Crash Policy

* **Rule:** No raw third-party exceptions (`httpx.HTTPError`, `bs4.FeatureNotFound`, `openai.APIError`) may bubble up past module boundaries.
* **Invariant:** All internal exceptions MUST inherit from `WatcherError` in `src/ai_watcher/exceptions.py`.
* `EmptySourceError` (Input validation)
* `ExtractionError` (File I/O, Web scraping)
* `LLMClientError` (Network, Auth, Rate Limits, Schema Validation failure)
* `ConfigurationError` (Missing `.env` or invalid settings)


* **User Experience:** The CLI must terminate with Exit Code `1` and print a clean Rich-styled red error panel. **Stack traces in production are forbidden.**

### Rule 3: Input & Output Contracts (Pydantic V2 Primacy)

* **Rule:** Data exchanged across module boundaries MUST be encapsulated in Pydantic models.
* **Invariant:** Direct raw `dict` passing for domain data is forbidden. `LLMClient.analyze()` MUST return a fully validated `AnalysisReport` model instance.
* **Determinism:** Model inference parameters must enforce `temperature <= 0.3` and `top_p = 0.9`.

### Rule 4: FinOps Observability & Metadata Injection

* **Rule:** Every execution path that interacts with an LLM **MUST** capture and inject FinOps metrics into the `AnalysisReport`:
1. `prompt_tokens` (exact count from API response)
2. `completion_tokens` (exact count from API response)
3. `execution_time_seconds` (measured via `time.perf_counter()`)
4. `estimated_cost_usd` (computed via `utils/cost.py` pricing matrix)



### Rule 5: Pure Functions & Side-Effect Isolation

* **Rule:** `core/extractor.py` and `utils/cost.py` must remain **pure functions** without global state or side effects.
* **Side-Effect Boundaries:** File I/O for caching is restricted to `utils/cache.py`. Network I/O is restricted to `core/extractor.py` (scraping) and `clients/llm_client.py` (API).

---

## 3. Core Module Specifications

### 3.1 Data Schema Contract (`src/ai_watcher/schemas/report.py`)

```python
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AnalysisReport(BaseModel):
    model_config = ConfigDict(frozen=True)

    # Context & Origin
    source: str = Field(description="Raw source, filepath, or URL scanned")
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)
    model_used: str = Field(description="Exact LLM model identifier used")

    # Core Analysis Deliverables
    title: str = Field(description="Short synthetic title")
    summary: str = Field(description="Executive summary (max 200 words)")
    key_points: List[str] = Field(description="3 to 5 key bullet points")
    impact_technical: str = Field(
        description="Architecture & engineering impact"
    )
    impact_business: str = Field(description="Business & product impact")
    impact_regulatory: Optional[str] = Field(
        default=None, description="Compliance/AI Act impact"
    )
    recommendation: str = Field(
        description="Actionable next step for dev team"
    )
    priority: str = Field(description="Priority: 'low' | 'medium' | 'high'")

    # Injected FinOps Observability
    prompt_tokens: int = Field(default=0, ge=0)
    completion_tokens: int = Field(default=0, ge=0)
    total_tokens: int = Field(default=0, ge=0)
    estimated_cost_usd: float = Field(default=0.0, ge=0.0)
    execution_time_seconds: float = Field(default=0.0, ge=0.0)
    is_cached: bool = Field(default=False)

```

### 3.2 Resilience & Network Policy (`src/ai_watcher/clients/llm_client.py`)

Remote API interactions MUST use `@tenacity.retry` with the following parameters:

* **Retry Triggers:** `httpx.TimeoutException`, `httpx.HTTPStatusError` (HTTP 429, 500, 502, 503, 504), `LLMClientError`.
* **Strategy:** Exponential backoff with random jitter.
* **Max Attempts:** 4 attempts.
* **Backoff Progression:** Initial delay 2s, maximum delay 10s.
* **Logging:** Intercepted retries emit `logger.warning("Retry attempt {n} after failure: {exc}")`.

### 3.3 Caching Mechanism (`src/ai_watcher/utils/cache.py`)

* **Storage Path:** Default to `~/.cache/ai_watcher/cache.json`.
* **Cache Key:** `SHA-256(cleaned_extracted_text + model_name)`.
* **Payload:** Serialized JSON of `AnalysisReport`.
* **Invalidation:** Expired TTL (`--cache-ttl` in seconds) or explicit `--no-cache` flag.

---

## 4. Technology Stack & Tooling Constraints

| Role | Tool / Library | Mandated Version / Constraint |
| --- | --- | --- |
| **Language** | Python | `>= 3.11, < 3.13` with strict typing (`mypy --strict`) |
| **CLI Framework** | Typer | Strict type annotations for flags and arguments |
| **HTTP Engine** | HTTPX | Used for web scraping (with browser user-agent) |
| **Scraping** | BeautifulSoup4 | Parser: `html.parser`. Strip `<script>`, `<style>`, `<nav>`, `<footer>` |
| **Formatting** | Rich | Panels, Tables, Markdown rendering |
| **Resilience** | Tenacity | Decorated wrappers on external I/O |
| **Linter / Formatter** | Ruff | Configured via `pyproject.toml` |

---

## 5. Security & FinOps Controls

1. **Zero Secret Leakage:** `OPENAI_API_KEY` or `GEMINI_API_KEY` must **NEVER** be hardcoded, written to log files, or included in exception messages.
2. **Deterministic Pricing:** Model rates per 1,000,000 tokens are defined strictly inside `utils/cost.py`. Unknown models fall back to `0.0` with a warning log rather than throwing an unhandled error.
3. **Container Isolation:** The production `Dockerfile` uses a non-root unprivileged user (`appuser`, UID 10001) and sets `ENTRYPOINT ["poetry", "run", "python", "-m", "src.ai_watcher.main"]`.
