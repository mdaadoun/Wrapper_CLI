"""FinOps cost calculator for model token pricing.

Pricing matrix stores rates in USD per 1M tokens (industry standard).
"""

from ai_watcher.exceptions import UnknownModelError

# ---------------------------------------------------------------------------
# Model Pricing Matrix (USD per 1M tokens)
# Sources: OpenAI, Google AI, Anthropic, Meta, Mistral public pricing pages.
# Last updated: 2026-07
# ---------------------------------------------------------------------------
# Structure: {model_name: {"input_per_1m": float, "output_per_1m": float}}
MODEL_PRICING: dict[str, dict[str, float]] = {
    # OpenAI
    "gpt-4o": {"input_per_1m": 2.50, "output_per_1m": 10.00},
    "gpt-4o-mini": {"input_per_1m": 0.15, "output_per_1m": 0.60},
    "gpt-4-turbo": {"input_per_1m": 10.00, "output_per_1m": 30.00},
    "gpt-4": {"input_per_1m": 30.00, "output_per_1m": 60.00},
    "gpt-3.5-turbo": {"input_per_1m": 0.50, "output_per_1m": 1.50},
    "o1": {"input_per_1m": 15.00, "output_per_1m": 60.00},
    "o1-mini": {"input_per_1m": 3.00, "output_per_1m": 12.00},
    "o3-mini": {"input_per_1m": 1.10, "output_per_1m": 4.40},
    # Google Gemini
    "gemini-3.6-flash": {"input_per_1m": 1.50, "output_per_1m": 7.50},
    "gemini-3.5-flash": {"input_per_1m": 1.50, "output_per_1m": 9.00},
    "gemini-3.5-flash-lite": {"input_per_1m": 0.30, "output_per_1m": 2.50},
    "gemini-3.1-flash-lite": {"input_per_1m": 0.25, "output_per_1m": 1.50},
    "gemini-3.1-pro-preview": {"input_per_1m": 2.00, "output_per_1m": 12.00},
    "gemini-3-flash-preview": {"input_per_1m": 0.075, "output_per_1m": 0.30},
    "gemini-2.5-pro-exp-03-25": {"input_per_1m": 1.25, "output_per_1m": 10.00},
    "gemini-2.0-flash": {"input_per_1m": 0.10, "output_per_1m": 0.40},
    "gemini-2.0-flash-lite": {"input_per_1m": 0.075, "output_per_1m": 0.30},
    "gemini-1.5-pro-latest": {"input_per_1m": 3.50, "output_per_1m": 10.50},
    "gemini-1.5-flash": {"input_per_1m": 0.35, "output_per_1m": 1.05},
    "gemini-1.5-flash-8b": {"input_per_1m": 0.30, "output_per_1m": 0.90},
    # Anthropic
    "claude-3-5-sonnet-20241022": {"input_per_1m": 3.00, "output_per_1m": 15.00},
    "claude-3-5-haiku-20241022": {"input_per_1m": 0.80, "output_per_1m": 4.00},
    "claude-3-opus-20240229": {"input_per_1m": 15.00, "output_per_1m": 75.00},
    "claude-3-sonnet-20240229": {"input_per_1m": 3.00, "output_per_1m": 15.00},
    "claude-3-haiku-20240307": {"input_per_1m": 0.25, "output_per_1m": 1.25},
    "claude-4-opus": {"input_per_1m": 15.00, "output_per_1m": 75.00},
    "claude-4-sonnet": {"input_per_1m": 3.00, "output_per_1m": 15.00},
    # Meta / Llama (via providers like Together, Groq, AWS Bedrock)
    "llama-3.1-405b": {"input_per_1m": 2.00, "output_per_1m": 2.00},
    "llama-3.1-70b": {"input_per_1m": 0.59, "output_per_1m": 0.79},
    "llama-3.1-8b": {"input_per_1m": 0.06, "output_per_1m": 0.06},
    "llama-3.2-90b": {"input_per_1m": 0.90, "output_per_1m": 0.90},
    "llama-3.2-11b": {"input_per_1m": 0.10, "output_per_1m": 0.10},
    "llama-3.2-3b": {"input_per_1m": 0.03, "output_per_1m": 0.03},
    "llama-3.2-1b": {"input_per_1m": 0.015, "output_per_1m": 0.015},
    # Mistral
    "mistral-large-2407": {"input_per_1m": 2.00, "output_per_1m": 6.00},
    "mistral-small-2402": {"input_per_1m": 1.00, "output_per_1m": 3.00},
    "mistral-7b": {"input_per_1m": 0.25, "output_per_1m": 0.25},
    "codestral-2405": {"input_per_1m": 1.00, "output_per_1m": 3.00},
    "mixtral-8x7b": {"input_per_1m": 0.50, "output_per_1m": 0.50},
    "mixtral-8x22b": {"input_per_1m": 1.00, "output_per_1m": 1.00},
    # DeepSeek
    "deepseek-v4-flash": {"input_per_1m": 0.0896, "output_per_1m": 0.1792},
    "deepseek-v4-pro": {"input_per_1m": 0.435, "output_per_1m": 0.87},
    "deepseek-chat": {"input_per_1m": 0.14, "output_per_1m": 0.28},
    "deepseek-reasoner": {"input_per_1m": 0.55, "output_per_1m": 2.19},
    # Cohere
    "command-r-plus-08-2024": {"input_per_1m": 2.50, "output_per_1m": 10.00},
    "command-r-08-2024": {"input_per_1m": 0.50, "output_per_1m": 1.50},
    # Amazon Nova
    "amazon-nova-pro": {"input_per_1m": 0.80, "output_per_1m": 3.20},
    "amazon-nova-lite": {"input_per_1m": 0.06, "output_per_1m": 0.24},
    "amazon-nova-micro": {"input_per_1m": 0.035, "output_per_1m": 0.14},
}


def calculate_cost(
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
) -> float:
    """Compute financial cost in USD for model token usage.

    Args:
        model: Model identifier (case-insensitive lookup).
        prompt_tokens: Number of input/prompt tokens.
        completion_tokens: Number of output/completion tokens.

    Returns:
        Total cost in USD, rounded to 6 decimal places.

    Raises:
        UnknownModelError: If model is not found in the pricing matrix.
    """
    pricing = MODEL_PRICING.get(model.lower())
    if pricing is None:
        raise UnknownModelError(
            f"Unknown model '{model}'. Add it to MODEL_PRICING in "
            f"utils/cost.py or use a supported model. "
            f"Supported models: {', '.join(sorted(MODEL_PRICING.keys()))}"
        )

    cost = (prompt_tokens / 1_000_000.0 * pricing["input_per_1m"]) + (
        completion_tokens / 1_000_000.0 * pricing["output_per_1m"]
    )
    return round(cost, 6)
