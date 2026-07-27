# 📌 Session 2.1: Main `scan` Command Implementation with Typer
**Date:** July 27, 2026

This session focuses on developing the primary `scan` command inside `src/ai_watcher/main.py`. The goal is to establish declarative routing for CLI positional arguments and flags to support raw text, file paths, and URLs explicitly or automatically.

---

### 1. 🎓 New Concepts Introduced

*   **Declarative CLI Framework:** A modern command-line construction paradigm (implemented via Typer) where positional arguments, options, types, and `--help` documentation are automatically inferred from Python Type Hints and docstrings.
*   **Positional Argument vs. CLI Option:**
    *   *Positional Argument (`source`):* Required value passed directly without flags.
    *   *CLI Option (`--text / -t`, `--file / -f`, `--url / -u`):* Optional boolean flags enabling manual override of source evaluation mode.

---

### 2. 🧠 Technical Decisions & Trade-offs

#### Dilemma A: Typer Application Structure (Single Command vs. Multi-command Subcommands)
*   **Option A.1: Use Typer in single-command mode (no callback)**
    *   *Cons:* Typer executes the function directly at root (`python main.py "Hello"` instead of `python main.py scan "Hello"`), restricting future extensibility for subcommands (e.g., `history`, `config`, `export`).
*   **Option A.2: Use main `@app.callback()` with `@app.command()` `scan` (Chosen)**
    *   *Why this choice?* Retains the explicit `scan` subcommand keyword while preserving root namespace for future CLI subcommands.

#### Dilemma B: Input Mode Flags (`text`, `file`, `url`)
*   **Option B.1: Require a mandatory mode option (e.g., `scan --mode text "Hello"`)**
    *   *Cons:* Increases friction during daily interactive usage.
*   **Option B.2: Allow default auto-detection overridden by short boolean flags (`-t`, `-f`, `-u`) (Chosen)**
    *   *Why this choice?* Enhances Developer Experience (DX) while enabling unambiguous manual source forcing when needed.

---

### 3. 🛠️ Implementation & Auto-Documentation

Primary CLI module `src/ai_watcher/main.py` incorporates the `scan` subcommand:

```python
@app.command()
def scan(
    source: str = typer.Argument(..., help="Source to scan: raw text, file path, or URL."),
    text: bool = typer.Option(False, "--text", "-t", help="Force source mode to raw text."),
    file: bool = typer.Option(False, "--file", "-f", help="Force source mode to file path."),
    url: bool = typer.Option(False, "--url", "-u", help="Force source mode to web URL."),
) -> None:
    ...
```

#### Validation Commands:
```bash
poetry run python -m src.ai_watcher.main scan "Hello World"
make run ARGS="scan --help"
```

---

#### Added Tests

*   `tests/test_cli.py`: Added 5 unit tests validating:
    - Root CLI help rendering.
    - `scan` command help output.
    - Default auto-mode resolution.
    - Explicit short & long flags (`-t`, `--file`, `-u`).

---

### 4. 📌 Daily Summary

1.  **`scan` Command Operational:** Supports positional `source` argument and flags (`-t`, `-f`, `-u`).
2.  **Typer Help Automation:** `--help` renders clean option descriptions and flags.
3.  **Test Suite Passing:** 9 unit tests passed with 97.83% coverage.
