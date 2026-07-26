# 🗺️ Detailed Step-by-Step Roadmap: AI Watcher CLI Wrapper

This roadmap outlines the chronological implementation steps for **Project 3: Automated AI Watcher CLI Wrapper**, including theoretical concepts, progress tracking, and validation criteria for each step.

**Base:** Engineering stack inherited from Project 2 (AIPE Framework: Poetry, Pre-commit, Ruff, Mypy, Pytest, Multi-stage Docker, Makefile).

---

## 📊 Phase Overview Dashboard

```text
Phase 1: Baseline Setup ──> Phase 2: CLI Skeleton ──> Phase 3: Ingestion ──> Phase 4: LLM Client ──> Phase 5: FinOps ──> Phase 6: Rich UI ──> Phase 7: Cache ──> Phase 8: Resilience ──> Phase 9: Testing ──> Phase 10: Docker & Release
     (⏳ Pending)                (⏳ Pending)            (⏳ Pending)          (⏳ Pending)         (⏳ Pending)      (⏳ Pending)       (⏳ Pending)      (⏳ Pending)        (⏳ Pending)       (⏳ Pending)
```

---

## Phase 1: Technical Baseline Adaptation — ⏳ Pending
*Goal: Adapt inherited AIPE blueprint into a standalone CLI project with required dependencies.*

### Step 1.1: Inherited Code Cleanup — ⏳ Pending
* **Description:** Remove Project 2 specific code (FastAPI routes in `src/`, AIPE framework tests, Flask dashboard). Keep core infrastructure: `pyproject.toml`, `.pre-commit-config.yaml`, `Makefile`, `Dockerfile`, `.gitignore`, `.vscode/`.
* **Key Concept:** Engineering blueprint reuse — adapt proven baseline rather than starting from scratch.
* **Validation Criterion:** `src/` empty (except `__init__.py`), `tests/` empty, `make lint` executes cleanly.

### Step 1.2: Poetry Dependencies Update — ⏳ Pending
* **Description:** Update `pyproject.toml`: replace production web dependencies (FastAPI, Uvicorn) with CLI tools (`typer[all]`, `rich`, `httpx`, `beautifulsoup4`, `tenacity`, `python-dotenv`). Keep Pydantic V2. Regenerate lockfile via `poetry lock && poetry install`.
* **Key Concept:** Declarative dependency management — single source of truth in `pyproject.toml`.
* **Validation Criterion:** `poetry install` succeeds and `poetry run python -c "import typer; import rich; import httpx"` passes.

### Step 1.3: Modular Directory Structure — ⏳ Pending
* **Description:** Establish package structure matching specifications:
    ```
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
* **Key Concept:** Single Responsibility Principle (SRP) modular architecture.
* **Validation Criterion:** All `__init__.py` files present, `make lint` passes, `from src.ai_watcher import main` succeeds.

### Step 1.4: Secrets & Environment Configuration — ⏳ Pending
* **Description:** Create `.env.example` with expected variables (`OPENAI_API_KEY`, `MODEL_NAME`, `MAX_TOKENS`). Implement `config.py` with `pydantic-settings` to load and validate variables. Ensure `.env` is in `.gitignore`.
* **Key Concept:** Strict code/configuration separation (12-Factor App) and secret leak prevention.
* **Validation Criterion:** Launching without `.env` raises an explicit error; `detect-secrets` pre-commit hook blocks hardcoded keys.

### Step 1.5: Makefile Adaptation — ⏳ Pending
* **Description:** Update Makefile targets for CLI context: replace `make dev` with `make run` executing the primary CLI command. Add `make run ARGS="--help"` shortcut.
* **Key Concept:** Unified command interface.
* **Validation Criterion:** `make run ARGS="--help"` renders Typer help menu without errors.

---

## Phase 2: CLI Skeleton with Typer — ⏳ Pending
*Goal: Create functional CLI entrypoint with argument parsing and routing.*
