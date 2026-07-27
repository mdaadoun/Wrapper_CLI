from pathlib import Path

import pytest

from src.ai_watcher.core.extractor import extract_from_file, extract_from_text
from src.ai_watcher.exceptions import ExtractionError


def test_extract_from_text_normalization() -> None:
    """Ensure raw text is properly whitespace-normalized."""
    raw = "Hello   \t  World!\n\nThis is a    test."
    expected = "Hello World!\nThis is a test."
    assert extract_from_text(raw) == expected


def test_extract_from_text_empty() -> None:
    """Ensure empty text returns empty string."""
    assert extract_from_text("") == ""
    assert extract_from_text("   \n  ") == ""


def test_extract_from_file_valid_txt(tmp_path: Path) -> None:
    """Ensure a valid .txt file can be extracted."""
    test_file = tmp_path / "test.txt"
    test_file.write_text("Valid   text\n\nhere.", encoding="utf-8")
    assert extract_from_file(test_file) == "Valid text\nhere."


def test_extract_from_file_valid_md(tmp_path: Path) -> None:
    """Ensure a valid .md file can be extracted."""
    test_file = tmp_path / "test.md"
    test_file.write_text("# Title\n\nSome   content.", encoding="utf-8")
    assert extract_from_file(test_file) == "# Title\nSome content."


def test_extract_from_file_missing() -> None:
    """Ensure ExtractionError is raised when file does not exist."""
    missing_path = Path("/non/existent/path.txt")
    with pytest.raises(ExtractionError, match="File not found"):
        extract_from_file(missing_path)


def test_extract_from_file_invalid_extension(tmp_path: Path) -> None:
    """Ensure ExtractionError is raised for unsupported extensions."""
    test_file = tmp_path / "test.pdf"
    test_file.write_text("Fake PDF content", encoding="utf-8")
    with pytest.raises(ExtractionError, match="Unsupported file extension"):
        extract_from_file(test_file)


def test_extract_from_file_directory(tmp_path: Path) -> None:
    """Ensure ExtractionError is raised when path is a directory."""
    with pytest.raises(ExtractionError, match="Path is not a regular file"):
        extract_from_file(tmp_path)
