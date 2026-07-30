# 📄 Erratum & Architectural Patch: AI Watcher CLI Wrapper

**Document Status:** Approved Patch
**Target Version:** 1.0.1
**Objective:** Resolve edge cases related to token limits, cache invalidation, API structured outputs, scraping limitations, and rate-limit compliance.

---

## Part 1: Architectural Corrections (FTRS & SAS Updates)

Apply the following modifications to your existing specifications:

### 1. FTRS TS-04: Tooling Constraint Update

* **Original:** `BeautifulSoup4` for web scraping (stripping tags manually).
* **Correction:** Replace or augment with `readability-lxml` (a Python port of Mozilla's Readability) to extract main article text and bypass JS-injected noise, cookie banners, and navigation menus.

### 2. SAS 3.1 & Rule 3: Native Structured Outputs

* **Original:** Relying on system prompts to enforce Pydantic/JSON compliance.
* **Correction:** The `LLMClient` MUST use provider-native structured output features (e.g., passing the JSON schema directly into OpenAI's `response_format` or using `instructor`). Prompting alone is forbidden for schema enforcement.

### 3. SAS 3.3: Caching Mechanism Key

* **Original:** Cache Key = `SHA-256(cleaned_extracted_text + model_name)`.
* **Correction:** Cache Key = `SHA-256(cleaned_extracted_text + model_name + SCHEMA_VERSION)`. A `SCHEMA_VERSION` constant (e.g., `"v1"`) must be defined in `config.py` and incremented whenever the `AnalysisReport` Pydantic model changes to prevent parsing crashes.

### 4. SAS 3.2: Resilience & Network Policy

* **Original:** Tenacity strictly uses exponential backoff up to 10s for HTTP 429.
* **Correction:** The client must attempt to read the `Retry-After` HTTP header on 429 responses. If present, the retry mechanism must sleep for the exact duration requested by the provider before resuming the Tenacity backoff loop.

---

## Part 2: Supplemental Roadmap (Integration Steps)

Insert these steps into your existing Phase tracking dashboard to implement the erratum corrections.

### Phase 3 Update: Ingestion & Chunking

**Step 3.2 (Patch): Semantic HTML Extraction**

* **Description:** Update `extract_from_url` in `core/extractor.py`. Fetch raw HTML via HTTPX, but pass it through `readability.Document(html).summary()` before using BeautifulSoup to strip the remaining tags.
* **Key Concept:** Content isolation — letting dedicated heuristics identify the "article body" prevents wasting tokens on sidebars and footers.
* **Validation Criterion:** Scraping a dense tech news URL extracts only the article text, completely ignoring navigation links and ad placeholders.

**Step 3.4 (New): Token-Aware Document Chunker**

* **Description:** Implement `core/chunker.py` with a function `chunk_text(text: str, max_tokens: int = 15000) -> list[str]`. Use `tiktoken` (or a simple character-ratio approximation) to split massive texts at paragraph boundaries (`\n\n`) if they exceed the context window.
* **Key Concept:** Context Window Management — prevents API `HTTP 400 Context Length Exceeded` errors and unbounded FinOps costs.
* **Validation Criterion:** Passing a 50,000-word text string returns a list of smaller strings, none exceeding the defined token limit.

### Phase 4 Update: LLM Client

**Step 4.2.1 (Patch): JSON Schema Payload Integration**

* **Description:** Update `clients/llm_client.py`. Instead of just asking for JSON in the prompt, extract the schema using `AnalysisReport.model_json_schema()` and pass it to the API SDK (e.g., OpenAI's `response_format={"type": "json_schema", "json_schema": {"name": "report", "schema": ...}}`).
* **Key Concept:** API-Level Determinism — offloading schema compliance to the LLM provider's internal grammar constraints guarantees zero parsing errors.
* **Validation Criterion:** The API returns 100% compliant JSON on 50 consecutive calls at temperature `0.3` without ever outputting Markdown blockticks.

### Phase 7 Update: Local Caching

**Step 7.1.1 (Patch): Schema-Aware Cache Keys**

* **Description:** Add `SCHEMA_VERSION = "1.0"` to `config.py`. Update the hashing function in `utils/cache.py` to concatenate `text + model + SCHEMA_VERSION` before hashing.
* **Key Concept:** Cache Poisoning Prevention — decoupling the cached payloads from future code updates.
* **Validation Criterion:** Changing `SCHEMA_VERSION` to `"1.1"` forces a cache miss on previously processed URLs, triggering a fresh API call.

### Phase 8 Update: Network Resilience

**Step 8.1.1 (Patch): Dynamic `Retry-After` Interceptor**

* **Description:** Inside `llm_client.py`, wrap the API call in a `try/except` block *inside* the Tenacity decorated function. Catch `httpx.HTTPStatusError`. If `status_code == 429` and `'Retry-After'` is in the headers, execute `time.sleep(int(headers['Retry-After']))` before re-raising the exception for Tenacity to catch.
* **Key Concept:** Provider Compliance — respecting explicit server backoff requests prevents IP bans.
* **Validation Criterion:** A mocked 429 response with `Retry-After: 30` causes the application to pause for exactly 30 seconds before Tenacity logs the next attempt.
