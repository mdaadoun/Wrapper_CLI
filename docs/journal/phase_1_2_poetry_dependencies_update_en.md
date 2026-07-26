# 📌 Session 1.2: Poetry Dependencies Update
**Date:** July 26, 2026

The goal of this session is to adapt the project dependencies from a web baseline (FastAPI) to a Command Line Interface (CLI) application. The objective is to rely on dedicated libraries such as Typer, Rich, HTTPX, BeautifulSoup4, and Tenacity, while retaining Pydantic V2, through a declarative approach.

---

### 1. 🎓 New Concepts Introduced

*   **Declarative Dependency Management:** An approach to dependency management where the desired state of the project (libraries and required versions) is declared in a single file (here `pyproject.toml`). It acts as the single source of truth, unlike manual installations or imperative scripts. The tool (Poetry) is responsible for resolving and installing the dependency tree.

---

### 2. 🧠 Decisions & Technical Choices

#### Dilemma A: Choice of libraries for the CLI interface
*   **Option A.1: Use native `argparse` and standard `print()` statements**
    *   *Pros/Cons:* Zero external dependencies, but the code becomes highly verbose (lots of boilerplate to parse arguments), and the user interface lacks visual appeal.
*   **Option A.2: Use Typer and Rich (Chosen)**
    *   *Why this choice?* Typer leverages Python type hints to automatically generate argument validation and help text, resulting in highly readable and robust code. Rich brings advanced terminal formatting features (colors, progress bars, tables) essential for a premium user experience.

#### Dilemma B: HTTP tool for web scraping and API calls
*   **Option B.1: Keep `requests` (De facto standard)**
    *   *Pros/Cons:* Extremely popular but synchronous by default and less optimized for modern async requests if the need arises.
*   **Option B.2: Adopt `httpx` (Chosen)**
    *   *Why this choice?* `httpx` offers a `requests`-compatible API while natively supporting asynchronous networking (HTTP/2, async/await). It's a more robust and modern choice for interacting with AI APIs that may have variable latencies.

---

### 3. 🛠️ Implementation & Auto-Documentation

The production dependencies `fastapi` and `uvicorn` were removed, and the following libraries were added to the `pyproject.toml` file:
*   `typer[all]`: For building the CLI.
*   `rich`: For the terminal UI.
*   `httpx`: For network requests.
*   `beautifulsoup4`: For HTML scraping and parsing.
*   `tenacity`: For resilience (exponential backoff).
*   `python-dotenv`: For environment variable management.

#### Configuration File:
```toml
# pyproject.toml
[tool.poetry.dependencies]
python = "^3.10"
pydantic = "^2.6.4"
typer = {extras = ["all"], version = "^0.12.3"}
rich = "^13.7.1"
httpx = "^0.27.0"
beautifulsoup4 = "^4.12.3"
tenacity = "^8.2.3"
python-dotenv = "^1.0.1"
```

#### Validation commands to run locally:
```bash
poetry lock
poetry install
poetry run python -c "import typer; import rich; import httpx"
```
*These commands regenerate the `poetry.lock` file to guarantee deterministic installation, install the environment, and then verify that the critical modules are importable.*

---

#### Added tests

*   No specific tests added at this stage; validation is achieved through the dependency import check.

### 4. 📌 Daily Summary

1.  **Configuration file updated**: `pyproject.toml` reflects the shift in scope (from Web to CLI).
2.  **Lockfile generated**: `poetry.lock` was deterministically updated.
3.  **Environment validation**: Critical dependencies (Typer, Rich, HTTPX) import without errors, confirming the virtual environment is ready.
