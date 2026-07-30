"""SHA-256 content hash persistence cache module."""

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from ai_watcher.schemas.report import AnalysisReport


def compute_content_hash(content: str) -> str:
    """Compute SHA-256 hex digest for given text content."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


class ContentCache:
    """Manages local JSON caching of analysis reports by SHA-256 content hash."""

    def __init__(
        self,
        cache_file: Optional[Path | str] = None,
        auto_purge: bool = True,
    ) -> None:
        """Initialize ContentCache with target cache file path and optional auto-purge."""
        if cache_file:
            self.cache_file = Path(cache_file)
        else:
            self.cache_file = Path.home() / ".cache" / "ai_watcher" / "cache.json"
        if auto_purge and self.cache_file.exists():
            self.purge_expired()

    def get(
        self,
        content_hash: str,
        ttl: Optional[int] = None,
    ) -> Optional[AnalysisReport]:
        """Retrieve cached report if present and not expired."""
        cache_data = self._load()
        entry = cache_data.get(content_hash)
        if not entry:
            return None

        created_at_str = entry.get("created_at")
        effective_ttl = ttl if ttl is not None else entry.get("ttl", 3600)
        if effective_ttl <= 0:
            return None

        if created_at_str:
            try:
                created_at = datetime.fromisoformat(created_at_str)
                now = datetime.now(timezone.utc)
                if (now - created_at).total_seconds() > effective_ttl:
                    return None
            except ValueError:
                return None

        report_dict = entry.get("report")
        if not report_dict:
            return None

        report_dict["is_cached"] = True
        try:
            return AnalysisReport(**report_dict)
        except Exception:
            return None

    def set(
        self,
        content_hash: str,
        report: AnalysisReport,
        ttl: int = 3600,
    ) -> None:
        """Persist analysis report with content hash and timestamp."""
        cache_data = self._load()
        cache_data[content_hash] = {
            "hash": content_hash,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "ttl": ttl,
            "report": report.model_dump(mode="json"),
        }
        self._save(cache_data)

    def purge_expired(self) -> int:
        """Purge all expired cache entries from disk. Returns count of purged entries."""
        cache_data = self._load()
        if not cache_data:
            return 0

        now = datetime.now(timezone.utc)
        purged_count = 0
        valid_data: Dict[str, Any] = {}

        for key, entry in cache_data.items():
            if not isinstance(entry, dict):
                purged_count += 1
                continue
            created_at_str = entry.get("created_at")
            entry_ttl = entry.get("ttl", 3600)
            if not created_at_str:
                purged_count += 1
                continue
            try:
                created_at = datetime.fromisoformat(created_at_str)
                if (now - created_at).total_seconds() > entry_ttl:
                    purged_count += 1
                else:
                    valid_data[key] = entry
            except (ValueError, TypeError):
                purged_count += 1

        if purged_count > 0:
            self._save(valid_data)
        return purged_count

    def clear(self) -> None:
        """Purge local cache file."""
        if self.cache_file.exists():
            try:
                self.cache_file.unlink()
            except OSError:
                pass

    def _load(self) -> Dict[str, Any]:
        """Safely load cache JSON data from disk."""
        if not self.cache_file.exists():
            return {}
        try:
            with open(self.cache_file, "r", encoding="utf-8") as f:
                content = json.load(f)
                return content if isinstance(content, dict) else {}
        except (json.JSONDecodeError, OSError):
            return {}

    def _save(self, data: Dict[str, Any]) -> None:
        """Safely write cache JSON data to disk."""
        try:
            self.cache_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except OSError:
            pass
