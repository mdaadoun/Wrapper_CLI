# 🚀 Automated AI Watcher CLI (Wrapper_CLI)

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Poetry](https://img.shields.io/badge/poetry-1.7+-60A5FA?style=flat-square&logo=poetry&logoColor=white)](https://python-poetry.org/)
[![FastAPI 0.110+](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker Multi-Stage](https://img.shields.io/badge/docker-Multi--Stage-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Ruff](https://img.shields.io/badge/linter-Ruff-009688?style=flat-square)](https://github.com/astral-sh/ruff)
[![Mypy strict](https://img.shields.io/badge/typing-Mypy%20strict-blue?style=flat-square)](https://mypy-lang.org/)

[🇫🇷 Version Française disponible ici](README_fr.md)

**Wrapper_CLI** is an industrial, resilient, typed, and highly configurable Python CLI application for automating AI technological surveillance, impact analysis, and FinOps tracking of LLM requests.

---

## 🎯 Key Features & Specifications

* **Zero-Setup Friction:** Onboarding under 5 minutes (`make install` $\to$ ready to develop).
* **Strict Type Safety:** 100% Mypy strict mode coverage in `src/`.
* **Automated Quality Gatekeeping:** Pre-commit hooks (`detect-secrets`, `ruff`, `mypy`).
* **Hardened Containerization:** Non-root multi-stage Docker build (< 250 MB).

---

## 📂 Repository Structure

```text
Wrapper_CLI/
│
├── README.md                   # English main presentation & Quickstart guide
├── README_fr.md                # French version of presentation
│
├── docs/                       # Architectural specifications & technical documentation
    ├── specifications_en.md   # Functional & Technical Requirements Specification
    ├── roadmap_en.md          # Chronological step-by-step 6-phase roadmap
    ├── glossary_en.md         # Technical glossary of key CLI concepts
    ├── questions_en.md        # Technical interview FAQ
    ├── code_en.md             # Source code architecture reference guide
    └── journal_en.md          # Architecture Decision Records (ADR) & development logbook
```

---

## 🚀 Quickstart Guide

### 1. Initialize project (Onboarding)
```bash
make install
```

### 2. Run Quality Checks (Ruff + Strict Mypy)
```bash
make lint
```

### 3. Run Test Suite
```bash
make test
```
