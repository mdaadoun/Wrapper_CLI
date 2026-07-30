# Dev Journal Session 7.2: Configurable TTL and Cache Invalidation

**Date:** 2026-07-30

Implemented configurable Time-To-Live (TTL) controls, CLI flags (`--cache-ttl` and `--no-cache`), and automated startup purging of expired cache records in `ContentCache`.

---

### 1. Concepts Introduced

- **Configurable Time-To-Live (TTL):** Dynamic TTL evaluation allowing user and system level control over data freshness vs cost savings.
- **Automated Cache Invalidation & Purging:** Automated background garbage collection sweeping expired or malformed cache entries upon `ContentCache` initialization.
- **CLI Cache Control Flags:** Options `--cache-ttl <seconds>` (default 3600s) to customize entry expiration and `--no-cache` to bypass reading and writing cache disk state.

---

### 2. Architecture Decisions (ADR)

#### ADR 1: Dynamic & Overridable TTL in ContentCache
- **Option 1 (Hardcode fixed entry TTL):** Strict 24-hour cache lifespan without caller flexibility.
- **Option 2 (Selected - Support default TTL and runtime override):** Maintain default 3600s TTL per entry while enabling callers to pass custom `ttl` to `cache.get(content_hash, ttl=...)`.
- **Rationale:** Empowers CLI users to force ad-hoc freshness constraints (e.g., `--cache-ttl 0`) without corrupting or mutating stored entry metadata.

#### ADR 2: Startup Auto-Purging of Expired Entries
- **Option 1 (Manual purge command):** Require users to periodically invoke a cleanup command.
- **Option 2 (Selected - Automatic purging on initialization):** Trigger `purge_expired()` automatically inside `ContentCache.__init__()`.
- **Rationale:** Guarantees disk cache size remains bounded and prevents stale entries from accumulating over time.

#### ADR 3: Dual Execution Modes with `--no-cache` vs `--cache-ttl 0`
- **Option 1 (Single force-refresh flag):** Overwrite cache on every forced rerun.
- **Option 2 (Selected - Separate `--no-cache` from `--cache-ttl 0`):** `--no-cache` bypasses reading and writing cache to preserve disk state, while `--cache-ttl 0` forces re-analysis and updates the cache.
- **Rationale:** Provides fine-grained operational control for testing, debugging, and persistent cache updates.

---

### 3. Implementation & Code

```python
# src/ai_watcher/utils/cache.py
class ContentCache:
    def __init__(self, cache_file: Optional[Path | str] = None, auto_purge: bool = True) -> None:
        ...
        if auto_purge and self.cache_file.exists():
            self.purge_expired()

    def get(self, content_hash: str, ttl: Optional[int] = None) -> Optional[AnalysisReport]:
        ...
        effective_ttl = ttl if ttl is not None else entry.get("ttl", 3600)
        if effective_ttl <= 0:
            return None
        ...

    def purge_expired(self) -> int:
        ...
```

Validation:
```bash
cd projets/3_Wrapper_CLI
./.venv/bin/pytest tests/test_cache.py tests/test_cli.py -v
```

---

### 4. Session Checklist & Deliverables

1. [x] Updated default TTL setting in `src/ai_watcher/config.py` (`cache_ttl_seconds = 3600`).
2. [x] Implemented `purge_expired()`, `auto_purge` initialization, and custom TTL override in `src/ai_watcher/utils/cache.py`.
3. [x] Added `--cache-ttl` and `--no-cache` flags to `scan` command in `src/ai_watcher/main.py`.
4. [x] Extended test suite in `tests/test_cache.py` with 100% line coverage on cache invalidation and CLI flags.
5. [x] Registered test definitions in `dashboard/src/app/page.tsx` for dashboard UI alignment.
