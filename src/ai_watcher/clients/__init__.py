"""LLM client interfaces and system prompt definitions for AI Watcher CLI."""

from ai_watcher.clients.prompts import (
    SAMPLE_ANALYSIS_REPORT_JSON,
    SYSTEM_PROMPT,
    get_sample_analysis_report_json,
    get_system_prompt,
    validate_sample_report,
)

__all__ = [
    "SYSTEM_PROMPT",
    "SAMPLE_ANALYSIS_REPORT_JSON",
    "get_system_prompt",
    "get_sample_analysis_report_json",
    "validate_sample_report",
]
