from pathlib import Path
from unittest.mock import MagicMock, patch

import httpx
import pytest

from src.ai_watcher.core.extractor import (
    extract_from_file,
    extract_from_text,
    extract_from_url,
)
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


def test_extract_from_url_success() -> None:
    """Ensure a valid URL returns clean text stripped of noisy tags."""
    html_content = """
    <html>
      <head><title>Test</title></head>
      <body>
        <nav>Ignore this</nav>
        <header>Header noise</header>
        <main>
            <h1>Main Title</h1>
            <p>This is  some   useful text.</p>
            <script>console.log("no!");</script>
        </main>
        <footer>Footer noise</footer>
      </body>
    </html>
    """
    mock_response = MagicMock()
    mock_response.text = html_content
    mock_response.raise_for_status = MagicMock()

    with patch("httpx.get", return_value=mock_response):
        result = extract_from_url("https://example.com")

    expected = "Test\nMain Title\nThis is some useful text."
    assert result == expected


def test_extract_from_url_http_error() -> None:
    """Ensure HTTP errors raise ExtractionError."""
    mock_response = MagicMock()
    mock_response.status_code = 404
    mock_error = httpx.HTTPStatusError(
        "404 Not Found", request=MagicMock(), response=mock_response
    )

    with patch("httpx.get", side_effect=mock_error):
        with pytest.raises(ExtractionError, match="HTTP Error 404"):
            extract_from_url("https://example.com/404")


def test_extract_from_url_network_error() -> None:
    """Ensure network errors raise ExtractionError."""
    with patch("httpx.get", side_effect=httpx.RequestError("Timeout")):
        with pytest.raises(ExtractionError, match="Network error"):
            extract_from_url("https://example.com/timeout")
