"""
End-to-End CLI Integration Tests for AI Watcher.
Validates complete execution pipeline across source modes, exports, and caching.
"""

import json
from unittest.mock import patch

import pytest
from ai_watcher.main import app
from ai_watcher.utils.cache import ContentCache
from typer.testing import CliRunner

runner = CliRunner()


@pytest.fixture(autouse=True)
def isolate_cli_cache(tmp_path, monkeypatch):
    """Ensure integration tests run in isolated cache environment."""
    cache_file = tmp_path / "integration_cache.json"
    monkeypatch.setattr(
        "ai_watcher.main.ContentCache", lambda: ContentCache(cache_file=cache_file)
    )


def test_e2e_scan_text_demo_mode():
    """E2E test scanning raw text source in demo mode."""
    result = runner.invoke(app, ["scan", "AI Engineering Best Practices", "--demo"])
    assert result.exit_code == 0
    assert "Scanning source [text mode]: AI Engineering Best Practices" in result.stdout
    assert "Executing in DEMO mode" in result.stdout
    assert "Executive Summary" in result.stdout
    assert "Key Points" in result.stdout
    assert "FinOps Metrics" in result.stdout


def test_e2e_scan_file_demo_mode(tmp_path):
    """E2E test scanning markdown file source in demo mode."""
    sample_file = tmp_path / "article.md"
    sample_file.write_text("Detailed article on model quantization and deployment.")

    result = runner.invoke(app, ["scan", str(sample_file), "--demo"])
    assert result.exit_code == 0
    assert f"Scanning source [file mode]: {sample_file}" in result.stdout
    assert "Executing in DEMO mode" in result.stdout
    assert "Executive Summary" in result.stdout
    assert "[DEMO]" in result.stdout


def test_e2e_scan_url_demo_mode():
    """E2E test scanning web URL source with mocked HTTP extractor in demo mode."""
    with patch(
        "ai_watcher.core.extractor.extract_from_url",
        return_value="Scraped web article content about LLM wrappers.",
    ):
        result = runner.invoke(
            app, ["scan", "https://news.ycombinator.com/item?id=123", "--demo"]
        )

    assert result.exit_code == 0
    assert "Scanning source [url mode]" in result.stdout
    assert "Executing in DEMO mode" in result.stdout
    assert "Executive Summary" in result.stdout


def test_e2e_scan_json_export(tmp_path):
    """E2E test running CLI with custom JSON export path in demo mode."""
    export_path = tmp_path / "output_report.json"
    result = runner.invoke(
        app,
        ["scan", "Sample system architecture text", "-o", str(export_path), "--demo"],
    )

    assert result.exit_code == 0
    assert export_path.exists()

    data = json.loads(export_path.read_text(encoding="utf-8"))
    assert "source" in data
    assert "summary" in data
    assert "key_points" in data
    assert "estimated_cost_usd" in data
    assert data["source"] == "Sample system architecture text"


def test_e2e_scan_markdown_export(tmp_path):
    """E2E test running CLI with custom Markdown export path in demo mode."""
    export_path = tmp_path / "output_report.md"
    result = runner.invoke(
        app,
        ["scan", "Detailed ML Ops roadmap document", "-o", str(export_path), "--demo"],
    )

    assert result.exit_code == 0
    assert export_path.exists()

    content = export_path.read_text(encoding="utf-8")
    assert "[DEMO] Synthetic AI Tech Radar Report" in content
    assert "## Executive Summary" in content
    assert "## Key Points" in content
    assert "## FinOps Metrics" in content


def test_e2e_scan_cache_flow_and_bypass():
    """E2E test verifying cache hit on second run and cache bypass with --no-cache."""
    text_input = "Reusable infrastructure configuration guide."

    # First run: prime cache
    res1 = runner.invoke(app, ["scan", text_input, "--demo"])
    assert res1.exit_code == 0
    assert "[CACHE HIT]" not in res1.stdout

    # Second run: expect cache hit
    res2 = runner.invoke(app, ["scan", text_input, "--demo"])
    assert res2.exit_code == 0
    assert "[CACHE HIT] Loaded report from local cache." in res2.stdout

    # Third run with --no-cache: expect cache bypass
    res3 = runner.invoke(app, ["scan", text_input, "--demo", "--no-cache"])
    assert res3.exit_code == 0
    assert "[CACHE HIT]" not in res3.stdout
    assert "Executing in DEMO mode" in res3.stdout


def test_e2e_scan_invalid_source_error():
    """E2E test handling invalid input gracefully without traceback."""
    # Empty whitespace input
    res_empty = runner.invoke(app, ["scan", "   "])
    assert res_empty.exit_code == 1
    assert "Source cannot be empty" in res_empty.output

    # Non-existent file forced with --file
    res_missing = runner.invoke(app, ["scan", "--file", "non_existent_file.txt"])
    assert res_missing.exit_code == 1
    assert "Error" in res_missing.output
