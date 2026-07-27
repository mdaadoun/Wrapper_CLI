import pytest

from src.ai_watcher.core.detector import SourceType, detect_source_type
from src.ai_watcher.exceptions import EmptySourceError


def test_detect_url():
    assert detect_source_type("https://example.com") == SourceType.URL
    assert detect_source_type("http://localhost:8000/doc") == SourceType.URL


def test_detect_file(tmp_path):
    test_file = tmp_path / "sample.txt"
    test_file.write_text("hello")
    assert detect_source_type(str(test_file)) == SourceType.FILE


def test_detect_raw_text():
    assert detect_source_type("Just a raw text line") == SourceType.TEXT
    assert detect_source_type("non_existent_file.txt") == SourceType.TEXT


def test_detect_forced_flags(tmp_path):
    test_file = tmp_path / "sample.txt"
    test_file.write_text("hello")

    # Forced text mode over existing file path
    assert detect_source_type(str(test_file), force_text=True) == SourceType.TEXT
    # Forced url mode over text
    assert detect_source_type("some text", force_url=True) == SourceType.URL
    # Forced file mode over URL
    assert detect_source_type("https://example.com", force_file=True) == SourceType.FILE


def test_empty_source_raises():
    with pytest.raises(EmptySourceError):
        detect_source_type("")

    with pytest.raises(EmptySourceError):
        detect_source_type("   \n\t ")
