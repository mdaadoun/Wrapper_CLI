"""Unit tests for FinOps cost calculator (Step 5.1: Model Pricing Matrix)."""

import pytest
from ai_watcher.exceptions import UnknownModelError
from ai_watcher.utils.cost import MODEL_PRICING, calculate_cost

# ---------------------------------------------------------------------------
# Known model cost calculations
# ---------------------------------------------------------------------------


def test_calculate_cost_gpt4o_mini() -> None:
    """Verify gpt-4o-mini cost: 0.15 input + 0.60 output per 1M tokens."""
    cost = calculate_cost(
        "gpt-4o-mini", prompt_tokens=1_000_000, completion_tokens=1_000_000
    )
    assert cost == 0.75  # 0.15 + 0.60


def test_calculate_cost_gemini_15_flash() -> None:
    """Verify gemini-1.5-flash cost: 0.35 input + 1.05 output per 1M tokens."""
    cost = calculate_cost(
        "gemini-1.5-flash", prompt_tokens=1_000_000, completion_tokens=1_000_000
    )
    assert cost == 1.40  # 0.35 + 1.05


def test_calculate_cost_claude_35_sonnet() -> None:
    """Verify claude-3-5-sonnet cost: 3.00 input + 15.00 output per 1M tokens."""
    cost = calculate_cost(
        "claude-3-5-sonnet-20241022",
        prompt_tokens=1_000_000,
        completion_tokens=1_000_000,
    )
    assert cost == 18.00  # 3.00 + 15.00


def test_calculate_cost_partial_tokens() -> None:
    """Verify proportional cost for partial token counts."""
    cost = calculate_cost(
        "gpt-4o-mini", prompt_tokens=100_000, completion_tokens=50_000
    )
    # (100k/1M * 0.15) + (50k/1M * 0.60) = 0.015 + 0.03 = 0.045
    assert cost == 0.045


def test_calculate_cost_zero_tokens() -> None:
    """Verify zero tokens produce zero cost."""
    cost = calculate_cost("gpt-4o", prompt_tokens=0, completion_tokens=0)
    assert cost == 0.0


# ---------------------------------------------------------------------------
# Unknown model raises UnknownModelError
# ---------------------------------------------------------------------------


def test_calculate_cost_unknown_model_raises() -> None:
    """Verify unknown model name raises UnknownModelError."""
    with pytest.raises(UnknownModelError) as exc_info:
        calculate_cost("nonexistent-model-v99", prompt_tokens=100, completion_tokens=50)
    assert "nonexistent-model-v99" in str(exc_info.value)
    assert "Unknown model" in str(exc_info.value)


def test_calculate_cost_empty_model_raises() -> None:
    """Verify empty model string raises UnknownModelError."""
    with pytest.raises(UnknownModelError):
        calculate_cost("", prompt_tokens=100, completion_tokens=50)


# ---------------------------------------------------------------------------
# Case-insensitive lookup
# ---------------------------------------------------------------------------


def test_calculate_cost_case_insensitive() -> None:
    """Verify model lookup is case-insensitive."""
    cost_upper = calculate_cost(
        "GPT-4O-MINI", prompt_tokens=1_000_000, completion_tokens=1_000_000
    )
    cost_lower = calculate_cost(
        "gpt-4o-mini", prompt_tokens=1_000_000, completion_tokens=1_000_000
    )
    assert cost_upper == cost_lower == 0.75


# ---------------------------------------------------------------------------
# Pricing matrix integrity
# ---------------------------------------------------------------------------


def test_pricing_matrix_all_positive() -> None:
    """Verify all pricing entries have positive non-zero rates."""
    for model, rates in MODEL_PRICING.items():
        assert rates["input_per_1m"] > 0, f"{model} input rate must be > 0"
        assert rates["output_per_1m"] > 0, f"{model} output rate must be > 0"


def test_pricing_matrix_output_always_higher_or_equal() -> None:
    """Verify output rate >= input rate (industry standard: output is more expensive)."""
    for model, rates in MODEL_PRICING.items():
        assert (
            rates["output_per_1m"] >= rates["input_per_1m"]
        ), f"{model}: output rate ({rates['output_per_1m']}) < input rate ({rates['input_per_1m']})"


def test_pricing_matrix_minimum_models() -> None:
    """Verify pricing matrix contains at least 20 models."""
    assert len(MODEL_PRICING) >= 20, f"Expected >= 20 models, got {len(MODEL_PRICING)}"


# ---------------------------------------------------------------------------
# Edge cases: large token counts, rounding
# ---------------------------------------------------------------------------


def test_calculate_cost_large_token_count() -> None:
    """Verify cost calculation handles large token counts without overflow."""
    cost = calculate_cost(
        "gpt-4o", prompt_tokens=10_000_000, completion_tokens=5_000_000
    )
    # (10M/1M * 2.50) + (5M/1M * 10.00) = 25.00 + 50.00 = 75.00
    assert cost == 75.00


def test_calculate_cost_rounding_precision() -> None:
    """Verify cost is rounded to 6 decimal places (Python round semantics)."""
    cost = calculate_cost("gpt-4o-mini", prompt_tokens=1, completion_tokens=1)
    # (1/1M * 0.15) + (1/1M * 0.60) = 0.00000075 → round(..., 6) = 1e-06
    assert cost == 1e-06
