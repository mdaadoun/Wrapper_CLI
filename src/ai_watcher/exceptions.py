"""
Custom domain exceptions for AI Watcher CLI.
"""


class AIWatcherError(Exception):
    """Base exception for all AI Watcher errors."""

    pass


class ConfigurationError(AIWatcherError):
    """Raised when environment variables or config is missing/invalid."""

    pass


class ExtractionError(AIWatcherError):
    """Raised when content extraction fails."""

    pass


class LLMAPIError(AIWatcherError):
    """Raised when the LLM API returns an error or times out."""

    pass
