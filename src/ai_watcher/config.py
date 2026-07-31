"""
Application configuration via Pydantic BaseSettings.
Loads runtime environment variables dynamically.
"""

from ai_watcher.exceptions import ConfigurationError
from pydantic import AliasChoices, Field, SecretStr, ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration settings for AI Watcher CLI."""

    gemini_api_key: SecretStr = Field(
        ...,
        validation_alias=AliasChoices(
            "GEMINI_API_KEY", "OPENAI_API_KEY", "AI_WATCHER_API_KEY"
        ),
        description="Runtime API key.",
    )
    model_name: str = "gemini-1.5-pro-latest"
    max_tokens: int = 8192

    cost_per_1k_prompt_tokens: float = 0.01
    cost_per_1k_completion_tokens: float = 0.03

    max_retries: int = 4
    cache_ttl_seconds: int = 3600

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


def get_settings() -> Settings:
    """Load runtime settings or raise ConfigurationError."""
    try:
        return Settings()  # type: ignore[call-arg]
    except ValidationError as e:
        raise ConfigurationError(
            "Missing API key environment variable. Provide GEMINI_API_KEY or OPENAI_API_KEY at runtime: "
            "e.g. docker run -e OPENAI_API_KEY=sk-... ai-watcher scan '...'"
        ) from e


try:
    settings = get_settings()
except ConfigurationError:
    settings = None  # type: ignore[assignment]
