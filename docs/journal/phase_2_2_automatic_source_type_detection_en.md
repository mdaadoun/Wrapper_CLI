# 📌 Session 2.2: Automatic Source Type Detection & User Ergonomics
**Date:** July 27, 2026

This session focuses on implementing automatic source type detection (`URL`, `FILE`, `TEXT`) and enforcing strict empty input handling via `EmptySourceError`.

---

### 1. 🎓 New Concepts Introduced

*   **User Ergonomics / Developer Experience (DX):** Design principle aimed at eliminating cognitive load and usage friction by automatically inferring user intent (URL, file path, or raw text) without requiring explicit flags for common use cases.
*   **Fail-Fast Input Validation:** Early validation strategy that immediately rejects invalid inputs (empty or whitespace-only strings) with a clean termination (Exit Code 1) before triggering heavy operations (I/O, network requests).

---

### 2. 🧠 Technical Decisions & Trade-offs

#### Dilemma A: Location of Source Detection Logic
*   **Option A.1: Place all if/else branching inside `scan()` in `main.py`**
    *   *Cons:* Violates Single Responsibility Principle (SRP) by mixing CLI routing with core business logic. Makes source detection harder to unit test independently.
*   **Option A.2: Encapsulate in `src/ai_watcher/core/detector.py` (Chosen)**
    *   *Why this choice?* Isolates pure function `detect_source_type()` and `SourceType` Enum, enabling comprehensive unit testing decoupled from the Typer framework.

#### Dilemma B: Heuristic Detection Order
*   **Option B.1: Complex regular expression parsing**
    *   *Cons:* Added complexity, potential false positives on relative file paths, and slower inference.
*   **Option B.2: Sequential evaluation (`startswith("http")` -> `Path.exists()` -> `TEXT`) (Chosen)**
    *   *Why this choice?* Deterministic and performant:
        1. If string starts with `http://` or `https://` -> `SourceType.URL`.
        2. If path exists on filesystem and is a file (`Path.is_file()`) -> `SourceType.FILE`.
        3. Otherwise -> `SourceType.TEXT`.

---

### 3. 🛠️ Implementation & Auto-Documentation

Module `src/ai_watcher/core/detector.py`:

```python
def detect_source_type(
    source: str,
    force_text: bool = False,
    force_file: bool = False,
    force_url: bool = False,
) -> SourceType:
    if not source or not source.strip():
        raise EmptySourceError("Source cannot be empty or whitespace-only.")
    ...
```

Exception handling in `src/ai_watcher/main.py`:

```python
try:
    source_type = detect_source_type(source, text, file, url)
    typer.echo(f"Scanning source [{source_type.value} mode]: {source}")
except AIWatcherError as err:
    typer.secho(f"Error: {err}", fg=typer.colors.RED, err=True)
    raise typer.Exit(code=1) from err
```

#### Validation Commands:
```bash
poetry run python -m src.ai_watcher.main scan "https://example.com"
poetry run python -m src.ai_watcher.main scan "pyproject.toml"
poetry run python -m src.ai_watcher.main scan "Raw text payload"
poetry run python -m src.ai_watcher.main scan ""
```
*The empty string invocation must output `Error: Source cannot be empty or whitespace-only.` with Exit Code 1.*

---

#### Added Tests

*   `tests/test_detector.py`: Unit tests for `detect_source_type()` covering URLs, local file paths (using `tmp_path`), raw text, forced flag overrides (`-t`, `-f`, `-u`), and `EmptySourceError` validation.
*   `tests/test_cli.py`: Integration tests verifying output for all 3 auto-detected modes and exit code `1` handling for empty sources.

---

### 4. 📌 Daily Summary

1.  **Automatic Detection Active:** Seamless identification of URLs, files, and text.
2.  **Fail-Fast Input Validation:** Rejects empty inputs cleanly with Exit Code 1.
3.  **QA & Coverage:** 17 tests passed (95.95% coverage, 0 Mypy/Ruff errors).
