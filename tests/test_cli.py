"""
CLI integration tests for AI Watcher.
Tests the Typer CLI entrypoint through the CliRunner.
"""

import runpy
import sys
from unittest.mock import patch

import pytest
from ai_watcher.clients import get_mock_analysis_report
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


def test_scan_auto_detection_text(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "fake-api-key")
    with patch("ai_watcher.main.LLMClient.analyze") as mock_analyze:
        mock_analyze.return_value = get_mock_analysis_report()
        result = runner.invoke(app, ["scan", "Hello World"])
    assert result.exit_code == 0
    assert "Scanning source [text mode]: Hello World" in result.stdout
    assert "Extracted" in result.stdout


def test_scan_auto_detection_url(monkeypatch):
    """URL auto-detection works; extraction and LLM client are mocked to avoid network I/O."""
    monkeypatch.setenv("GEMINI_API_KEY", "fake-api-key")
    with (
        patch("ai_watcher.core.extractor.extract_from_url", return_value="content"),
        patch("ai_watcher.main.LLMClient.analyze") as mock_analyze,
    ):
        mock_analyze.return_value = get_mock_analysis_report()
        result = runner.invoke(app, ["scan", "https://example.com"])
    assert result.exit_code == 0
    assert "Scanning source [url mode]: https://example.com" in result.stdout


def test_scan_auto_detection_file(tmp_path, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "fake-api-key")
    sample = tmp_path / "test.md"
    sample.write_text("real content here")
    with patch("ai_watcher.main.LLMClient.analyze") as mock_analyze:
        mock_analyze.return_value = get_mock_analysis_report()
        result = runner.invoke(app, ["scan", str(sample)])
    assert result.exit_code == 0
    assert f"Scanning source [file mode]: {sample}" in result.stdout
    assert "Extracted" in result.stdout


def test_scan_explicit_text_flag(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "fake-api-key")
    with patch("ai_watcher.main.LLMClient.analyze") as mock_analyze:
        mock_analyze.return_value = get_mock_analysis_report()
        result = runner.invoke(app, ["scan", "-t", "Hello World"])
    assert result.exit_code == 0
    assert "Scanning source [text mode]: Hello World" in result.stdout


def test_scan_explicit_file_flag():
    """Force file mode on a non-existent file → exits 1 with clean error."""
    result = runner.invoke(app, ["scan", "--file", "document.md"])
    assert result.exit_code == 1
    assert "Error:" in result.stderr


def test_scan_explicit_url_flag(monkeypatch):
    """Force URL mode; extraction and LLM client are mocked to avoid network I/O."""
    monkeypatch.setenv("GEMINI_API_KEY", "fake-api-key")
    with (
        patch("ai_watcher.core.extractor.extract_from_url", return_value="content"),
        patch("ai_watcher.main.LLMClient.analyze") as mock_analyze,
    ):
        mock_analyze.return_value = get_mock_analysis_report()
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


def test_scan_demo_mode_text():
    """Verify scan in demo mode executes pipeline with zero network calls."""
    result = runner.invoke(app, ["scan", "Hello World", "--demo"])
    assert result.exit_code == 0
    assert "Scanning source [text mode]: Hello World" in result.stdout
    assert "Executing in DEMO mode" in result.stdout
    assert "--- ANALYSIS REPORT ---" in result.stdout
    assert "[DEMO]" in result.stdout
    assert "--- FINOPS METRICS ---" in result.stdout


def test_scan_demo_mode_short_flag():
    """Verify short flag -d triggers demo mode."""
    result = runner.invoke(app, ["scan", "Sample text", "-d"])
    assert result.exit_code == 0
    assert "Executing in DEMO mode" in result.stdout
    assert "--- ANALYSIS REPORT ---" in result.stdout


def test_scan_demo_mode_file(tmp_path):
    """Verify demo mode with file source."""
    sample = tmp_path / "article.txt"
    sample.write_text("Detailed article content about AI engineering.")
    result = runner.invoke(app, ["scan", str(sample), "--demo"])
    assert result.exit_code == 0
    assert f"Scanning source [file mode]: {sample}" in result.stdout
    assert "--- ANALYSIS REPORT ---" in result.stdout


def test_scan_demo_mode_url():
    """Verify demo mode with web URL source."""
    with patch(
        "ai_watcher.core.extractor.extract_from_url", return_value="Web content"
    ):
        result = runner.invoke(app, ["scan", "https://news.ycombinator.com", "--demo"])
    assert result.exit_code == 0
    assert "Scanning source [url mode]: https://news.ycombinator.com" in result.stdout
    assert "--- ANALYSIS REPORT ---" in result.stdout
