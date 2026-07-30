"""Unit tests for system prompt engineering and sample report validation."""

import json

from ai_watcher.clients.prompts import (
    SAMPLE_ANALYSIS_REPORT_JSON,
    SYSTEM_PROMPT,
    get_sample_analysis_report_json,
    get_system_prompt,
    validate_sample_report,
)
from ai_watcher.schemas.report import AnalysisReport


def test_system_prompt_is_typed_constant() -> None:
    """Verify SYSTEM_PROMPT is a non-empty string constant."""
    assert isinstance(SYSTEM_PROMPT, str)
    assert len(SYSTEM_PROMPT.strip()) > 0


def test_system_prompt_content_constraints() -> None:
    """Verify system prompt contains role definition, constraints, and JSON schema."""
    prompt = get_system_prompt()

    # Role instruction
    assert "Senior AI Analyst" in prompt

    # Format constraints
    assert "AnalysisReport" in prompt
    assert "200 words" in prompt
    assert "3 and 5" in prompt
    assert "low" in prompt and "medium" in prompt and "high" in prompt

    # Required output sections
    assert "SUMMARY" in prompt
    assert "KEY POINTS" in prompt
    assert "RECOMMENDATION" in prompt


def test_sample_analysis_report_json_parseable() -> None:
    """Verify SAMPLE_ANALYSIS_REPORT_JSON can be parsed by AnalysisReport.model_validate_json()."""
    report = AnalysisReport.model_validate_json(SAMPLE_ANALYSIS_REPORT_JSON)

    assert isinstance(report, AnalysisReport)
    assert report.title == "Autonomous Agent Framework Release"
    assert report.model_used == "gpt-4o-mini"
    assert report.priority == "high"
    assert len(report.key_points) >= 3 and len(report.key_points) <= 5
    assert report.prompt_tokens == 450
    assert report.completion_tokens == 180
    assert report.total_tokens == 630


def test_validate_sample_report_function() -> None:
    """Verify validate_sample_report helper function returns valid AnalysisReport instance."""
    report = validate_sample_report()

    assert isinstance(report, AnalysisReport)
    assert report.source == "https://example.com/ai-update"
    assert report.recommendation.startswith("Evaluate framework integration")


def test_get_sample_analysis_report_json_helper() -> None:
    """Verify get_sample_analysis_report_json returns raw valid JSON string."""
    raw_json = get_sample_analysis_report_json()

    assert raw_json == SAMPLE_ANALYSIS_REPORT_JSON
    data = json.loads(raw_json)
    assert "title" in data
    assert "key_points" in data


def test_embedded_sample_in_system_prompt_is_parseable() -> None:
    """Verify embedded example in SYSTEM_PROMPT is parseable by AnalysisReport."""
    assert SAMPLE_ANALYSIS_REPORT_JSON in SYSTEM_PROMPT
    report = AnalysisReport.model_validate_json(SAMPLE_ANALYSIS_REPORT_JSON)
    assert report.priority in ["low", "medium", "high"]
