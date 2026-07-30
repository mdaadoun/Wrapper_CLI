# Dev Journal Session 8.1: Tenacity Decorator with Exponential Backoff

**Date:** 2026-07-30

Implemented network resilience using Tenacity decorator `@retry` with exponential backoff and randomized jitter for handling transient HTTP 429, HTTP 5xx, and connection errors.

---

### 1. Concepts Introduced

- Exponential Backoff with Jitter: Exponentially increasing delay with randomized variation between retries to prevent thundering herd spikes on API services.
- Granular Exception Classification: Separating transient, retryable errors (429 rate limit, 5xx server error, connection drop) from non-retryable client errors (401 unauthorized, 400 bad request).
- Tenacity Retry Decorator: Declarative retry orchestration with configurable attempt bounds, wait strategies, and before_sleep logging callbacks.

---

### 2. Architecture Decisions (ADR)

#### ADR 1: ADR 1: Tenacity @retry Decorator on Internal Transport Execution
- Option 1: Manual retry loop with explicit time.sleep calls.
- Option 2 (Selected): Decorate internal _post_with_retry method with Tenacity @retry using wait_exponential_jitter(initial=2, max=10), stop_after_attempt(4), and reraise=True.
- **Rationale:** Declarative decorator isolates transport retry logic from business analysis code, eliminates error-prone loop boilerplate, and guarantees jittered delay execution.

#### ADR 2: ADR 2: Exception Hierarchy via LLMRetryableError
- Option 1: Catch and retry on generic Exception or base LLMClientError.
- Option 2 (Selected): Introduce LLMRetryableError inheriting from LLMClientError to explicitly target transient 429, 5xx, and network errors.
- **Rationale:** Prevents useless and wasteful retries on permanent errors like 401 Unauthorized or 400 Bad Request, while preserving backward compatibility for callers expecting LLMClientError.

#### ADR 3: ADR 3: Observability via before_sleep Logging Callback
- Option 1: Silent retries without user-facing console notifications.
- Option 2 (Selected): Rich Console warning callback (_log_retry_attempt) rendering yellow retry indicators with attempt count and delay duration.
- **Rationale:** Provides instant, clear user feedback during transient outages while keeping output clean and formatted.

---

### 3. Implementation & Code

See `src/ai_watcher/clients/llm_client.py` and `src/ai_watcher/exceptions.py`.

---

### 4. Session Checklist & Deliverables

- [x] Defined `LLMRetryableError`.
- [x] Implemented Tenacity `@retry` with jitter.
- [x] Integrated `before_sleep` logging callback.
- [x] Tested with unit tests.
