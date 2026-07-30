"""
Application configuration via Pydantic BaseSettings.
Loads environment variables from .env file.
"""

from ai_watcher.exceptions import ConfigurationError
from pydantic import SecretStr, ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration settings for AI Watcher."""

    # LLM API Settings
    gemini_api_key: SecretStr
    model_name: str = "gemini-1.5-pro-latest"
    max_tokens: int = 8192

    # FinOps Settings
    cost_per_1k_prompt_tokens: float = 0.01
    cost_per_1k_completion_tokens: float = 0.03

    # Behavior Settings
    max_retries: int = 4
    cache_ttl_seconds: int = 86400

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


def get_settings() -> Settings:
    """Load settings and raise domain exception if invalid."""
    try:
        return Settings()  # type: ignore[call-arg]
    except ValidationError as e:
        raise ConfigurationError(
            f"Missing or invalid configuration in .env file: {e}"
        ) from e


# Export a default instance for convenience where safe,
# though using get_settings() is preferred for proper error handling.
try:
    settings = get_settings()
except ConfigurationError:
    settings = None  # type: ignore[assignment]
