# 📖 Source Code Architecture Reference

This document provides a detailed breakdown of the `Wrapper_CLI` architecture, modules, CLI commands, and build configuration.

---

## 🛠️ 1. Main CLI Entrypoint: `src/ai_watcher/__init__.py`

- **Purpose:** Primary application package entrypoint for the AI Watcher CLI utility.

---

## 📦 2. Project Manifest & Environment: `pyproject.toml`

- **Purpose:** Centralized project declaration using Poetry. Defines CLI dependencies, QA tooling (`pytest`, `ruff`, `mypy`, `pre-commit`, `detect-secrets`), and strict linter configurations.

---

## 🛠️ 3. Task Automation: `Makefile`

- **Purpose:** Provides a unified command-line interface (`make install`, `make lint`, `make test`, `make docker-build`, `make onboarding-check`).

---

## 🐳 4. Containerization & Security: `Dockerfile`

- **Purpose:** Production multi-stage Docker build producing an unprivileged, non-root runtime container image (< 250 MB).

---

## 🔐 5. Quality Gatekeeping: `.pre-commit-config.yaml`

- **Purpose:** Configures local git pre-commit hooks to enforce code quality, static typing, and secret scanning before commits.

---

## 🚀 6. Onboarding Automation: `scripts/simulate_onboarding.sh`

- **Purpose:** Automated E2E verification script that validates zero-setup friction onboarding in under 300 seconds.

---

## ⚙️ 7. IDE Workspace & Extension Recommendations: `.vscode/`

- **Purpose:** Configures workspace settings (`.vscode/settings.json`) and extension recommendations (`.vscode/extensions.json`).
- **Key Concepts:**
  - **`extensions.json`:** Automatically prompts developers opening the workspace to install `charliermarsh.ruff` (linter/formatter) and `ms-python.python` (interpreter & debugging).
  - **`settings.json`:** Aligns local IDE behavior with CI/CD checks by enabling format-on-save via Ruff (`editor.formatOnSave`: `true`), auto-fixing lint errors and imports on save (`source.fixAll`, `source.organizeImports`), and setting `files.insertFinalNewline` & `files.trimTrailingWhitespace`.
