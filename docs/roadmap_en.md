# 🗺️ Detailed Step-by-Step Roadmap: AI Watcher CLI Wrapper

This roadmap outlines the chronological implementation steps for **Project 3: Automated AI Watcher CLI Wrapper**, including theoretical concepts, progress tracking, and validation criteria for each step.

**Base:** Engineering stack inherited from Project 2 (AIPE Framework: Poetry, Pre-commit, Ruff, Mypy, Pytest, Multi-stage Docker, Makefile).

---

## 📊 Phase Overview Dashboard

```text
Phase 1: Baseline Setup ──> Phase 2: CLI Skeleton ──> Phase 3: Ingestion ──> Phase 4: LLM Client ──> Phase 5: FinOps ──> Phase 6: Rich UI ──> Phase 7: Cache ──> Phase 8: Resilience ──> Phase 9: Testing ──> Phase 10: Docker & Release
     (✅ Completed)                (⏳ Pending)            (⏳ Pending)          (⏳ Pending)         (⏳ Pending)      (⏳ Pending)       (⏳ Pending)      (⏳ Pending)        (⏳ Pending)       (⏳ Pending)
```

---

## Phase 1: Technical Baseline Adaptation — ✅ Completed
*Objective: Transform inherited AIPE blueprint into a standalone CLI project with correct dependencies.*

### Step 1.1: Inherited Code Cleanup — ✅ Completed
* **Description:** Remove Project 2 specific code (FastAPI routes in `src/`, AIPE framework tests, Flask dashboard). Keep core infrastructure: `pyproject.toml`, `.pre-commit-config.yaml`, `Makefile`, `Dockerfile`, `.gitignore`, `.vscode/`.
* **Key Concept:** Engineering blueprint reuse — adapt proven baseline rather than starting from scratch.
* **Validation Criterion:** `src/` empty (except `__init__.py`), `tests/` empty, `make lint` executes cleanly.

### Step 1.2: Poetry Dependencies Update — ✅ Completed
* **Description:** Update `pyproject.toml`: replace production web dependencies (FastAPI, Uvicorn) with CLI tools (`typer[all]`, `rich`, `httpx`, `beautifulsoup4`, `tenacity`, `python-dotenv`). Keep Pydantic V2. Regenerate lockfile via `poetry lock && poetry install`.
* **Key Concept:** Declarative dependency management — single source of truth in `pyproject.toml`.
* **Validation Criterion:** `poetry install` succeeds and `poetry run python -c "import typer; import rich; import httpx"` passes.

### Step 1.3: Modular Directory Structure — ✅ Completed
* **Description:** Establish package structure matching specifications (ST-03):
    ```text
    src/ai_watcher/
    ├── __init__.py
    ├── main.py          # CLI entrypoint (Typer)
    ├── config.py        # Pydantic Settings + .env loading
    ├── exceptions.py    # Custom domain exceptions
    ├── core/            # Business logic (extractor, analyzer)
    ├── clients/         # Encapsulated LLM client
    ├── utils/           # Cache, cost calculator
    └── formatters/      # Rich rendering & Markdown export
    ```
* **Key Concept:** Single Responsibility Principle (SRP) modular architecture — each directory has a clear role and is independently testable.
* **Validation Criterion:** All `__init__.py` files created, `make lint` passes on empty structure, and `from src.ai_watcher import main` succeeds.

### Step 1.4: Secrets & Environment Configuration — ✅ Completed
* **Description:** Create `.env.example` at root with expected variables (`GEMINI_API_KEY`, `MODEL_NAME`, `MAX_TOKENS`). Implement `config.py` with `pydantic-settings` or `python-dotenv` to load and validate these variables. Ensure `.env` is in `.gitignore`.
* **Key Concept:** Strict code/configuration separation (12-Factor App) and secret leak prevention.
* **Validation Criterion:** Launching application without `.env` raises explicit error; `detect-secrets` pre-commit hook blocks hardcoded keys.

### Step 1.5: Makefile Adaptation — ✅ Completed
* **Description:** Update Makefile targets for CLI context: replace `make dev` (which launched Uvicorn) with `make run` (executing main CLI command). Add `make run ARGS="--help"` shortcut demonstration.
* **Key Concept:** Unified command interface — Makefile remains single entrypoint for developers.
* **Validation Criterion:** `make run ARGS="--help"` renders Typer help menu without errors.

---

## Phase 2: CLI Skeleton with Typer — ⏳ In Progress
*Objective: Build functional CLI entrypoint with argument and option routing.*

### Step 2.1: Main `scan` Command — ✅ Completed
* **Description:** Implement Typer application in `main.py` with a `scan` command accepting a positional `source` argument (raw text, file path, or URL). Add `--text / -t`, `--file / -f`, `--url / -u` options for explicit input modes.
* **Key Concept:** Declarative CLI Framework — Typer automatically infers help, type validation, and error messages from Python annotations.
* **Validation Criterion:** `poetry run python -m src.ai_watcher.main scan "Hello World"` prints confirmation without crashing. `--help` documents all options.

### Step 2.2: Automatic Source Type Detection — ✅ Completed
* **Description:** Implement detection logic in `main.py`: URLs start with `http://` or `https://`; existing local paths are files; otherwise raw text. Raise `EmptySourceError` if input is empty or whitespace-only.
* **Key Concept:** User Ergonomics — automatic detection removes need for explicit flags in common use cases.
* **Validation Criterion:** CLI correctly identifies all 3 source types. Empty source (`""`) returns exit code `1` with explicit error message.

### Step 2.3: Custom Exceptions Module — ✅ Completed
* **Description:** Create `exceptions.py` with domain exception classes: `EmptySourceError`, `ExtractionError`, `LLMClientError`, `ConfigurationError`. All inherit from base `WatcherError`.
* **Key Concept:** Exception Hierarchy — enables granular error handling and targeted user messages without interpreter crashes.
* **Validation Criterion:** Each exception can be raised and caught individually. Strict Mypy validates type hierarchy.

---

## Phase 3: Multi-Source Ingestion Module — ⏳ Pending
*Goal: Retrieve and clean textual content from 3 input source types (FS-01).*

### Step 3.1: Direct Text and Local File Extraction — ✅ Completed
* **Description:** Implement pure functions in `core/extractor.py`: `extract_from_text(raw: str) -> str` (whitespace normalization) and `extract_from_file(path: Path) -> str` (`.txt` and `.md` reader with existence and extension validation).
* **Key Concept:** Pure functions and I/O separation — predictable input/output testable without side effects.
* **Validation Criterion:** Existing `.md` file returns cleaned text. Non-existent file raises `ExtractionError`. Strict Mypy type-checks cleanly.

### Step 3.2: HTML Web Scraping for URLs — ✅ Completed
* **Description:** Implement `extract_from_url(url: str) -> str` using HTTPX for HTTP request and BeautifulSoup4 to extract visible body text (stripping `<script>`, `<style>`, `<nav>`, `<footer>` tags and collapsing redundant whitespace).
* **Key Concept:** HTML Cleaning Pipeline — converting raw HTML into LLM-friendly clean text to minimize noise and token consumption.
* **Validation Criterion:** URL `https://example.com` returns clean text stripped of HTML tags. Invalid URL (timeout, 404) raises `ExtractionError` with explicit message.

### Step 3.3: Ingestion Orchestrator — ⏳ Pending
* **Description:** Create facade function `extract(source: str, source_type: SourceType) -> str` in `core/extractor.py` dispatching to appropriate extractor based on detected source type. Add Pydantic validation for minimum extracted content length.
* **Key Concept:** Facade Pattern — expose single simple interface hiding internal complexity of the 3 extractors.
* **Validation Criterion:** `extract` handles all 3 source types and raises `EmptySourceError` if cleaned output is empty.

---

## Phase 4: LLM Client & Structured Outputs — ⏳ Pending
*Goal: Query LLM APIs and guarantee structured output matching Pydantic schema (FS-02).*

### Step 4.1: Output Data Modeling (Pydantic V2) — ⏳ Pending
* **Description:** Implement `AnalysisReport` model in `schemas/report.py` as defined in ST-02: `title`, `summary`, `key_points`, `impact_technical`, `impact_business`, `impact_regulatory`, `recommendation`, `priority`, alongside FinOps fields (`prompt_tokens`, `completion_tokens`, `estimated_cost_usd`, `execution_time_seconds`).
* **Key Concept:** Structured Outputs & Data Contract — Pydantic V2 validates LLM JSON response and raises error on schema mismatch.
* **Validation Criterion:** Instantiating `AnalysisReport` with valid data succeeds. Missing required field (`key_points` missing) raises `ValidationError`. Strict Mypy passes.

### Step 4.2: System Prompt Engineering — ⏳ Pending
* **Description:** Author system prompt in `clients/prompts.py` instructing LLM to act as a senior AI analyst. Defines role, format constraints (JSON matching `AnalysisReport` schema), conciseness bounds (max 200 words summary, 3-5 key points), and expected sample output.
* **Key Concept:** System Prompt Engineering — output quality and reliability depend on strict system instructions.
* **Validation Criterion:** System prompt stored as typed constant. Explicitly mentions expected JSON schema and includes valid example parseable by `AnalysisReport.model_validate_json()`.

### Step 4.3: Base LLM Client (Without Retry) — ⏳ Pending
* **Description:** Implement `LLMClient` in `clients/llm_client.py` encapsulating API call (OpenAI SDK or raw HTTPX). `analyze(content: str) -> AnalysisReport` method sends system prompt + user content, parses JSON, and returns validated `AnalysisReport`. Configurable params: `model`, `temperature` (0.0–0.3), `top_p` (0.9), `max_tokens`.
* **Key Concept:** API Client Encapsulation — isolating network calls enables mocking in tests, swapping providers, and centralizing error handling.
* **Validation Criterion:** With valid API key, `LLMClient().analyze("OpenAI launches GPT-5")` returns validated `AnalysisReport`. Without key, raises `LLMClientError`.

### Step 4.4: Demo Mode with Mocked Response — ⏳ Pending
* **Description:** Add `--demo` CLI flag bypassing network API call and returning pre-filled mock `AnalysisReport`. Enables testing full pipeline (ingestion → formatting → display) without spending API credits.
* **Key Concept:** Decoupled Development — testing end-to-end pipeline without external dependencies accelerates iteration and reduces cost.
* **Validation Criterion:** `make run ARGS="scan 'test' --demo"` renders full report with zero network calls.

---

## Phase 5: FinOps Cost Calculator — ⏳ Pending
*Goal: Measure and calculate exact financial cost of each API inference (FS-03).*

### Step 5.1: Model Pricing Matrix & Cost Calculator — ⏳ Pending
* **Description:** Implement model pricing dictionary (input/output price per million tokens) in `utils/cost.py` and function `calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float` returning cost in USD.
* **Key Concept:** FinOps Observability — tracking direct marginal API costs in real time to prevent budget drift.
* **Validation Criterion:** `calculate_cost("gpt-4o-mini", prompt_tokens=1000, completion_tokens=500)` returns accurate USD value based on public rates. Unknown model raises explicit exception.

### Step 5.2: Metrics Injection into Report — ⏳ Pending
* **Description:** Enhance `LLMClient.analyze()` to time API call (`time.perf_counter()`), extract token usage (`usage.prompt_tokens`, `usage.completion_tokens`), compute cost via `cost.py`, and populate fields in `AnalysisReport`.
* **Key Concept:** Transparent Instrumentation — metrics collected at caller level without adding overhead to core logic.
* **Validation Criterion:** Returned report contains non-zero values for `prompt_tokens`, `completion_tokens`, `estimated_cost_usd`, and `execution_time_seconds`.

---

## Phase 6: Rich Terminal UI & Output Formats — ⏳ Pending
*Goal: Deliver premium console user experience with rich visual formatting (FS-04).*

### Step 6.1: Markdown Rendered Panel — ⏳ Pending
* **Description:** Implement `display_report(report: AnalysisReport) -> None` in `formatters/console.py` rendering summary inside styled Rich panel: colored title, Markdown summary, bulleted key points, color-coded impacts and recommendations (green for `low`, yellow for `medium`, red for `high`).
* **Key Concept:** Terminal UX — well-formatted output improves readability and developer tool adoption.
* **Validation Criterion:** `--demo` execution displays styled, color-coded panel in terminal.

### Step 6.2: FinOps Metrics Table — ⏳ Pending
* **Description:** Render Rich table below main panel summarizing inference metrics: model used, prompt/completion tokens, USD cost, latency in seconds. Color-code cost (green < $0.01, yellow < $0.05, red above).
* **Key Concept:** Instant Visual Reporting — developer immediately sees economic impact of query.
* **Validation Criterion:** Metrics table displays cleanly with aligned, color-coded numbers.

### Step 6.3: Export Formats (`--output`) — ⏳ Pending
* **Description:** Implement export options in `formatters/`: `console` (default Rich UI), `json` (`AnalysisReport.model_dump_json(indent=2)` to stdout), `markdown` (file export via `formatters/markdown.py`). Configurable via `--output / -o`.
* **Key Concept:** Format Interoperability — JSON output enables CI/CD integration; Markdown enables report sharing/archiving.
* **Validation Criterion:** `scan "test" --demo -o json` outputs valid parseable JSON. `scan "test" --demo -o report.md` writes readable Markdown file.

---

## Phase 7: Local Caching System — ⏳ Pending
*Goal: Eliminate redundant API calls for identical content and reduce costs (FS-05).*

### Step 7.1: SHA-256 Content Hash Persistence — ⏳ Pending
* **Description:** Implement caching system in `utils/cache.py` based on SHA-256 hash of extracted content. Store reports in local JSON file (`~/.cache/ai_watcher/cache.json`). Entry schema: hash, creation timestamp, TTL, serialized report.
* **Key Concept:** Idempotency — analyzing identical input produces instant cached result without consuming API credits.
* **Validation Criterion:** First `scan` invocation calls API and saves result. Second identical invocation returns cached report instantly (< 100ms) with `[CACHE HIT]` indicator.

### Step 7.2: Configurable TTL and Cache Invalidation — ⏳ Pending
* **Description:** Add CLI flags `--cache-ttl <seconds>` (default: 3600s) and `--no-cache` (bypasses cache). Implement automatic purging of expired entries on startup.
* **Key Concept:** Data Freshness vs. Cost Efficiency — TTL grants user control over cost/recency trade-offs.
* **Validation Criterion:** `--cache-ttl 0` forces fresh API call every time. `--no-cache` skips reading/writing cache file. Expired entries automatically recalculate.

---

## Phase 8: Network Resilience (Retry & Backoff) — ⏳ Pending
*Goal: Sustain transient API outages without application crashes (ST-04).*

### Step 8.1: Tenacity Decorator with Exponential Backoff — ⏳ Pending
* **Description:** Decorate API call method in `llm_client.py` using `@retry` from Tenacity. Settings: max **4 attempts**, exponential backoff with jitter (2s → 4s → 8s + random variation), handling HTTP 429 (Rate Limit), HTTP 5xx (Server Error), and `ConnectionError`.
* **Key Concept:** Exponential Backoff with Jitter — randomized delay prevents thundering herd problem during service recovery.
* **Validation Criterion:** Simulating 3 initial 429 failures followed by success resolves cleanly. Yellow warning log emitted on each attempt (`⚠️ Retry 2/4 — waiting 4.2s…`).

### Step 8.2: Graceful Failure & Exit Codes — ⏳ Pending
* **Description:** If all retry attempts fail, display clean error message via Rich (red panel), log error, and exit with code `1` without unhandled Python tracebacks.
* **Key Concept:** Fail Gracefully — production applications never expose internal stack traces to end users.
* **Validation Criterion:** Simulating complete network outage displays `❌ Failed after 4 attempts` in red Rich panel and exits with status `1`. Zero tracebacks emitted.

---

## Phase 9: Automated Testing Suite — ⏳ Pending
*Goal: Ensure software quality and regression prevention with ≥ 80% test coverage.*

### Step 9.1: Extractor Unit Tests — ⏳ Pending
* **Description:** Create `tests/unit/test_extractor.py` covering all source types: valid/empty text, existing/missing files, valid/invalid URLs (mocking HTTPX). Verify correct exceptions raised.
* **Key Concept:** Mocked Unit Testing — isolate components from external I/O for fast, deterministic test suites.
* **Validation Criterion:** `make test` completes in < 2 seconds with 100% line coverage on `core/extractor.py`.

### Step 9.2: LLM Client Unit Tests (Mocks) — ⏳ Pending
* **Description:** Create `tests/unit/test_llm_client.py` mocking API responses (success, HTTP 429, timeout, malformed JSON). Test Tenacity retry behavior and Pydantic schema validation.
* **Key Concept:** Mocking External Dependencies — zero real API calls or network reliance during automated test runs.
* **Validation Criterion:** Tests cover success, retry-then-success, and total-failure paths without network traffic.

### Step 9.3: FinOps & Cache Unit Tests — ⏳ Pending
* **Description:** Create `tests/unit/test_cost.py` (pricing calculations) and `tests/unit/test_cache.py` (hit, miss, TTL expiration, `--no-cache` flag). Use Pytest temporary directory fixture (`tmp_path`).
* **Key Concept:** Deterministic Business Logic Verification — financial logic and caching require exhaustive coverage.
* **Validation Criterion:** `make test` achieves 100% coverage on `utils/cost.py` and `utils/cache.py`.

### Step 9.4: End-to-End CLI Integration Testing — ⏳ Pending
* **Description:** Create `tests/integration/test_cli.py` using `typer.testing.CliRunner` to simulate full CLI execution in `--demo` mode. Assert exit codes, expected Rich sections, and export outputs.
* **Key Concept:** End-to-End Integration Testing — verify CLI, extractor, analyzer, and formatter modules function together.
* **Validation Criterion:** `make test` includes 5 integration scenarios covering all source types in demo mode. Total project coverage ≥ 80%.

---

## Phase 10: Containerization & Release — ⏳ Pending
*Goal: Package CLI tool into production-ready Docker container and finalize documentation.*

### Step 10.1: Multi-Stage CLI Dockerfile Adaptation — ⏳ Pending
* **Description:** Adapt inherited Dockerfile: `builder` stage compiles Poetry dependencies; `runtime` stage copies `.venv` and source code. Replace `CMD` with `ENTRYPOINT` (`poetry run python -m src.ai_watcher.main`). Maintain unprivileged non-root user (`appuser`).
* **Key Concept:** CLI vs Server Containers — `ENTRYPOINT` enables running container directly as executable CLI (`docker run ai-watcher scan "..."`).
* **Validation Criterion:** `docker build -t ai-watcher .` produces lightweight image (< 250 MB). `docker run ai-watcher scan "test" --demo` renders full report.

### Step 10.2: Runtime Secrets Injection — ⏳ Pending
* **Description:** Document and implement passing API key via environment variable: `docker run -e OPENAI_API_KEY=sk-... ai-watcher scan "..."`. Ensure key is never baked into image layers.
* **Key Concept:** Dynamic Runtime Secret Injection — zero hardcoded credentials in container images.
* **Validation Criterion:** `docker history ai-watcher` reveals no API keys. Execution without environment variable exits with clear error message.

### Step 10.3: Documentation Finalization & README — ⏳ Pending
* **Description:** Update `README.md` with: project overview, installation (`make install`), CLI usage examples across 3 sources, option flags reference, Docker instructions, and FinOps breakdown. Update ADR logbook with key architectural learnings.
* **Key Concept:** Documentation as Product — clear documentation guarantees usability and adoption.
* **Validation Criterion:** External developer can clone repository, follow README, and execute first scan within 5 minutes.

---

## 📋 Delivery Checklist (Definition of Done)

- [ ] `ruff check .` and `mypy src/ --strict`: **zero** errors
- [ ] `pytest --cov=src`: test coverage ≥ **80%**
- [ ] `detect-secrets`: zero hardcoded secrets in code
- [ ] CLI supports **3 input source types** (text, file, URL)
- [ ] **FinOps** metrics displayed and verified after each analysis
- [ ] **Rich UI** rendering with colored panels and metrics table
- [ ] **Local cache** functional with configurable TTL
- [ ] **Tenacity Retry**: application survives transient network failures gracefully
- [ ] **Docker**: `docker run ai-watcher scan "test" --demo` executes cleanly
- [ ] **README** complete & learning log updated
