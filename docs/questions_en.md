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

### Q8: Why load configuration via Pydantic (`pydantic-settings`) rather than simple `os.environ.get()` calls?
**Answer:** Pydantic provides three major benefits over `os.environ`: strong typing (automatically casting values, e.g., string to int), centralized validation, and the ability to "Fail Fast". If a required API key is missing from `.env`, the application crashes explicitly at startup with a clear message, rather than silently failing later during an HTTP call. The `SecretStr` type also masks the value in logs.

### 5. CLI Transition & Automation (Makefile)

**Q: Why structure the entry point of this project using Typer instead of a standard server like Uvicorn?**
*Expected Answer:* The application (Wrapper_CLI) is an asynchronous tool designed for targeted, on-demand content extraction. A CLI (Command Line Interface) runs on demand and terminates, which is perfect for CI/CD automation or cron jobs. Typer allows for very rapid creation of strongly-typed CLIs with automatic help generation (`--help`), whereas Uvicorn is designed for long-running web servers/daemons. The Makefile was adapted accordingly with `make run` to easily inject CLI arguments.

### 6. CLI Routing & Typer Options (Step 2.1)

**Q: Why combine positional arguments with short boolean flags (like `-t`, `-f`, `-u`) in a production CLI?**
*Expected Answer:* The mandatory positional argument (`source`) streamlines regular usage by allowing users to pass input directly without extra flags. Optional boolean flags (`--text / -t`, `--file / -f`, `--url / -u`) allow developers to explicitly disambiguate input when automatic detection is not desired (e.g. if a text string closely resembles a URL). Typer enables declaring these flags cleanly and strictly typed via `typer.Option`.

### 7. Automatic Source Detection & Intent Inference (Step 2.2)

**Q: How do you design an automatic CLI input detection heuristic without creating false positives or side effects?**
*Expected Answer:* An effective CLI detection heuristic must be strictly ordered and deterministic. First, explicit URL prefixes (`http://` or `https://`) are evaluated, followed by physical filesystem path resolution (`Path.exists() & Path.is_file()`). All other string inputs fall back to raw text. To guarantee flexibility, explicit boolean flags (`-t`, `-f`, `-u`) allow users to manually override the detection when ambiguities arise. Empty or whitespace-only inputs immediately raise a dedicated domain exception (`EmptySourceError`) following the Fail-Fast principle.

### 8. Granular Exception Handling (Step 2.3)

**Q: Why use a custom Exception Hierarchy instead of just raising generic exceptions?**
*Expected Answer:* A custom exception hierarchy (like a base `WatcherError` with subclasses `ExtractionError`, `ConfigurationError`) allows developers to catch specific domain errors without masking unrelated system exceptions. It empowers the main application to handle expected failures gracefully (e.g., printing a clean terminal message and returning code 1) rather than crashing with an ugly stack trace.

### 9. Pure Functions and Architecture (Step 3.1)

**Q: Why separate text normalization into a pure function instead of doing it inline while reading the file?**
*Expected Answer:* Separating business logic (text normalization) from I/O operations (file reading) follows the principle of pure functions. It allows developers to test all text edge cases (empty strings, weird tabs, etc.) instantly without ever touching the disk. I/O testing then only focuses on file existence, permissions, and encoding, significantly reducing test complexity and increasing reliability.

### 10. Web Scraping and Token Optimization (Step 3.2)

**Q: Why do we use BeautifulSoup4 to strip specific HTML tags before sending the text to the LLM?**
*Expected Answer:* Tags like `<script>`, `<style>`, `<nav>`, and `<footer>` contain boilerplate code or navigation links that do not contribute to the main content. Stripping them reduces "noise", which directly minimizes token usage (saving costs) and helps the LLM focus purely on the relevant business context, improving response accuracy.
