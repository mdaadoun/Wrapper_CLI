"""
Custom domain exceptions for Wrapper CLI.
Provides a granular Exception Hierarchy for targeted error handling.
"""


class WatcherError(Exception):
    """Base exception for all Watcher CLI domain errors."""

    pass


class EmptySourceError(WatcherError):
    """Raised when the input source is empty or whitespace-only."""

    pass


class ConfigurationError(WatcherError):
    """Raised when environment variables or config is missing/invalid."""

    pass


class ExtractionError(WatcherError):
    """Raised when content extraction fails."""

    pass


class LLMClientError(WatcherError):
    """Raised when the LLM API returns an error or times out."""

    pass


class LLMRetryableError(LLMClientError):
    """Raised when LLM API experiences transient retryable failure (429, 5xx, network error)."""

    pass


class UnknownModelError(WatcherError):
    """Raised when a model name is not found in the pricing matrix."""

    pass


class ExportError(WatcherError):
    """Raised when exporting report to file fails."""

    pass
