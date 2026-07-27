"""
Data extraction module for AI Watcher CLI.
Implements pure functions for predictable I/O and text processing.
"""

import re
from pathlib import Path

from src.ai_watcher.exceptions import ExtractionError


def extract_from_text(raw: str) -> str:
    """
    Normalize whitespaces in raw text.
    Replaces multiple spaces, tabs, and newlines with single spaces/newlines.
    """
    if not raw:
        return ""
    # Normalize multiple spaces/tabs to a single space, keeping newlines.
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in raw.splitlines()]
    # Remove empty lines that are redundant
    text = "\n".join(line for line in lines if line)
    return text


def extract_from_file(path: Path) -> str:
    """
    Read and extract text from a local .txt or .md file.
    Raises ExtractionError on failure.
    """
    if not path.exists():
        raise ExtractionError(f"File not found: {path}")

    if not path.is_file():
        raise ExtractionError(f"Path is not a regular file: {path}")

    if path.suffix.lower() not in (".txt", ".md"):
        raise ExtractionError(
            f"Unsupported file extension '{path.suffix}'. Only .txt and .md are supported."
        )

    try:
        content = path.read_text(encoding="utf-8")
        return extract_from_text(content)
    except Exception as e:
        raise ExtractionError(f"Failed to read file {path}: {str(e)}") from e
