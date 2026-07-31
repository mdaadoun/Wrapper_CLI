# 📖 Source Code Architecture Reference

This document provides a detailed breakdown of the `Wrapper_CLI` architecture, modules, CLI commands, and build configuration.

---

## 🛠️ 1. Modular Architecture: `src/ai_watcher/`

The application adheres to the **Single Responsibility Principle (SRP)**. The code is organized into clear modules:
- **`main.py`:** Primary entry point (Typer CLI). Handles subcommand routing (e.g., `scan`), positional argument validation (`source`), mode flags (`--text/-t`, `--file/-f`, `--url/-u`), output format flags (`--output/-o`), demo mode flag (`--demo/-d`), cache expiration TTL flag (`--cache-ttl`), and cache bypass flag (`--no-cache`).
  - *`scan()` function:* Receives input source, resolves evaluation mode (auto by default or overridden by flag), routes payload to the ingestion pipeline, manages local cache lookup and persistence (supporting `--cache-ttl` and `--no-cache`), initializes `LLMClient` (live or demo mode), and renders output via `display_report()`, stdout JSON, or exports to `.md`/`.json` file destinations using `export_markdown()`.
- **`config.py`:** Configuration and environment variable loading (via `pydantic-settings`). Sets default behavior parameters such as `max_retries=4` and `cache_ttl_seconds=3600`.
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
  - **`cache.py` (`ContentCache`, `compute_content_hash`):** SHA-256 content hashing and disk-backed local JSON caching module (`~/.cache/ai_watcher/cache.json`). Manages cache retrieval with dynamic/custom TTL evaluation, automatic purging of expired entries on startup via `purge_expired()`, serialization of `AnalysisReport` with `is_cached=True`, atomic cache persistence, and purging.
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


### Network Resilience (`llm_client.py` & `exceptions.py`)

- **`LLMRetryableError`**: Custom domain exception inheriting from LLMClientError representing transient, retryable API or network failures.
- **`_log_retry_attempt`**: Tenacity before_sleep callback function rendering yellow warning console logs with next attempt number and backoff sleep duration.
- **`LLMClient._post_with_retry`**: Internal helper method decorated with @retry(stop=stop_after_attempt(4), wait=wait_exponential_jitter(initial=2, max=10), reraise=True) executing client.post and evaluating status codes.
- **`LLMClient.analyze`**: Public entrypoint method invoking _post_with_retry within a try-finally block, ensuring proper client session cleanup and response parsing.


### Graceful Failure & Exit Codes (`console.py`, `main.py`, `test_graceful_failure.py`)

- **`display_error`**: Formatter helper in `formatters/console.py` rendering domain exception messages inside a red Rich `Panel` targeting `stderr`.
- **`scan` Error Catching**: Entrypoint error orchestration in `main.py` catching `WatcherError` and generic `Exception`, rendering via `display_error`, and raising `typer.Exit(code=1)`.
- **`test_graceful_failure.py`**: Unit test suite validating red panel rendering, 4-attempt network outage simulations, domain error exit status `1`, and zero unhandled tracebacks.


### Extractor Unit Tests (`core/extractor.py` & `tests/test_extractor.py`)

- **`test_extract_from_file_read_error`**: Validates that I/O read exceptions on local files raise domain `ExtractionError`.
- **`test_ssrf_transport_no_hostname`**: Verifies that requests lacking a valid URL host trigger `ExtractionError` inside `_SSRFSafeTransport`.
- **`test_extract_from_url_redirect_missing_location`**: Asserts that HTTP 301/302 responses lacking a `Location` header raise `ExtractionError`.
- **`test_extract_from_url_redirect_invalid_hostname`**: Ensures redirect target URLs with missing or unparseable hostnames raise `ExtractionError`.
- **`test_extract_facade_invalid_source_type`**: Confirms that unsupported source types passed to the `extract()` facade trigger defensive `ExtractionError` handling.


### LLM Client Unit Tests (Mocks) (`clients/llm_client.py` & `tests/test_llm_client.py`)

- **`test_llm_client_successful_analysis_gemini_format`**: Validates parsing of standard 200 OK Gemini REST API payload into `AnalysisReport` with accurate token counts and FinOps cost estimation.
- **`test_llm_client_successful_analysis_openai_format`**: Validates fallback parsing of OpenAI format response choices and usage metadata.
- **`test_llm_client_retry_success_after_initial_failures`**: Mocks 3 consecutive 429 rate limit responses followed by 200 OK, verifying 4 HTTP attempts and 3 backoff sleep cycles.
- **`test_llm_client_retry_exhausted_max_attempts`**: Mocks 4 consecutive 503 server errors, asserting `LLMRetryableError` is raised with `"❌ Failed after 4 attempts"` prefix.
- **`test_llm_client_default_httpx_client_creation_and_close`**: Verifies that un-injected `LLMClient` instantiates a default `httpx.Client` and properly calls `close()` in the `finally` block.
- **`test_llm_client_clean_json_text_utility`**: Validates helper logic stripping markdown code blocks surrounding JSON strings (` ```json ... ``` `).


### FinOps & Cache Unit Tests (`utils/cost.py`, `utils/cache.py`, `tests/test_cost.py`, `tests/test_cache.py`)

- **`test_calculate_cost_known_models`**: Verifies accurate USD cost computation across multi-provider models (GPT-4o mini, Gemini 1.5 Flash, Claude 3.5 Sonnet) per 1M tokens with 6-decimal rounding.
- **`test_calculate_cost_unknown_model_raises`**: Confirms that unrecognized model names raise `UnknownModelError` listing supported models without silent fallback.
- **`test_pricing_matrix_integrity`**: Asserts all 40+ models in `MODEL_PRICING` have positive rates and output rates $\ge$ input rates.
- **`test_cache_set_and_get`**: Validates report serialization into local JSON cache by SHA-256 content hash with `is_cached=True` flag restoration.
- **`test_cache_expired_ttl_and_purge`**: Verifies entry expiration past TTL and automated cleanup of expired entries via `purge_expired()` and startup `auto_purge`.
- **`test_cache_zero_ttl_and_no_cache_flag`**: Ensures `--cache-ttl 0` and `--no-cache` CLI options force fresh analysis and bypass cache storage.
- **`test_cache_resilience_corrupted_json_and_os_errors`**: Validates graceful handling of corrupted JSON files and disk write/delete `OSError` exceptions.


### End-to-End CLI Integration Tests (`tests/integration/test_cli.py` & Dashboard API Routes)

- **`test_e2e_scan_text_demo_mode`**: Executes complete CLI pipeline scanning raw text in demo mode, asserting exit code 0 and verifying rendering of Rich console panels (Executive Summary, Key Points, FinOps Metrics).
- **`test_e2e_scan_file_demo_mode`**: Validates end-to-end file reading, content extraction, and demo mode analysis via `tmp_path` markdown file fixtures.
- **`test_e2e_scan_url_demo_mode`**: Tests URL source detection and pipeline execution with mocked HTTP web scraping transport.
- **`test_e2e_scan_json_export`**: Asserts `--output custom.json` CLI export writes a valid JSON file to disk containing `source`, `summary`, `key_points`, and FinOps metadata fields.
- **`test_e2e_scan_markdown_export`**: Validates `--output custom.md` CLI export generates a structured Markdown document starting with `# [DEMO] Synthetic AI Tech Radar Report` and all section headers.
- **`test_e2e_scan_cache_flow_and_bypass`**: Tests end-to-end local caching flow verifying cache miss on initial run, `[CACHE HIT]` notice on repeat execution, and cache bypass when passing `--no-cache`.
- **`test_e2e_scan_invalid_source_error`**: Ensures whitespace inputs or non-existent files exit with status `1` and clean domain error formatting without tracebacks.
- **`dashboard/src/app/api/tests/list/route.ts` & `run-tests/route.ts`**: Updated API routes with recursive file discovery and path validation supporting nested test suites like `tests/integration/test_cli.py`.


### Multi-Stage CLI Containerization (`Dockerfile` & `tests/test_dockerfile.py`)

- **`Dockerfile`**: Multi-stage production container setup. Builder stage compiles dependencies using Poetry (`poetry install --only main --no-root`). Runtime stage copies `.venv` and `src/` to a clean `python:3.10-slim` image, configures `PATH` and `PYTHONPATH`, enforces unprivileged execution under `appuser:appgroup`, and sets `ENTRYPOINT ["python", "-m", "src.ai_watcher.main"]` with default `CMD ["scan", "--help"]`.
- **`tests/test_dockerfile.py`**: Unit test suite validating containerization configuration:
  - **`test_dockerfile_exists_and_non_empty`**: Asserts `Dockerfile` exists at project root and is non-empty.
  - **`test_dockerfile_multi_stage_structure`**: Verifies multi-stage `builder` and `runtime` `FROM python:3.10-slim` statements.
  - **`test_dockerfile_cli_entrypoint_configuration`**: Ensures `ENTRYPOINT` points to main CLI module, default `CMD` provides help args, and server directives (`uvicorn`, `EXPOSE`, `HEALTHCHECK`) are stripped.
  - **`test_dockerfile_security_non_root_user`**: Confirms creation of system user `appuser` (UID 1000) / `appgroup` and `USER appuser` context switch with `--chown`.
  - **`test_dockerignore_exclusions`**: Validates exclusion of `.venv/`, `tests/`, `dashboard/`, `docs/`, and `.git/`.
  - **`test_makefile_docker_build_target`**: Verifies `Makefile` contains `docker-build` target executing `docker build -t`.


### Runtime Secrets Injection (`src/ai_watcher/config.py` & `tests/test_secrets_injection.py`)

- **`src/ai_watcher/config.py`**: Configured `Settings` class inheriting from Pydantic `BaseSettings` with `AliasChoices` (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `AI_WATCHER_API_KEY`) enabling dynamic runtime credential injection (`docker run -e OPENAI_API_KEY=sk-...`). Enforces zero hardcoded credentials in container layers or codebase files. `get_settings()` raises `ConfigurationError` when no API key environment variable is set.
- **`tests/test_secrets_injection.py`**: Unit test suite for Step 10.2 runtime secret injection:
  - **`test_runtime_secrets_gemini_api_key`**: Verifies dynamic resolution of `GEMINI_API_KEY` environment variable.
  - **`test_runtime_secrets_openai_api_key_alias`**: Validates `OPENAI_API_KEY` alias fallback support.
  - **`test_runtime_secrets_missing_key_raises_error`**: Asserts `ConfigurationError` when no API key env var is present.
  - **`test_cli_execution_without_env_var_exits_cleanly`**: Ensures CLI scan without env var exits with code 1, renders red Rich error panel, and hides Python tracebacks.
  - **`test_cli_execution_with_runtime_injected_openai_key`**: Validates full scan pipeline execution with runtime injected `OPENAI_API_KEY`.


### Documentation Finalization & Integrity Verification (`src/ai_watcher/utils/docs.py` & `tests/test_docs.py`)

- **`src/ai_watcher/utils/docs.py`**: Utility module providing project metadata, structured CLI usage references across 3 input sources (raw text, local file, web URL), option flag tables, Docker commands, and automated documentation integrity verification:
  - **`get_project_metadata()`**: Returns central project metadata (name, version, description, phase, license).
  - **`get_cli_usage_doc()`**: Returns structured dictionary containing CLI flags, Docker commands, and 3-source usage examples.
  - **`verify_docs_integrity()`**: Scans repository root and `docs/` directory to verify presence and non-emptiness of all required documentation files (`README.md`, `README_fr.md`, specification, roadmap, glossary, questions, code docs).
- **`tests/test_docs.py`**: Unit test suite for Step 10.3 documentation finalization:
  - **`test_project_metadata()`**: Validates structure and non-empty values of project metadata.
  - **`test_cli_usage_doc()`**: Asserts presence of usage examples for 3 input sources and option flags reference.
  - **`test_verify_docs_integrity()`**: Ensures all required project documentation files exist on disk.
  - **`test_readme_sections()`**: Validates that `README.md` contains all required sections (Features, Usage, Flags, Docker, FinOps, Quickstart).
