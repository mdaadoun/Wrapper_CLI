# 🚀 Automated AI Watcher CLI (Wrapper_CLI)

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.2+-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Poetry](https://img.shields.io/badge/poetry-1.7+-60A5FA?style=flat-square&logo=poetry&logoColor=white)](https://python-poetry.org/)
[![FastAPI 0.110+](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker Multi-Stage](https://img.shields.io/badge/docker-Multi--Stage-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Ruff](https://img.shields.io/badge/linter-Ruff-009688?style=flat-square)](https://github.com/astral-sh/ruff)
[![Mypy strict](https://img.shields.io/badge/typing-Mypy%20strict-blue?style=flat-square)](https://mypy-lang.org/)

[🇫🇷 Version Française disponible ici](README_fr.md)

**AI Watcher CLI (Wrapper_CLI)** is an industrial, resilient, typed, and highly configurable Python CLI application for automating AI technological surveillance, impact analysis, and FinOps cost tracking for LLM requests.

---

## 🎯 Key Features & Specifications

* **Zero-Setup Friction:** Onboarding under 5 minutes (`make install` $\to$ ready to develop).
* **Multi-Source Data Ingestion:** Seamless automatic detection or explicit flags for **Raw Text**, **Local Files** (`.txt`, `.md`), and **Web URLs** (via BeautifulSoup4).
* **FinOps Cost & Token Metrics:** Precise cost calculation across 40+ LLM models with token efficiency tracking (tokens per second).
* **Resilient Transport & Fallbacks:** Built-in Tenacity retry decorator with exponential backoff and offline `--demo` mode.
* **Smart SHA-256 Caching:** Local JSON content cache with configurable TTL (`--cache-ttl`) and bypass options (`--no-cache`).
* **Multi-Format Export Engine:** Rich console UI rendering, formatted Markdown reports (`-o report.md`), and raw Pydantic V2 JSON output (`-o json`).
* **Hardened Multi-Stage Docker:** Non-root container runtime (< 250 MB image size) adhering to zero-baked-secrets policies.
* **Interactive Next.js Dashboard:** Web UI (`make dashboard`) with dynamic AST test runner, interactive roadmap, technical FAQ, and code browser.

---

## 💻 CLI Usage Examples across 3 Input Sources

### 1. Raw Text Ingestion
```bash
# Auto-detected raw text in offline demo mode
ai-watcher scan "Google announces Gemini 1.5 Pro with 2M token context window." --demo

# Explicit raw text mode
ai-watcher scan -t "Quantum computing breakthrough achieved." --demo
```

### 2. Local File Ingestion
```bash
# Auto-detected local markdown/text file
ai-watcher scan ./docs/specifications_en.md --demo

# Explicit local file mode with custom Markdown report export
ai-watcher scan -f ./article.txt -o summary.md --demo
```

### 3. Web URL Ingestion
```bash
# Auto-detected Web URL scraping
ai-watcher scan https://news.ycombinator.com --demo

# Explicit Web URL mode with raw JSON output to stdout
ai-watcher scan -u https://example.com/tech-news -o json --demo
```

---

## 🎛️ Option Flags Reference

| Flag | Short | Description | Default |
| :--- | :--- | :--- | :--- |
| `source` | *(Positional)* | Source input to analyze (text string, file path, or HTTP/HTTPS URL) | **Required** |
| `--text` | `-t` | Force input interpretation as raw text string | `False` |
| `--file` | `-f` | Force input interpretation as local file path | `False` |
| `--url` | `-u` | Force input interpretation as web URL | `False` |
| `--output` | `-o` | Output destination: `console` (Rich UI), `json` (stdout), or filename (`.md`, `.json`) | `console` |
| `--demo` | `-d` | Run in offline demo mode using mocked LLM responses | `False` |
| `--cache-ttl` | | Local cache time-to-live in seconds (0 forces fresh analysis) | `3600` |
| `--no-cache` | | Bypass reading and writing local cache | `False` |

---

## 🐳 Docker Deployment & Runtime Instructions

AI Watcher is package-ready with a multi-stage, non-root Docker container image.

### 1. Build the Docker Image
```bash
docker build -t ai-watcher .
```

### 2. Run in Offline Demo Mode
```bash
docker run --rm ai-watcher scan "Dockerized AI analysis demo" --demo
```

### 3. Run with Live API Secrets Injection
```bash
docker run --rm -e GEMINI_API_KEY="$GEMINI_API_KEY" ai-watcher scan "https://news.ycombinator.com"
```

---

## 💰 FinOps Cost & Token Breakdown

AI Watcher integrates a pricing matrix supporting 40+ LLM models (OpenAI GPT-4o, Anthropic Claude 3.5, Google Gemini 1.5, Meta Llama 3).

### Pricing & Metrics Logic
* **Cost Formula:**
  $$\text{Total Cost (USD)} = \frac{\text{Prompt Tokens} \times \text{Input Price}}{1,000,000} + \frac{\text{Completion Tokens} \times \text{Output Price}}{1,000,000}$$
* **Metrics Table Display:** Outputs input/output tokens, latency in seconds, throughput (tokens/sec), and calculated USD cost rounded to 6 decimal places.

---

## 🚀 Quickstart Guide (Development & Dashboard)

### 1. Onboarding & Installation
```bash
make install
```

### 2. Launch Interactive Next.js Dashboard
```bash
make dashboard
```

### 3. Run Code Quality Checks (Ruff + Strict Mypy)
```bash
make lint
```

### 4. Execute Full Test Suite & Coverage
```bash
make test
```

---

## 📂 Repository Structure

```text
Wrapper_CLI/
│
├── README.md                   # Main English documentation & CLI user manual
├── README_fr.md                # French version of documentation
├── Dockerfile                  # Production multi-stage Docker build file
├── Makefile                    # Developer commands (install, lint, test, dashboard)
├── pyproject.toml              # Poetry dependency & tool configurations
│
├── dashboard/                  # Next.js 16 TypeScript interactive dashboard
│   ├── src/app/                # App Router routes (Roadmap, FAQ, Test Runner, Code Browser)
│   └── src/lib/                # AST test scanner & markdown renderer
│
├── docs/                       # Specifications & technical documentation
│   ├── specifications_en.md   # Functional & Technical Requirements
│   ├── roadmap_en.md          # Step-by-step 6-phase roadmap
│   ├── glossary_en.md         # Technical glossary
│   ├── questions_en.md        # Technical interview FAQ
│   ├── code_en.md             # Source code architecture reference
│   └── journal/               # Architectural Decision Records (ADRs) & dev logbook
│
├── src/ai_watcher/             # Main Python package
│   ├── clients/               # LLM transport client & demo mode mock
│   ├── core/                  # Source type detector & ingestion extractor
│   ├── formatters/            # Rich console panel UI & markdown exporter
│   ├── schemas/               # Pydantic V2 data models
│   └── utils/                 # FinOps cost calculator, SHA-256 cache & doc helpers
│
└── tests/                      # Automated test suite (Pytest + Coverage)
```
