# ❓ Technical Interview FAQ: AI Watcher CLI Wrapper

Targeted questions and answers covering architecture design choices and engineering decisions for **Project 3: Wrapper CLI**.

---

### Q1: Why choose Typer over native argparse or Click?
**Answer:** Typer relies on modern Python static type hints. It allows declaring CLI commands expressively, auto-generating argument validation, type conversion, and `--help` documentation without boilerplate, while leveraging Click's proven foundation under the hood.

### Q2: How do you guarantee the LLM returns valid JSON?
**Answer:** We combine three defensive layers:
1. Strict system prompt engineering specifying the exact expected output schema.
2. API Structured Outputs / `response_format` mode.
3. Strict runtime parsing via **Pydantic V2** (`AnalysisReport.model_validate_json()`). Any schema mismatch raises a custom domain exception.

### Q3: How do you handle network resilience (Rate Limits, connection drops)?
**Answer:** We use **Tenacity** with an **exponential backoff with jitter** policy (up to 4 attempts max). On transient errors (HTTP 429 or 5xx), the application emits a warning log and progressively delays retries without interrupting the thread. If the outage persists, it fails gracefully with exit code `1` and a clean user-facing error message without exposing Python tracebacks.

### Q4: What is your cost control (FinOps) mechanism?
**Answer:**
1. **Direct Measurement**: Extract prompt/completion token usage metadata and calculate exact USD cost based on per-million token pricing rates.
2. **Local Caching**: SHA-256 content hashing with configurable TTL to avoid re-processing identical inputs.
3. **Explicit Limits**: Configurable `max_tokens` parameter bounding response length.

### Q5: Why use a non-root multi-stage Docker build for a CLI tool?
**Answer:** Multi-stage builds separate build tools (Poetry, pip) from final runtime image, shrinking image size (from ~600 MB to < 250 MB). Running as non-privileged user `appuser` (UID 1000) adheres to the principle of least privilege for secure execution in CI/CD container environments.

### Q6: Why did you start this project by cleaning up a previous project's code instead of creating a blank repository?
**Answer:** This applies the "Engineering Blueprint Reuse" principle. Starting from an approved engineering baseline provides immediate access to high-quality security and infrastructure (Poetry, Ruff, Mypy, pre-commit with detect-secrets, Makefile, Dockerfile) without wasting time reconfiguring everything. This ensures a robust CI pipeline from the very first line of business code.

### Q7: Why use such a granular directory structure (`core/`, `clients/`, `utils/`, `formatters/`) instead of a single `main.py` file for a CLI tool?
**Answer:** This architecture strictly adheres to the Single Responsibility Principle (SRP). In a monolithic file, formatting logic, extraction, and API calls are tightly coupled, making the code hard to test and maintain. By separating each responsibility, the modules become independently unit-testable (e.g., testing the formatter without making network calls), and the project can scale or be handed over to other developers cleanly.
