"""
Unit tests for configuration loading.
"""

import pytest
from ai_watcher.config import get_settings
from ai_watcher.exceptions import ConfigurationError


def test_missing_api_key_raises_error(monkeypatch: pytest.MonkeyPatch) -> None:
    """Ensure missing API key environment variables raise ConfigurationError."""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("AI_WATCHER_API_KEY", raising=False)

    with pytest.raises(ConfigurationError) as exc_info:
        get_settings()

    assert "Missing API key environment variable" in str(exc_info.value)


def test_valid_config_loads_successfully(monkeypatch: pytest.MonkeyPatch) -> None:
    """Ensure valid environment variables load settings successfully."""
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    settings = get_settings()
    assert settings.gemini_api_key.get_secret_value() == "test-key"
    assert settings.model_name == "gemini-1.5-pro-latest"
