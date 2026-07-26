# 📌 Session 1.4: Secrets & Environment Configuration
**Date:** July 26, 2026

The goal of this session is to secure configuration management, particularly the Gemini API key (`GEMINI_API_KEY`), by strictly separating code from environment variables. This prevents information leaks and ensures the application is configurable without modifying the source code.

---

### 1. 🎓 New Concepts Introduced

*   **12-Factor App (Configuration):** A methodology stating a strict separation between code and configuration (everything that varies between deployments: API keys, ports, URLs). Configuration must be stored in the environment.
*   **detect-secrets:** A pre-commit security hook (from Yelp) that scans code before every commit to block the accidental addition of hardcoded secrets (API keys, passwords, tokens) into the Git repository.

---

### 2. 🧠 Decisions & Technical Choices

#### Dilemma A: Method for loading environment variables
*   **Option A.1: Use `os.environ.get()` everywhere in the code**
    *   *Pros/Cons:* Standard approach, but offers no type validation (a port becomes a string instead of an int) and scatters configuration logic, making it hard to maintain. It does not allow for a "Fail Fast" mechanism if a variable is missing.
*   **Option A.2: Pydantic V2 with `pydantic-settings` (Chosen)**
    *   *Why this choice?* Pydantic automatically validates and casts types. It centralizes all variables into a single `Settings` class, and raises an explicit error on startup (Fail Fast) if a critical key like `GEMINI_API_KEY` is missing. It's robust, strongly typed, and provides excellent DX (Developer Experience). The use of `SecretStr` masks the key value in Python logs.

---

### 3. 🛠️ Implementation & Auto-Documentation

*   Added an `.env.example` file at the root containing a template for required variables (`GEMINI_API_KEY`, `MODEL_NAME`, `MAX_TOKENS`).
*   Appended `.env` to `.gitignore` to prevent secret leaks.
*   Modified `src/ai_watcher/config.py` to define the `Settings` class, validating that `GEMINI_API_KEY` is provided. A `get_settings()` function encapsulates instantiation to catch the default Pydantic error (`ValidationError`) and raise a domain-specific `ConfigurationError`.

#### Validation commands to run locally:
```bash
poetry run python -m pytest
```
*Running the tests verifies the presence and behavior of this module. Without a `.env` file or declared variable, the unit test ensures a `ConfigurationError` is properly raised.*

---

#### Added tests

*   `test_config.py`: A new unit testing file was created to verify that a `ConfigurationError` is raised when the `GEMINI_API_KEY` variable is absent from the environment, and to ensure correct loading when it is present (using pytest's `monkeypatch`).

### 4. 📌 Daily Summary

1.  **`.env.example` file available**: Template provided for new contributors.
2.  **`pydantic-settings` installed and configured**: The `Settings` class centralizes and secures configuration.
3.  **Unit tests are green**: Verified both the success case and error case for configuration loading.
