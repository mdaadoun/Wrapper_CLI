"""Unit test suite for FinOps cost calculation functions."""

from ai_watcher.utils.cost import calculate_cost


def test_calculate_cost_known_model() -> None:
    """Verify calculate_cost computes accurate cost for known model rates."""
    cost = calculate_cost(
        "gemini-1.5-pro-latest", prompt_tokens=1000, completion_tokens=1000
    )
    assert cost == 0.014


def test_calculate_cost_unknown_model() -> None:
    """Verify calculate_cost falls back to default rates for unknown models."""
    cost = calculate_cost(
        "custom-unknown-model", prompt_tokens=1000, completion_tokens=1000
    )
    assert cost == 0.003
