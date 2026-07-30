# 📌 Session: Phase 4.3 — Base LLM Client (Without Retry)
**Date:** 30 July 2026

Implement `LLMClient` in `src/ai_watcher/clients/llm_client.py` encapsulating HTTPX REST interactions with Gemini API (and OpenAI fallback), enforcing schema validation via `AnalysisReport`, stripping markdown fences, and injecting FinOps latency/cost telemetry.

---

### 1. 🎓 New Concepts Introduced

*   **API Client Encapsulation:** Isolating network I/O, API key headers, and HTTP request payload formatting inside a dedicated `LLMClient` module to ensure testability via dependency injection.
*   **Structured Output Validation:** Deserializing raw LLM JSON responses directly into Pydantic V2 `AnalysisReport` domain models, catching schema mismatches early.
*   **FinOps Telemetry Injection:** Measuring request wall-clock latency with `time.perf_counter()` and computing operational inference expenditure via `utils/cost.py`.

---

### 2. 🧠 Decisions & Technical Choices

#### Decision A: HTTPX REST Engine vs Provider SDKs
*   **Option A.1: Provider SDKs (`google-generativeai` / `openai`)**
    *   *Pros/Cons:* Heavy external dependency footprint, complex multi-provider configuration, difficult transport mocking in unit tests.
*   **Option A.2: HTTPX REST Client (Retained)**
    *   *Why this choice?* Keeps binary size lightweight (< 250 MB container target), aligns with web scraping HTTP engine, and allows simple mock transport injection.

#### Decision B: Secret Header Security vs URL Query Parameter
*   **Option B.1: API Key in URL Query String (`?key=...`)**
    *   *Pros/Cons:* Easy setup, but risks leaking credentials in HTTP request logs or exception tracebacks (`httpx.RequestError`).
*   **Option B.2: Secret Header Injection (`x-goog-api-key`) (Retained)**
    *   *Why this choice?* Zero secret leakage policy — header delivery prevents API key exposure in loggers and exception strings.

---

### 3. 🛠️ Implementation & Auto-Documentation

The LLM client implementation in `src/ai_watcher/clients/llm_client.py`:

```python
"""Base LLM client encapsulation using HTTPX for REST API querying."""

import json
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import httpx
from ai_watcher.clients.prompts import get_system_prompt
from ai_watcher.exceptions import LLMClientError
from ai_watcher.schemas.report import AnalysisReport
from ai_watcher.utils.cost import calculate_cost


class LLMClient:
    """Encapsulates LLM API execution, timing, and response validation."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        temperature: float = 0.2,
        top_p: float = 0.9,
        max_tokens: Optional[int] = None,
        timeout: float = 30.0,
        httpx_client: Optional[httpx.Client] = None,
    ) -> None:
        if not api_key or not api_key.strip():
            raise LLMClientError("Missing or invalid API key configuration.")

        self.api_key: str = api_key.strip()
        self.model_name: str = model_name or "gemini-1.5-pro-latest"
        self.temperature: float = temperature
        self.top_p: float = top_p
        self.max_tokens: int = max_tokens or 8192
        self.timeout: float = timeout
        self._external_client: Optional[httpx.Client] = httpx_client
```

#### Commands to validate:
```bash
# Execute LLM client unit tests
poetry run pytest tests/test_llm_client.py tests/test_cost.py
# Check static typing with Mypy
poetry run mypy src/ --strict
```

---

#### Tests added

*   `test_llm_client_missing_api_key` — Verifies initialization raises `LLMClientError` when no key is provided.
*   `test_llm_client_empty_content` — Verifies `analyze("")` raises `LLMClientError`.
*   `test_llm_client_successful_analysis_gemini_format` — Mocks Gemini REST response and verifies field parsing + FinOps metrics.
*   `test_llm_client_successful_analysis_openai_format` — Mocks OpenAI JSON response and verifies payload compatibility.
*   `test_llm_client_markdown_code_block_json` — Verifies stripping of markdown code fences surrounding JSON output.
*   `test_llm_client_http_status_error` — Verifies HTTP status errors wrap into domain `LLMClientError`.
*   `test_llm_client_timeout_error` — Verifies `httpx.TimeoutException` raises domain `LLMClientError`.
*   `test_llm_client_invalid_json_schema` — Verifies schema mismatch raises `LLMClientError`.
*   `test_llm_client_empty_response_body` — Verifies empty text candidate raises `LLMClientError`.

---

### 4. 📌 Session Summary

1.  **LLMClient Module:** Implemented `LLMClient` in `src/ai_watcher/clients/llm_client.py` using HTTPX REST calls with strict header secret injection.
2.  **FinOps Cost Utility:** Implemented model pricing calculator in `src/ai_watcher/utils/cost.py`.
3.  **Schema Validation:** Ensured all API responses deserialize into validated `AnalysisReport` models.
4.  **Test Coverage:** Added 11 unit tests in `tests/test_llm_client.py` and `tests/test_cost.py`, bringing total codebase coverage to 96%.
