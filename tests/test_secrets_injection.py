"""
Unit tests for Step 10.2: Runtime Secrets Injection.
Verifies dynamic env var secret injection and error handling.
"""

from unittest.mock import patch

import pytest
from ai_watcher.clients import get_mock_analysis_report
from ai_watcher.config import get_settings
from ai_watcher.exceptions import ConfigurationError
from ai_watcher.main import app
from typer.testing import CliRunner

runner = CliRunner()


def test_runtime_secrets_gemini_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify GEMINI_API_KEY environment variable is dynamically resolved."""
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setenv("GEMINI_API_KEY", "sk-gemini-test-123")

    settings = get_settings()
    assert settings.gemini_api_key.get_secret_value() == "sk-gemini-test-123"


def test_runtime_secrets_openai_api_key_alias(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify OPENAI_API_KEY environment variable acts as alias fallback."""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setenv("OPENAI_API_KEY", "sk-openai-test-456")

    settings = get_settings()
    assert settings.gemini_api_key.get_secret_value() == "sk-openai-test-456"


def test_runtime_secrets_missing_key_raises_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Verify missing API key environment variables raise ConfigurationError."""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("AI_WATCHER_API_KEY", raising=False)

    with pytest.raises(ConfigurationError) as exc_info:
        get_settings()

    assert "Missing API key environment variable" in str(exc_info.value)


def test_cli_execution_without_env_var_exits_cleanly(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Verify CLI scan without API key env var exits with code 1 and clear error message."""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("AI_WATCHER_API_KEY", raising=False)

    result = runner.invoke(app, ["scan", "Test content without API key"])

    assert result.exit_code == 1
    assert "Missing API key environment variable" in result.output
    assert "Traceback" not in result.output


def test_cli_execution_with_runtime_injected_openai_key(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Verify CLI scan with runtime injected OPENAI_API_KEY succeeds."""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setenv("OPENAI_API_KEY", "sk-runtime-injected-key")

    with patch("ai_watcher.main.LLMClient.analyze") as mock_analyze:
        mock_analyze.return_value = get_mock_analysis_report()
        result = runner.invoke(app, ["scan", "Runtime secret injection test content"])

    assert result.exit_code == 0
    assert "Executive Summary" in result.output
