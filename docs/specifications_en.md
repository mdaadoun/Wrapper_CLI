# 📋 Functional & Technical Requirements Specification (FTRS)

**Project:** Automated AI Surveillance CLI Wrapper (Wrapper_CLI)
**Baseline:** Standardized Project 0 engineering stack (Docker, Poetry, Ruff, Mypy, Pytest)
**Target Level:** Junior Dev → AI Product Engineer

---

## 🧭 1. Product Context & Objectives

### 1.1 Business Context

In a fast-moving AI ecosystem (new models, benchmarks, pricing tiers), product teams spend several hours a day manually reading newsletters, tech blogs, and RSS feeds to track trends. This manual task is time-consuming, subject to attention bias, and disconnected from developer terminal workflows. Furthermore, standard web interfaces (e.g. ChatGPT/Claude) do not allow precise measurement of essential engineering metrics (cost per million tokens, real computational latency).

### 1.2 Main Objective

Develop an industrial, resilient, typed, and highly configurable **command-line interface (CLI)** tool in Python. This tool automates the retrieval, analysis, and synthesis of raw text or tech news sources via LLMs, while ensuring strict FinOps control (token usage, USD budget estimation) and complete network fault tolerance. The application can be executed on-demand or automated via scheduled tasks (`cron` or CI/CD pipelines).

### 1.3 Key Performance Indicators (Product KPIs)

* **Average Generation Time:** < 15 seconds per analysis.
* **Schema Reliability:** JSON/Pydantic output compliance rate > 98%.
* **Cost Efficiency:** Average cost per analysis stabilized under $0.05.
* **Input Flexibility:** Support 3 input source types (URL, local file, direct text).

---

## 🎯 2. Functional Specifications (MVP)

### FS-01: User Input & Source Management

The CLI accepts multiple input modes for its primary command:

* **Direct Text:** Raw string input via positional argument or `--text` / `-t` option.
* **Local File:** Reading text or Markdown files (`.txt`, `.md`).
* **URL (Web Scraping):** HTML text extraction (e.g., Hacker News, TechCrunch, arXiv) with cleaning pipeline (stripping HTML tags and redundant whitespace).
* **Validation:** Empty, missing, or whitespace-only inputs trigger an explicit error message, exit code `1`, and terminate cleanly without unhandled Python exceptions.

### FS-02: LLM Generation Pipeline & Orchestration

* **System Prompting:** Injects cleaned text into a system prompt instructing the LLM to act as a senior AI analyst.
* **Structured Format:** Output strictly formatted according to a Pydantic schema (executive summary, key impacts, recommendations).
* **Token Budget Control:** Generation bounded via `max_tokens` (configurable, default 300–500 tokens for short summaries, up to 2000 tokens for deep impact analyses) to prevent budget waste.

### FS-03: FinOps Metrics & Observability

After each successful API inference, the system extracts usage metadata and calculates in real-time:

* Exact **Prompt Tokens** count.
* Exact **Completion Tokens** count.
* **Total Execution Time** (latency in seconds or milliseconds).
* **Exact Cost in USD**, calculated dynamically using the selected model's pricing matrix per million tokens.

### FS-04: Enhanced Terminal UI & Output Formats

Powered by **Rich** for a premium terminal UX:

* **Markdown Rendering:** Displays synthesis inside a styled panel supporting rich text formatting (headings, bullet points, bolding).
* **Metrics Table:** Hierarchical table summarizing FinOps inference metrics (duration, tokens, exact cost).
* **Export Options:** Output format selectable via `--output` / `-o`:
  * Terminal UI rendering (default).
  * Structured JSON export (`--output json`).
  * Markdown report generation (`--output md`).

---

## ⚙️ 3. Technical Architecture & Constraints

* **Runtime Environment:** Python 3.10+ managed strictly via **Poetry**.
* **Type Safety:** 100% type annotations in `src/`, validated in strict mode by **Mypy**.
* **Code Quality & Formatting:** **Ruff** for sub-second linting and formatting.
* **Security & Secret Protection:** Zero hardcoded API keys; passive secret detection via `detect-secrets` in local pre-commit hooks.
* **Hardened Containerization:** Non-root multi-stage Docker build producing a lightweight runtime container (< 250 MB).
