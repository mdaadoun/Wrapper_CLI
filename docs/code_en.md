# 📖 Source Code Architecture Reference

This document provides a detailed breakdown of the `Wrapper_CLI` architecture, modules, CLI commands, and build configuration.

---

## 🛠️ 1. Modular Architecture: `src/ai_watcher/`

The application adheres to the **Single Responsibility Principle (SRP)**. The code is organized into clear modules:
- **`main.py`:** Primary entry point (Typer CLI). Handles subcommand routing (e.g., `scan`), positional argument validation (`source`), mode flags (`--text/-t`, `--file/-f`, `--url/-u`), output format flags (`--output/-o`), and demo mode flag (`--demo/-d`).
  - *`scan()` function:* Receives input source, resolves evaluation mode (auto by default or overridden by flag), routes payload to the ingestion pipeline, initializes `LLMClient` (live or demo mode), and renders output via `display_report()`, stdout JSON, or exports to `.md`/`.json` file destinations using `export_markdown()`.
- **`config.py`:** Configuration and environment variable loading (via `pydantic-settings`).
- **`exceptions.py`:** Definition of custom domain errors built on a granular **Exception Hierarchy** (`WatcherError` as base, extended by `EmptySourceError`, `ExtractionError`, `LLMClientError`, `ConfigurationError`, `UnknownModelError`, `ExportError`). This allows for targeted error handling and user-friendly messages without crashing the interpreter.
- **`core/`:** Business logic components.
  - **`detector.py`:** Deterministic source type inference
  - **`extractor.py`:** Pure functions for parsing and normalizing raw strings, reading strictly validated `.txt`/`.md` files, and scraping/cleaning URLs with `httpx` and `BeautifulSoup4`. (`SourceType.URL`, `SourceType.FILE`, `SourceType.TEXT`) and `EmptySourceError` validation.
    - **`extract_from_text(raw: str) -> str`:** Pure function — normalizes whitespace (collapses multiple spaces/tabs, strips empty lines).
    - **`extract_from_file(path: Path) -> str`:** I/O function — validates file existence, extension (`.txt`/`.md`), reads content, delegates to `extract_from_text`.
    - **`extract_from_url(url: str) -> str`:** I/O function — fetches via HTTPX, strips noisy HTML tags (script, style, nav, footer, header, aside) via BeautifulSoup4, normalizes whitespace.
    - **`ExtractedContent` (Pydantic model):** Validates output with `Field(min_length=1)` on `text`, `ge=1` on `char_count`. Classmethod `from_text()` raises `EmptySourceError` if cleaned content is empty.
    - **`extract(source: str, source_type: SourceType) -> str` (Facade):** Dispatches to the correct extractor based on `SourceType` enum, then validates output through `ExtractedContent.from_text()`. This is the single public entry point for the ingestion pipeline, used by `main.py` and test mocks.
- **`schemas/`:** Strictly typed data contracts for domain entities and LLM structured outputs.
  - **`report.py` (`AnalysisReport`):** Pydantic V2 immutable data model (`ConfigDict(frozen=True)`). Defines context (`source`, `analyzed_at`, `model_used`), analysis deliverables (`title`, `summary`, `key_points`, `impact_technical`, `impact_business`, `impact_regulatory`, `recommendation`, `priority`), and FinOps telemetry (`prompt_tokens`, `completion_tokens`, `total_tokens`, `estimated_cost_usd`, `execution_time_seconds`, `is_cached`). Includes `@model_validator(mode="before")` for auto-calculating `total_tokens`.
- **`clients/`:** LLM client encapsulation and prompt engineering.
  - **`llm_client.py` (`LLMClient`, `get_mock_analysis_report`):** Base LLM API client encapsulating HTTPX REST interactions with Google Gemini and OpenAI formats. Method `analyze(content: str, source: str, demo: bool) -> AnalysisReport` handles request payload construction, timing via `time.perf_counter()`, JSON markdown fence stripping (`_clean_json_text()`), response parsing (`_parse_response()`), and FinOps telemetry injection. Supports `demo_mode=True` and helper `get_mock_analysis_report()` to short-circuit REST requests and return a realistic mock `AnalysisReport` for zero-cost offline testing without an API key.
  - **`prompts.py` (`SYSTEM_PROMPT`, `SAMPLE_ANALYSIS_REPORT_JSON`):** System prompt engineering module. Defines Senior AI Analyst persona, strict output constraints (pure JSON, max 200 words summary, 3 to 5 key points, priority enum `"low"`|`"medium"`|`"high"`), and expected `AnalysisReport` JSON schema. Includes a validated raw sample JSON string and helper `validate_sample_report()` that wraps Pydantic validation errors in domain `WatcherError`.
- **`utils/`:** Cross-cutting utilities (cost calculator, caching).
  - **`cost.py` (`calculate_cost`, `MODEL_PRICING`):** FinOps pure function computing USD cost per inference. Uses a 40-model pricing matrix (USD per 1M tokens) across 8 providers (OpenAI, Google, Anthropic, Meta, Mistral, DeepSeek, Cohere, Amazon). Raises `UnknownModelError` for unknown models. Case-insensitive lookup. Cost rounded to 6 decimal places.
- **`formatters/`:** Output formatting and file export modules.
  - **`console.py` (`display_report`, `PRIORITY_COLORS`):** Console formatting module rendering structured `AnalysisReport` deliverables inside a styled Rich Panel. Features Rich Markdown rendering for executive summary, bulleted list for key points, dynamic color themes (`green`, `yellow`, `red`) based on priority levels (`low`, `medium`, `high`), and a dedicated Rich Table summarizing FinOps inference metrics (model, prompt/completion/total tokens, latency, and threshold-based color-coded USD cost).
  - **`markdown.py` (`render_markdown_report`, `export_markdown`):** Markdown document generator and file exporter. Converts `AnalysisReport` instance into a formatted Markdown string (with metadata, summary, bulleted key points, impacts, and FinOps metrics table) and writes to disk, handling file I/O errors by wrapping `OSError` in `ExportError`.


---

## 📦 2. Project Manifest & Environment: `pyproject.toml` and `.env.example`

- **`pyproject.toml`:** Centralized project declaration using Poetry. Defines CLI dependencies, QA tooling (`pytest`, `ruff`, `mypy`, `pre-commit`, `detect-secrets`), and strict linter configurations.
- **`.env.example`:** Configuration template detailing required variables (like `GEMINI_API_KEY`) according to the 12-Factor App methodology.

---

## 🛠️ 3. Task Automation: `Makefile`

- **Purpose:** Provides a unified command-line interface (`make install`, `make lint`, `make test`, `make docker-build`, `make onboarding-check`).

---

## 🐳 4. Containerization & Security: `Dockerfile`

- **Purpose:** Production multi-stage Docker build producing an unprivileged, non-root runtime container image (< 250 MB).

---

## 🔐 5. Quality Gatekeeping: `.pre-commit-config.yaml`

- **Purpose:** Configures local git pre-commit hooks to enforce code quality, static typing, and secret scanning before commits.

---

## 🚀 6. Onboarding Automation: `scripts/simulate_onboarding.sh`

- **Purpose:** Automated E2E verification script that validates zero-setup friction onboarding in under 300 seconds.

---

## ⚙️ 7. IDE Workspace & Extension Recommendations: `.vscode/`

- **Purpose:** Configures workspace settings (`.vscode/settings.json`) and extension recommendations (`.vscode/extensions.json`).
- **Key Concepts:**
  - **`extensions.json`:** Automatically prompts developers opening the workspace to install `charliermarsh.ruff` (linter/formatter) and `ms-python.python` (interpreter & debugging).
  - **`settings.json`:** Aligns local IDE behavior with CI/CD checks by enabling format-on-save via Ruff (`editor.formatOnSave`: `true`), auto-fixing lint errors and imports on save (`source.fixAll`, `source.organizeImports`), and setting `files.insertFinalNewline` & `files.trimTrailingWhitespace`.

---

## 🧪 8. Initial Validation: `tests/test_core.py`

- **Purpose:** A baseline test module allowing `pytest` to execute successfully on a newly initialized (or cleaned up) codebase.
- **Concept:** Prevents "no tests ran" errors (exit code 5) during automated `Makefile` checks in the initial setup phase.
