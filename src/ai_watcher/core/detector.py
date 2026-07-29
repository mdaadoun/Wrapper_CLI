"""
Source type detection logic.
"""

from enum import Enum
from pathlib import Path

from src.ai_watcher.exceptions import EmptySourceError


class SourceType(str, Enum):
    """Enumeration of supported input source types."""

    TEXT = "text"
    FILE = "file"
    URL = "url"


def detect_source_type(
    source: str,
    force_text: bool = False,
    force_file: bool = False,
    force_url: bool = False,
) -> SourceType:
    """
    Detect source type (URL, FILE, or TEXT) or apply forced mode flag.
    Raises EmptySourceError if source is empty or whitespace-only.
    """
    if not source or not source.strip():
        raise EmptySourceError("Source cannot be empty or whitespace-only.")

    if force_text:
        return SourceType.TEXT
    if force_file:
        return SourceType.FILE
    if force_url:
        return SourceType.URL

    stripped = source.strip()
    if stripped.startswith(("http://", "https://")):
        return SourceType.URL

    try:
        if Path(stripped).is_file():
            return SourceType.FILE
    except (ValueError, OSError):
        # Invalid path characters (e.g., null bytes) → fall through to TEXT
        pass

    return SourceType.TEXT
