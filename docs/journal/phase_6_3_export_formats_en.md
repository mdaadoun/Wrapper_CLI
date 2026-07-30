# Dev Journal Session 6.3: Export Formats (--output) Implementation

**Date:** 2026-07-30

Implemented export options in CLI scan command (`--output` / `-o`) supporting `console` (default Rich UI panel), `json` (stdout or `.json` file), and `markdown` (`.md` file export via `formatters/markdown.py`).

---

### 1. Concepts Introduced

- **Multi-Format Output Exporter:** Decoupling internal analysis data structure from presentation and export formats.
- **Interoperable Report Serialization:** Providing structured JSON for programmatic consumption and Markdown for documentation and archiving.

---

### 2. Architecture Decisions (ADR)

#### ADR 1: Decoupled Export Formatter Architecture
- **Option 1 (Embed string serialization directly inside AnalysisReport schema methods):** Adding export rendering directly to Pydantic models.
- **Option 2 (Selected - Dedicated formatters module with specialized console and markdown rendering functions):** Separate file export logic in `formatters/markdown.py`.
- **Rationale:** Maintains Single Responsibility Principle (SRP) by keeping schema models focused purely on data validation and business rules while visual/file representation lives in formatters.

---

### 3. Implementation & Code

```python
# src/ai_watcher/formatters/markdown.py
def export_markdown(report: AnalysisReport, output_path: Path | str) -> Path:
    try:
        path = Path(output_path)
        md_content = render_markdown_report(report)
        path.write_text(md_content, encoding="utf-8")
        return path
    except OSError as err:
        raise ExportError(
            f"Failed to export Markdown report to '{output_path}': {err}"
        ) from err
```

Validation:
```bash
cd projets/3_Wrapper_CLI
./.venv/bin/pytest tests/test_export.py tests/test_cli.py -v
```

---

### 4. Session Checklist & Deliverables
1. [x] `src/ai_watcher/formatters/markdown.py` created with `render_markdown_report` and `export_markdown`
2. [x] `src/ai_watcher/main.py` scan command updated with `--output` / `-o` option
3. [x] `ExportError` exception handling and unit test suite updated in `tests/test_export.py`
