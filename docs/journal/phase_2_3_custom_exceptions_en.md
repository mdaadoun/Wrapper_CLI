# 📌 Session 2.3: Custom Exceptions Module
**Date :** 27 July 2026

*This session focused on implementing a robust, granular exception hierarchy for the AI Watcher CLI to replace generic errors. This improves targeted error handling and provides clearer, non-crashing feedback to the user.*

---

### 1. 🎓 New Concepts Introduced

*   **Exception Hierarchy :** A structured tree of custom error classes extending a common base class. It allows developers to catch specific domain errors (like a missing configuration) without inadvertently swallowing system exceptions.
*   **Granular Error Handling :** The practice of throwing precise, highly descriptive exceptions specific to different failure modes (e.g., extraction vs. LLM API issues), allowing the upper layers of the application to render appropriate UI messages.

---

### 2. 🧠 Decisions & Technical Choices

#### [Dilemma A: Exception Base Class]
*   **Option A.1 : Inheriting directly from `Exception` everywhere.**
    *   *Pros/Cons :* Simple, but makes it impossible to cleanly catch "all application-specific errors" in the main CLI wrapper without catching generic Python errors.
*   **Option A.2 : Creating a domain-specific `WatcherError` base class (Selected).**
    *   *Why this choice ?* By having all custom exceptions (`EmptySourceError`, `ExtractionError`, `LLMClientError`, `ConfigurationError`) inherit from `WatcherError`, the Typer application can safely catch `WatcherError` globally. It gracefully handles known failures by printing a styled error message and exiting with code `1`, without ugly Python tracebacks.

---

### 3. 🛠️ Implementation & Self-Documentation

Implemented `exceptions.py` with strict type checking and integrated it across `main.py`, `config.py`, and `detector.py`.

#### Added Tests:
*   `test_exception_hierarchy`: Validates the inheritance structure of the custom exception classes.
*   Specific test functions ensuring each exception (`EmptySourceError`, `ExtractionError`, `LLMClientError`, `ConfigurationError`) can be raised and caught.

#### Local validation commands to run:
```bash
make lint
make test
```
*The command must return a green status with 100% coverage, ensuring all exceptions are properly integrated and typed.*

---

### 4. 📌 Session Summary

1.  **[Exception Hierarchy]** Creation of the `WatcherError` base class and specific exception subclasses.
2.  **[Strict Validation]** Updated the codebase to pass `mypy` and `ruff` checks after integration.
3.  **[Test Suite Addition]** Created `tests/test_exceptions.py` to assert correct exception behavior, integrated automatically into the interactive dashboard.
