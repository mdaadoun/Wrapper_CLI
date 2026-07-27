# 📌 Session 3.1: Direct Text and Local File Extraction
**Date :** 27 July 2026

*This session focused on implementing pure functions for text normalization and secure file reading within the extractor module. It lays the groundwork for clean, deterministic I/O processing.*

---

### 1. 🎓 New Concepts Introduced

*   **Pure Functions :** Functions that, given the same input, will always return the same output without producing observable side effects (like modifying global variables). `extract_from_text` is a pure function.
*   **I/O Separation :** The architectural practice of separating side-effect-heavy I/O operations (like reading a file from the disk) from pure business logic (like normalizing whitespace).

---

### 2. 🧠 Decisions & Technical Choices

#### [Dilemma A: Handling Text Normalization]
*   **Option A.1 : Normalizing text inline during extraction.**
    *   *Pros/Cons :* Quick, but ties the logic to the I/O, making it harder to unit test text normalization independently of file reading.
*   **Option A.2 : Abstracting normalization into a pure function (Selected).**
    *   *Why this choice ?* By keeping `extract_from_text(raw: str)` pure, we can test every edge case (empty string, multiple spaces, tabs) instantaneously without disk operations. `extract_from_file` then simply delegates the actual text processing to this pure function after successfully reading the file.

---

### 3. 🛠️ Implementation & Self-Documentation

Implemented `core/extractor.py` and `tests/test_extractor.py`.

#### Added Tests:
*   `test_extract_from_text_normalization`: Validates regex whitespace reduction.
*   `test_extract_from_file_valid_txt` / `md`: Validates reading operations.
*   `test_extract_from_file_missing`: Validates that a non-existent file gracefully raises an `ExtractionError`.
*   `test_extract_from_file_invalid_extension`: Ensures strict `.txt` and `.md` validation.

#### Local validation commands to run:
```bash
make lint
make test
```
*The command must return a green status, proving strict Mypy types and full pytest coverage.*

---

### 4. 📌 Session Summary

1.  **[Core Extractor]** Implemented `extract_from_text` and `extract_from_file` with strict validation.
2.  **[Test Coverage]** Added 100% test coverage for all I/O and text processing edge cases.
3.  **[Architecture]** Established pure functions and separated I/O for deterministic testing.
