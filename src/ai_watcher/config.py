"""
Application configuration via Pydantic BaseSettings.
Loads environment variables from .env file.
"""

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration settings for AI Watcher."""

    # LLM API Settings
    openai_api_key: SecretStr | None = None

    # FinOps Settings
    cost_per_1k_prompt_tokens: float = 0.01
    cost_per_1k_completion_tokens: float = 0.03

    # Behavior Settings
    max_retries: int = 4
    cache_ttl_seconds: int = 86400

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
