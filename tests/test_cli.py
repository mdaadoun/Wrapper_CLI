"""
CLI integration tests for AI Watcher.
Tests the Typer CLI entrypoint through the CliRunner.
"""

import runpy
import sys
from unittest.mock import patch

import pytest
from ai_watcher.main import app
from typer.testing import CliRunner

runner = CliRunner()


def test_app_help():
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    assert (
        "AI Watcher CLI: Automated content extraction and AI analysis" in result.stdout
    )


def test_scan_help():
    result = runner.invoke(app, ["scan", "--help"])
    assert result.exit_code == 0
    assert "Scan and analyze tech content from text, file, or URL." in result.stdout
    assert "--text" in result.stdout
    assert "--file" in result.stdout
    assert "--url" in result.stdout


def test_scan_auto_detection_text():
    result = runner.invoke(app, ["scan", "Hello World"])
    assert result.exit_code == 0
    assert "Scanning source [text mode]: Hello World" in result.stdout
    assert "Extracted" in result.stdout


def test_scan_auto_detection_url():
    """URL auto-detection works; extraction is mocked to avoid network I/O."""
    with patch("ai_watcher.core.extractor.extract_from_url", return_value="content"):
        result = runner.invoke(app, ["scan", "https://example.com"])
    assert result.exit_code == 0
    assert "Scanning source [url mode]: https://example.com" in result.stdout


def test_scan_auto_detection_file(tmp_path):
    sample = tmp_path / "test.md"
    sample.write_text("real content here")
    result = runner.invoke(app, ["scan", str(sample)])
    assert result.exit_code == 0
    assert f"Scanning source [file mode]: {sample}" in result.stdout
    assert "Extracted" in result.stdout


def test_scan_explicit_text_flag():
    result = runner.invoke(app, ["scan", "-t", "Hello World"])
    assert result.exit_code == 0
    assert "Scanning source [text mode]: Hello World" in result.stdout


def test_scan_explicit_file_flag():
    """Force file mode on a non-existent file → exits 1 with clean error."""
    result = runner.invoke(app, ["scan", "--file", "document.md"])
    assert result.exit_code == 1
    assert "Error:" in result.stderr


def test_scan_explicit_url_flag():
    """Force URL mode; extraction is mocked to avoid network I/O."""
    with patch("ai_watcher.core.extractor.extract_from_url", return_value="content"):
        result = runner.invoke(app, ["scan", "-u", "https://example.com"])
    assert result.exit_code == 0
    assert "Scanning source [url mode]: https://example.com" in result.stdout


def test_scan_empty_source_exit_code():
    result = runner.invoke(app, ["scan", "   "])
    assert result.exit_code == 1
    assert "Error: Source cannot be empty or whitespace-only." in result.stderr


def test_main_module_execution(monkeypatch):
    monkeypatch.setattr(sys, "argv", ["main.py", "--help"])
    with pytest.raises(SystemExit) as exc_info:
        runpy.run_module("ai_watcher.main", run_name="__main__")
    assert exc_info.value.code == 0
