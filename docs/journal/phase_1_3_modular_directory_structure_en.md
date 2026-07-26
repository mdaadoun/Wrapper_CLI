# 📌 Session 1.3: Modular Directory Structure
**Date:** July 26, 2026

The goal of this session is to establish a clean and modular Python package structure (`src/ai_watcher/`), strictly adhering to the Single Responsibility Principle (SRP). The architecture clearly separates the CLI interface, configuration, business logic, and network access.

---

### 1. 🎓 New Concepts Introduced

*   **Single Responsibility Principle (SRP):** A software design principle (the "S" in SOLID) stating that every class, module, or function should have only one reason to change. Here, the formatting logic is separated from the extraction logic, which is itself separated from the API client management.
*   **Domain Exceptions:** The practice of defining custom exception classes (e.g., `AIWatcherError`, `ExtractionError`) specific to the application's business domain, rather than raising generic Python errors (`ValueError` or `Exception`).

---

### 2. 🧠 Decisions & Technical Choices

#### Dilemma A: Project Architecture (Monolithic vs. Modular)
*   **Option A.1: A single file (`main.py`)**
    *   *Pros/Cons:* Fast to write for a simple script, but becomes impossible to maintain, unit test, and read once the project exceeds a few hundred lines.
*   **Option A.2: Modular package structure according to specifications (Chosen)**
    *   *Why this choice?* By dividing into subdirectories (`core/`, `clients/`, `utils/`, `formatters/`), each component becomes isolatable and testable independently. This prepares the project to scale healthily while remaining comprehensible for new contributors.

---

### 3. 🛠️ Implementation & Auto-Documentation

The following directory structure was created within `src/ai_watcher/`:
*   `__init__.py`: Python package marker.
*   `main.py`: CLI interface entry point (Typer).
*   `config.py`: Configuration loading via `pydantic-settings` and `.env`.
*   `exceptions.py`: Custom domain exceptions.
*   `core/`: Business logic (extraction, analysis).
*   `clients/`: Encapsulated LLM client.
*   `utils/`: Cross-cutting utilities (cost calculator, caching).
*   `formatters/`: Markdown and terminal rendering (Rich).

#### Validation commands to run locally:
```bash
poetry run ruff check --fix .
poetry run ruff format .
make lint
poetry run python -c "from src.ai_watcher import main"
```
*The linter and formatter ensure the new files adhere to standards (e.g., auto-sorting imports). Importing `main` verifies that the Python package structure is fundamentally correct and accessible.*

---

#### Added tests

*   No specific tests were added here; the empty structure is validated via strict static analysis (`make lint`).

### 4. 📌 Daily Summary

1.  **Architecture skeleton created**: Key modules are instantiated with their `__init__.py` files.
2.  **Functional entrypoint**: `main.py` initializes the Typer application.
3.  **Pipeline validation**: The linter and Python interpreter validate the directory tree without errors.
