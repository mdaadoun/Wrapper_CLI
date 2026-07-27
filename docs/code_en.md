# 📖 Source Code Architecture Reference

This document provides a detailed breakdown of the `Wrapper_CLI` architecture, modules, CLI commands, and build configuration.

---

## 🛠️ 1. Modular Architecture: `src/ai_watcher/`

The application adheres to the **Single Responsibility Principle (SRP)**. The code is organized into clear modules:
- **`main.py`:** Primary entry point (Typer CLI). Handles subcommand routing (e.g., `scan`), positional argument validation (`source`), and mode flags (`--text/-t`, `--file/-f`, `--url/-u`).
  - *`scan()` function:* Receives input source, resolves evaluation mode (auto by default or overridden by flag), and routes payload to the ingestion pipeline.
- **`config.py`:** Configuration and environment variable loading (via `pydantic-settings`).
- **`exceptions.py`:** Definition of custom domain errors (e.g., `AIWatcherError`).
- **`core/`:** Business logic (text extraction, analysis workflows).
- **`clients/`:** LLM client encapsulation (e.g., `httpx` + API calls).
- **`utils/`:** Cross-cutting utilities (cost calculator, caching).
- **`formatters/`:** Rendering components (Rich terminal output, Markdown export).

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
