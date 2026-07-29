"""Unit tests for Pydantic V2 AnalysisReport schema."""

from datetime import datetime, timezone

import pytest
from ai_watcher.schemas.report import AnalysisReport
from pydantic import ValidationError


def test_analysis_report_valid_instantiation() -> None:
    """Verify AnalysisReport instantiates correctly with valid parameters."""
    report = AnalysisReport(
        source="https://example.com/ai-news",
        model_used="gpt-4o-mini",
        title="GPT-5 Announced",
        summary="Next generation model release with advanced reasoning.",
        key_points=["Multi-modal reasoning", "Lower latency", "Improved safety"],
        impact_technical="Requires architectural updates for context window management.",
        impact_business="Reduces operational cost per token significantly.",
        impact_regulatory="Complies with EU AI Act risk assessment guidelines.",
        recommendation="Upgrade baseline LLM client to gpt-4o-mini.",
        priority="high",
        prompt_tokens=500,
        completion_tokens=200,
        estimated_cost_usd=0.0035,
        execution_time_seconds=1.25,
        is_cached=False,
    )

    assert report.source == "https://example.com/ai-news"
    assert report.model_used == "gpt-4o-mini"
    assert report.title == "GPT-5 Announced"
    assert report.priority == "high"
    assert report.prompt_tokens == 500
    assert report.completion_tokens == 200
    assert report.total_tokens == 700
    assert report.estimated_cost_usd == 0.0035
    assert report.execution_time_seconds == 1.25
    assert isinstance(report.analyzed_at, datetime)


def test_analysis_report_default_values() -> None:
    """Verify default field values when optional parameters are omitted."""
    report = AnalysisReport(
        source="sample.txt",
        model_used="gpt-4o-mini",
        title="Sample Report",
        summary="Brief summary of text file.",
        key_points=["Point 1", "Point 2"],
        impact_technical="Minimal tech impact.",
        impact_business="No business impact.",
        recommendation="No action required.",
        priority="low",
    )

    assert report.impact_regulatory is None
    assert report.prompt_tokens == 0
    assert report.completion_tokens == 0
    assert report.total_tokens == 0
    assert report.estimated_cost_usd == 0.0
    assert report.execution_time_seconds == 0.0
    assert report.is_cached is False
    assert report.analyzed_at.tzinfo == timezone.utc


def test_analysis_report_missing_required_field_raises() -> None:
    """Verify missing required fields (e.g. key_points) raise ValidationError."""
    with pytest.raises(ValidationError) as exc_info:
        AnalysisReport(
            source="sample.txt",
            model_used="gpt-4o-mini",
            title="Sample Report",
            summary="Brief summary.",
            # key_points missing
            impact_technical="Tech impact",
            impact_business="Business impact",
            recommendation="Recommendation",
            priority="medium",
        )

    errors = exc_info.value.errors()
    field_names = [err["loc"][0] for err in errors]
    assert "key_points" in field_names


def test_analysis_report_invalid_priority_raises() -> None:
    """Verify invalid priority string raises ValidationError."""
    with pytest.raises(ValidationError):
        AnalysisReport(
            source="sample.txt",
            model_used="gpt-4o-mini",
            title="Sample Report",
            summary="Brief summary.",
            key_points=["Point 1"],
            impact_technical="Tech impact",
            impact_business="Business impact",
            recommendation="Recommendation",
            priority="critical",  # invalid priority
        )


def test_analysis_report_negative_token_count_raises() -> None:
    """Verify negative token counts raise ValidationError."""
    with pytest.raises(ValidationError):
        AnalysisReport(
            source="sample.txt",
            model_used="gpt-4o-mini",
            title="Sample Report",
            summary="Brief summary.",
            key_points=["Point 1"],
            impact_technical="Tech impact",
            impact_business="Business impact",
            recommendation="Recommendation",
            priority="medium",
            prompt_tokens=-10,
        )


def test_analysis_report_immutability() -> None:
    """Verify AnalysisReport is frozen and raises ValidationError on modification."""
    report = AnalysisReport(
        source="sample.txt",
        model_used="gpt-4o-mini",
        title="Sample Report",
        summary="Brief summary.",
        key_points=["Point 1"],
        impact_technical="Tech impact",
        impact_business="Business impact",
        recommendation="Recommendation",
        priority="low",
    )

    with pytest.raises(ValidationError):
        report.title = "New Title"


def test_analysis_report_total_tokens_autocomputed() -> None:
    """Verify total_tokens is auto-computed when prompt and completion tokens are provided."""
    report = AnalysisReport(
        source="sample.txt",
        model_used="gpt-4o-mini",
        title="Sample Report",
        summary="Brief summary.",
        key_points=["Point 1"],
        impact_technical="Tech impact",
        impact_business="Business impact",
        recommendation="Recommendation",
        priority="medium",
        prompt_tokens=150,
        completion_tokens=75,
    )

    assert report.total_tokens == 225


def test_analysis_report_json_serialization_roundtrip() -> None:
    """Verify model_dump_json and model_validate_json round-trip accurately."""
    original = AnalysisReport(
        source="https://ai.example.com",
        model_used="gpt-4o-mini",
        title="JSON Roundtrip Test",
        summary="Validating JSON serialization.",
        key_points=["JSON test 1", "JSON test 2"],
        impact_technical="None",
        impact_business="None",
        recommendation="Keep testing.",
        priority="low",
        prompt_tokens=100,
        completion_tokens=50,
        estimated_cost_usd=0.001,
    )

    json_str = original.model_dump_json()
    reconstructed = AnalysisReport.model_validate_json(json_str)

    assert reconstructed.title == original.title
    assert reconstructed.key_points == original.key_points
    assert reconstructed.total_tokens == 150
    assert reconstructed.priority == original.priority
