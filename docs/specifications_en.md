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
  * `console`: Interactive Rich display (default).
  * `json`: Raw structured JSON output downstream software pipelines.
  * `markdown`: Direct export to an external file (e.g., `--output report.md`).

### FS-05: Local Caching System (Performance & FinOps)

* To prevent redundant re-processing of identical content (saving latency and API cost), the application integrates a local persistence mechanism.
* Analyzed data is stored (via content hash or URI) in a local JSON file (e.g., `~/.cache/ai_watcher.json`).
* Configurable cache TTL (e.g., `--cache-ttl 3600`), bypassable on demand using `--no-cache` flag.

---

## 🛠️ 3. Technical Architecture & Constraints

### TS-01: Ecosystem & Environment Alignment

* **Runtime:** Python **3.11+** with strict static typing.
* **Dependency Manager:** **Poetry** configured in strict mode with reproducible `poetry.lock`.
* **Secrets:** Absolute isolation of authentication keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.) via local `.env` loaded via `python-dotenv` or `pydantic-settings`. Anonymized `.env.example` must exist at project root.

### TS-02: Data Modeling (Pydantic V2)

Data processing relies on strictly typed schemas for validation and parsing:

```python
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class AnalysisReport(BaseModel):
    source: str = Field(description="Analyzed source or URL")
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)
    model_used: str = Field(
        description="Exact identifier of the inference model"
    )

    title: str = Field(description="Synthetic title of the AI news item")
    summary: str = Field(description="Condensed summary (max 200 words)")
    key_points: List[str] = Field(description="3 to 5 key points extracted")

    impact_technical: str = Field(
        description="Impact on software architectures and tooling"
    )
    impact_business: str = Field(
        description="Commercial opportunities or threats"
    )
    impact_regulatory: Optional[str] = Field(
        None, description="GDPR or AI Act implications if relevant"
    )

    recommendation: str = Field(
        description="Actionable recommendation for tech team"
    )
    priority: str = Field(description="Priority level: high, medium, low")

    # FinOps metrics injected at runtime
    prompt_tokens: int = Field(default=0)
    completion_tokens: int = Field(default=0)
    total_tokens: int = Field(default=0)
    estimated_cost_usd: float = Field(default=0.0)
    execution_time_seconds: float = Field(default=0.0)
```

### TS-03: Modular Package Architecture

The project directory structure builds upon Project 0 baseline by cleanly separating software responsibilities:

```text
cli-ai-watcher/
├── .env.example              # Environment variables template (API key)
├── pyproject.toml            # Poetry configuration & dev tool settings
├── README.md                 # Setup and quickstart documentation
├── src/
│   └── ai_watcher/
│       ├── __init__.py
│       ├── main.py           # CLI entrypoint (Typer or Click framework)
│       ├── config.py         # Pydantic Settings loading & validation
│       ├── exceptions.py     # Custom application domain exceptions
│       ├── core/
│       │   ├── __init__.py
│       │   ├── extractor.py  # Extraction logic (HTML Scraping / File reading)
│       │   ├── chunker.py    # Semantic chunker for large text bodies
│       │   └── analyzer.py   # Pipeline orchestration & analysis
│       ├── clients/
│       │   ├── __init__.py
│       │   └── llm_client.py # Encapsulated API client wrapped with Tenacity (Retry)
│       ├── utils/
│       │   ├── __init__.py
│       │   ├── cache.py      # Local cache persistence and TTL mechanism
│       │   └── cost.py       # Pricing matrix and FinOps cost calculator
│       └── formatters/
│           ├── __init__.py
│           ├── console.py    # Rich layouts & tables generation
│           └── markdown.py   # Writing logic & .md report export
└── tests/
    ├── __init__.py
    ├── unit/                 # Mocked unit tests (extractor, chunker, prompt)
    └── integration/          # End-to-end tests (real/mocked client calls)
```

### TS-04: Model Configuration & Network Resilience

* **Increased Determinism:** To guarantee factual accuracy in technical summaries, model temperature must be set low (between `0.0` and `0.3`), paired with `Top_p` of `0.9`.
* **Retry Policy:** Remote API calls subject to network glitches or rate limits must be intercepted in `llm_client.py` for transient errors (HTTP 429 Rate Limits, HTTP 5xx Server Errors, Timeouts) using **Tenacity**.
  * **Strategy:** Exponential Backoff with Jitter.
  * **Parameters:** Max **4 attempts**, progressive delay (e.g., 2s, 4s, 8s).
  * **Logging:** Emit warning log (`logger.warning`) stating current retry attempt before sleeping thread.

---

## 📦 4. Mandated Technology Stack

| Component | Selected Technology | Architectural Role |
| :--- | :--- | :--- |
| **Language** | Python 3.11+ | Main execution runtime and static type system. |
| **Package Manager** | Poetry | Dependency resolution, isolation, and lockfile. |
| **CLI Framework** | Typer (or Click) | Terminal argument/option routing framework. |
| **HTTP Client** | HTTPX / OpenAI SDK | Async/sync client for remote API requests. |
| **Resilience** | Tenacity | Retry automation decorator with exponential backoff. |
| **Validation** | Pydantic V2 | Strict data modeling & input/output schema validation. |
| **Terminal UX** | Rich | Markdown text rendering engine, spinners, and tables. |
| **Quality & Style** | Ruff + Mypy | Static code analysis and formatting standards compliance. |
| **Testing** | Pytest + Pytest-cov | Automated testing suite and coverage reporting. |

---

## ✅ 5. Acceptance Criteria (Definition of Done - DoD)

To declare **Project 3** finalized and ready for release, all criteria below must be validated:

### Quality & Engineering Robustness

- [ ] **Zero Style Drift:** Static quality tools (`ruff check .` and `mypy src/ --strict`) pass with zero errors or warnings.
- [ ] **Test Coverage:** Automated unit/integration tests (`pytest --cov=src`) cover a minimum of **80%** of logical code lines, including mocked retry and cache behaviors.
- [ ] **Secret Protection:** Zero hardcoded API keys or authentication tokens. Pre-commit hooks (`detect-secrets`) intercept accidental leaks.
- [ ] **Verified Resilience:** Simulated network outages do not crash application; consecutive retry warnings are logged before failing gracefully.

### Functional Validation

- [ ] **Command Routing:** Main command `poetry run python src/ai_watcher/main.py scan "<source>"` executes cleanly across all 3 source types (URL, File, Raw String).
- [ ] **FinOps Accuracy:** Computed costs reported match real API pricing models.
- [ ] **Visual Rendering:** Output reports correctly rendered using Rich styled panels with distinct status indicators (green success, yellow warning, red error).
