"""Unit tests for Step 8.2: Graceful Failure and Exit Codes."""

from unittest.mock import MagicMock, patch

import pytest
from ai_watcher.exceptions import LLMRetryableError
from ai_watcher.formatters import display_error
from ai_watcher.main import app
from rich.console import Console
from typer.testing import CliRunner

runner = CliRunner()


def test_display_error_renders_red_panel() -> None:
    """Verify display_error renders the error message inside a Rich Panel on the console."""
    test_console = Console(record=True, width=80)
    display_error("Test failure message", console_instance=test_console)
    output = test_console.export_text()

    assert "Test failure message" in output
    assert "Error" in output


def test_scan_graceful_failure_network_outage(monkeypatch: pytest.MonkeyPatch) -> None:
    """Simulate complete network outage (4 retry failures) asserting exit status code 1 and '❌ Failed after 4 attempts' in Rich panel."""
    monkeypatch.setenv("GEMINI_API_KEY", "fake-api-key")

    with patch("ai_watcher.main.LLMClient") as MockLLMClient:
        mock_instance = MagicMock()
        mock_instance.analyze.side_effect = LLMRetryableError(
            "❌ Failed after 4 attempts: LLM API request error: Connection refused"
        )
        MockLLMClient.return_value = mock_instance

        result = runner.invoke(app, ["scan", "Network failure test content"])

    assert result.exit_code == 1
    assert "❌ Failed after 4 attempts" in result.output
    assert "Traceback (most recent call last)" not in result.output


def test_scan_graceful_failure_domain_error() -> None:
    """Verify domain WatcherError (e.g. empty source) exits with code 1 and clean error panel."""
    result = runner.invoke(app, ["scan", "   "])
    assert result.exit_code == 1
    assert "Error" in result.output
    assert "Source cannot be empty" in result.output
    assert "Traceback (most recent call last)" not in result.output


def test_scan_graceful_failure_unexpected_exception() -> None:
    """Verify unhandled generic Exception is caught gracefully without exposing Python tracebacks."""
    with patch(
        "ai_watcher.main.extract", side_effect=RuntimeError("Unexpected OS Failure")
    ):
        result = runner.invoke(app, ["scan", "Sample input"])

    assert result.exit_code == 1
    assert "Unexpected error" in result.output
    assert "Unexpected OS Failure" in result.output
    assert "Traceback (most recent call last)" not in result.output
