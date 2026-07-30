import pytest
from ai_watcher.exceptions import (
    ConfigurationError,
    EmptySourceError,
    ExtractionError,
    LLMClientError,
    WatcherError,
)


def test_exception_hierarchy() -> None:
    """Ensure all custom exceptions inherit from WatcherError."""
    assert issubclass(EmptySourceError, WatcherError)
    assert issubclass(ExtractionError, WatcherError)
    assert issubclass(LLMClientError, WatcherError)
    assert issubclass(ConfigurationError, WatcherError)
    assert issubclass(WatcherError, Exception)


def test_raise_empty_source_error() -> None:
    """Ensure EmptySourceError can be raised and caught."""
    with pytest.raises(EmptySourceError) as exc_info:
        raise EmptySourceError("Source is empty")
    assert "Source is empty" in str(exc_info.value)


def test_raise_extraction_error() -> None:
    """Ensure ExtractionError can be raised and caught."""
    with pytest.raises(ExtractionError) as exc_info:
        raise ExtractionError("Extraction failed")
    assert "Extraction failed" in str(exc_info.value)


def test_raise_llm_client_error() -> None:
    """Ensure LLMClientError can be raised and caught."""
    with pytest.raises(LLMClientError) as exc_info:
        raise LLMClientError("LLM error")
    assert "LLM error" in str(exc_info.value)


def test_raise_configuration_error() -> None:
    """Ensure ConfigurationError can be raised and caught."""
    with pytest.raises(ConfigurationError) as exc_info:
        raise ConfigurationError("Config error")
    assert "Config error" in str(exc_info.value)


def test_catch_base_error() -> None:
    """Ensure specific errors can be caught via the base class."""
    try:
        raise ConfigurationError("Caught by base")
    except WatcherError as e:
        assert "Caught by base" in str(e)
        assert isinstance(e, ConfigurationError)
