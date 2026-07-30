# Dev Journal Session 7.1: SHA-256 Content Hash Persistence

**Date:** 2026-07-30

Implemented SHA-256 content hashing and disk-backed local JSON caching to bypass LLM inference calls for identical inputs.

---

### 1. Concepts Introduced

- **SHA-256 Content Hashing:** Idempotent digest calculation for extracted input text to uniquely identify identical content.
- **Local JSON Disk Cache Persistence:** Zero-latency cache lookup stored at `~/.cache/ai_watcher/cache.json` bypassing LLM inference API calls.
- **TTL (Time-to-Live) Freshness Validation:** Automatic invalidation of stale analysis records based on creation timestamps.

---

### 2. Architecture Decisions (ADR)

#### ADR 1: Modular ContentCache Utility in `utils/cache.py`
- **Option 1 (Embed cache logic directly inside main CLI or LLMClient):** Tightly coupled caching inside business logic.
- **Option 2 (Selected - Dedicated ContentCache utility module):** Decouple cache management from CLI UI and LLM client logic into `utils/cache.py`.
- **Rationale:** Maintains Single Responsibility Principle (SRP) and enables isolated unit testing of cache persistence.

#### ADR 2: Hashing Raw Extracted Content vs Source Path
- **Option 1 (Hash input source string like file path or URL):** Cache key based on input string.
- **Option 2 (Selected - Hash raw extracted text content):** Compute SHA-256 digest on raw extracted text.
- **Rationale:** Guarantees true content idempotency across different file paths or web endpoints containing identical text.

#### ADR 3: Graceful Fallback on Cache Corruption
- **Option 1 (Raise exception on corrupt JSON cache file):** Fail execution when cache file is corrupted.
- **Option 2 (Selected - Defensive error handling returning cache miss):** Wrap file I/O and Pydantic parsing in try-except blocks.
- **Rationale:** Prevents CLI crashes when reading invalid or corrupted cache files, defaulting cleanly to cache miss.

---

### 3. Implementation & Code

```python
# src/ai_watcher/utils/cache.py
def compute_content_hash(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()

class ContentCache:
    def get(self, content_hash: str) -> Optional[AnalysisReport]:
        cache_data = self._load()
        entry = cache_data.get(content_hash)
        if not entry:
            return None
        ...
        report_dict["is_cached"] = True
        return AnalysisReport(**report_dict)
```

Validation:
```bash
cd projets/3_Wrapper_CLI
./.venv/bin/pytest tests/test_cache.py tests/test_cli.py -v
```

---

### 4. Session Checklist & Deliverables

1. [x] `src/ai_watcher/utils/cache.py` created with `ContentCache` class and `compute_content_hash` helper.
2. [x] Integrated cache lookup & persistence into `src/ai_watcher/main.py` scan command.
3. [x] Added `[CACHE HIT]` indicator badge to console formatter in `src/ai_watcher/formatters/console.py`.
4. [x] Created unit test suite in `tests/test_cache.py` achieving 100% line coverage for cache module.
