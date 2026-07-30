"""FinOps cost calculator module for model token pricing."""

from typing import Dict

# Pricing dictionary in USD per 1,000 tokens
MODEL_PRICING: Dict[str, Dict[str, float]] = {
    "gemini-1.5-pro-latest": {"input_per_1k": 0.0035, "output_per_1k": 0.0105},
    "gemini-1.5-flash": {"input_per_1k": 0.00035, "output_per_1k": 0.00105},
    "gemini-2.0-flash": {"input_per_1k": 0.0001, "output_per_1k": 0.0004},
    "gpt-4o": {"input_per_1k": 0.0025, "output_per_1k": 0.0100},
    "gpt-4o-mini": {"input_per_1k": 0.00015, "output_per_1k": 0.0006},
}

DEFAULT_INPUT_COST_PER_1K: float = 0.001
DEFAULT_OUTPUT_COST_PER_1K: float = 0.002


def calculate_cost(
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
) -> float:
    """Compute financial cost in USD for model token usage."""
    pricing = MODEL_PRICING.get(model.lower())
    if pricing:
        input_rate = pricing["input_per_1k"]
        output_rate = pricing["output_per_1k"]
    else:
        input_rate = DEFAULT_INPUT_COST_PER_1K
        output_rate = DEFAULT_OUTPUT_COST_PER_1K

    cost = (prompt_tokens / 1000.0 * input_rate) + (
        completion_tokens / 1000.0 * output_rate
    )
    return round(cost, 6)
