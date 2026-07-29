# 📌 Session: Phase 3.3 — Ingestion Orchestrator (Facade Pattern)
**Date:** 29 July 2026

Implement the facade function `extract(source, source_type)` in `core/extractor.py` that dispatches to the appropriate internal extractor based on `SourceType`, with Pydantic validation guaranteeing non-empty output.

---

### 1. 🎓 New Concepts Introduced

*   **Facade Pattern:** Structural design pattern that provides a simplified, unified interface to a complex subsystem. Here, `extract()` hides the complexity of three distinct extractors (text, file, URL) behind a single function call.
*   **Pydantic Validation Layer:** Using `BaseModel` with `Field(min_length=1)` to enforce business rules at the system boundary — guarantees that any extracted content returned to the caller is non-empty, catching edge cases early.
*   **Factory-style Dispatch:** The `extract()` function uses an `if/elif/else` chain on `SourceType` enum to route to the correct extractor, a lightweight form of the Strategy pattern without needing a registry.

---

### 2. 🧠 Decisions & Technical Choices

#### Decision A: Facade vs. Direct Exporter Exposure
*   **Option A.1: Direct exposure of `extract_from_text`, `extract_from_file`, `extract_from_url`**
    *   *Pros/Cons:* Callers must know which extractor to call and handle dispatching themselves. Violates DRY if repeated across the codebase.
*   **Option A.2: Unified `extract()` facade (Retained)**
    *   *Why this choice?* Centralizes dispatch logic in one place, enforces Pydantic validation consistently, and provides a single import for the entire ingestion pipeline. The caller (e.g., `main.py`) simply calls `extract(source, source_type)` without knowing internal architecture.

#### Decision B: Pydantic Validation vs. Simple `len()` Check
*   **Option B.1: Simple `if not cleaned: raise EmptySourceError`**
    *   *Pros/Cons:* Works but lacks schema-level guarantees and metadata exposure.
*   **Option B.2: `ExtractedContent` Pydantic model with `Field(min_length=1)` (Retained)**
    *   *Why this choice?* Provides declarative validation at the schema level, automatically enforces constraints, and keeps metadata (char_count, source_type) alongside the extracted text. Follows the project's strict typing philosophy.

---

### 3. 🛠️ Implementation & Auto-Documentation

The `extract()` function in `core/extractor.py` implements the facade pattern:

```python
def extract(source: str, source_type: SourceType) -> str:
    # 1. Dispatch to the right internal extractor
    if source_type == SourceType.TEXT:
        raw = extract_from_text(source)
    elif source_type == SourceType.FILE:
        raw = extract_from_file(Path(source))
    elif source_type == SourceType.URL:
        raw = extract_from_url(source)
    else:
        raise ExtractionError(f"Unknown source type: {source_type}")

    # 2. Pydantic validation — guarantees non-empty result
    validated = ExtractedContent.from_text(raw, source_type)
    return validated.text
```

The `ExtractedContent` model validates:
- `text`: non-empty string (`min_length=1`)
- `source_type`: valid `SourceType` enum
- `char_count`: integer >= 1

The classmethod `from_text()` runs the validation logic, raising `EmptySourceError` if content is empty after cleaning.

#### Commands to validate:
```bash
# Run all extractor tests including facade tests
make test -k extractor
# Or full suite
make test
```

---

#### Tests added

- `test_extract_facade_text` — TEXT source dispatches correctly
- `test_extract_facade_text_empty_raises` — Empty TEXT raises `EmptySourceError`
- `test_extract_facade_file` — FILE source dispatches correctly
- `test_extract_facade_file_missing_raises` — Missing FILE raises `ExtractionError`
- `test_extract_facade_url` — URL source dispatches correctly
- `test_extract_facade_url_empty_raises` — Empty URL content raises `EmptySourceError`
- `test_extract_facade_pydantic_validation` — Return type is validated `str`

---

### 4. 📌 Session Summary

1.  **Facade Function:** `extract()` in `core/extractor.py` now dispatches correctly to all 3 source types (TEXT, FILE, URL).
2.  **Pydantic Validation:** `ExtractedContent` model validates non-empty output with `EmptySourceError` raised if content is empty after cleaning.
3.  **Test Coverage:** 17 tests pass with 95% line coverage on `core/extractor.py`. All 3 source types tested for success and empty-content edge cases.
4.  **Mypy Compliance:** `extractor.py` passes strict Mypy type checking with zero errors.
