# Dev Journal Session 10.2: Runtime Secrets Injection

**Date:** 2026-07-31

Implemented dynamic runtime secret injection for the CLI tool and container runtime environment. Enforced zero-baked secrets policy across Docker build layers and source control by configuring Pydantic BaseSettings to resolve environment variable aliases (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `AI_WATCHER_API_KEY`) dynamically at execution time.

---

### 1. Concepts Introduced

- **Dynamic Runtime Secret Injection**: Supplying API keys and sensitive credentials to containerized applications at runtime via environment variables, avoiding credential persistence in container images.
- **Zero-Baked Secrets Container Policy**: A security standard ensuring no API keys, tokens, or credentials are hardcoded or embedded into container filesystem layers.
- **Environment Variable Alias Resolution**: Configuring settings parsers to map multiple standard environment variable names to a single internal credential field.

---

### 2. Architecture Decisions (ADR)

#### ADR 1: Runtime Secret Supply via Environment Variables
- **Option 1**: Hardcoding default/fallback API credentials in configuration files or Docker image layers.
- **Option 2 (Selected)**: Injecting API credentials dynamically at runtime via environment variables (`docker run -e OPENAI_API_KEY=...`).
- **Rationale**: Ensures container images contain zero hardcoded secrets in compliance with security best practices and prevents accidental leaks in layer history.

#### ADR 2: Environment Variable Fallback & Alias Resolution
- **Option 1**: Strict single-variable requirement (only `GEMINI_API_KEY`).
- **Option 2 (Selected)**: Pydantic `AliasChoices` supporting `GEMINI_API_KEY`, `OPENAI_API_KEY`, and `AI_WATCHER_API_KEY`.
- **Rationale**: Maximizes developer ergonomics and compatibility with standard container orchestration tools without requiring custom wrapper scripts.

---

### 3. Implementation & Code

See `src/ai_watcher/config.py`, `tests/test_secrets_injection.py`, and `tests/test_config.py`.

---

### 4. Session Checklist & Deliverables

- [x] Configured Pydantic `BaseSettings` with `AliasChoices` to dynamically load runtime API key environment variables.
- [x] Created targeted unit test suite `tests/test_secrets_injection.py` validating env var aliases, missing secret exit codes, and clean error displays.
- [x] Enforced zero hardcoded secrets policy across codebase and Docker image configuration.
- [x] Verified 100% test pass rate across 195 test cases with 99.67% code coverage.
