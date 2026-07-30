"""Unit tests for export formatters and output CLI options."""

import json

from ai_watcher.clients import get_mock_analysis_report
from ai_watcher.formatters.markdown import export_markdown, render_markdown_report
from ai_watcher.main import app
from typer.testing import CliRunner

runner = CliRunner()


def test_render_markdown_report():
    """Verify render_markdown_report generates expected sections."""
    report = get_mock_analysis_report()
    md = render_markdown_report(report)

    assert f"# {report.title}" in md
    assert f"- **Source:** `{report.source}`" in md
    assert "## Executive Summary" in md
    assert report.summary in md
    assert "## Key Points" in md
    assert f"- {report.key_points[0]}" in md
    assert "## Impacts & Recommendation" in md
    assert "## FinOps Metrics" in md
    assert f"| Estimated Cost (USD) | ${report.estimated_cost_usd:.4f} |" in md


def test_export_markdown(tmp_path):
    """Verify export_markdown creates file on disk with correct content."""
    report = get_mock_analysis_report()
    target = tmp_path / "output_test.md"
    res_path = export_markdown(report, target)

    assert res_path.exists()
    content = res_path.read_text(encoding="utf-8")
    assert report.title in content


def test_cli_export_json_stdout():
    """Verify CLI --output json outputs valid JSON to stdout."""
    result = runner.invoke(app, ["scan", "Sample text", "--demo", "--output", "json"])
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert "title" in data
    assert "summary" in data
    assert "key_points" in data
    assert "estimated_cost_usd" in data


def test_cli_export_json_file(tmp_path):
    """Verify CLI --output report.json writes valid JSON file."""
    outfile = tmp_path / "custom_report.json"
    result = runner.invoke(app, ["scan", "Sample text", "--demo", "-o", str(outfile)])
    assert result.exit_code == 0
    assert outfile.exists()
    data = json.loads(outfile.read_text(encoding="utf-8"))
    assert "title" in data
    assert "Report successfully exported to JSON" in result.stdout


def test_cli_export_markdown_file(tmp_path):
    """Verify CLI --output custom.md writes markdown file."""
    outfile = tmp_path / "custom_report.md"
    result = runner.invoke(app, ["scan", "Sample text", "--demo", "-o", str(outfile)])
    assert result.exit_code == 0
    assert outfile.exists()
    content = outfile.read_text(encoding="utf-8")
    assert "Executive Summary" in content
    assert "Report successfully exported to Markdown" in result.stdout


def test_cli_export_markdown_keyword(tmp_path, monkeypatch):
    """Verify CLI --output markdown writes report.md in current directory."""
    monkeypatch.chdir(tmp_path)
    result = runner.invoke(app, ["scan", "Sample text", "--demo", "-o", "markdown"])
    assert result.exit_code == 0
    outfile = tmp_path / "report.md"
    assert outfile.exists()
    assert "Report successfully exported to Markdown: report.md" in result.stdout


def test_cli_export_fallback_custom_extension(tmp_path):
    """Verify CLI --output with custom filename defaults to markdown export."""
    outfile = tmp_path / "custom_report.txt"
    result = runner.invoke(app, ["scan", "Sample text", "--demo", "-o", str(outfile)])
    assert result.exit_code == 0
    assert outfile.exists()
    content = outfile.read_text(encoding="utf-8")
    assert "Executive Summary" in content
    assert "Report successfully exported to:" in result.stdout


def test_export_markdown_os_error(tmp_path):
    """Verify export_markdown raises ExportError when write fails."""
    import pytest
    from ai_watcher.exceptions import ExportError

    report = get_mock_analysis_report()
    invalid_path = tmp_path / "non_existent_dir" / "report.md"
    with pytest.raises(ExportError) as exc_info:
        export_markdown(report, invalid_path)
    assert "Failed to export Markdown report" in str(exc_info.value)


def test_cli_export_json_os_error(tmp_path):
    """Verify CLI --output invalid/dir/file.json catches ExportError and exits cleanly."""
    invalid_path = tmp_path / "non_existent_dir" / "report.json"
    result = runner.invoke(
        app, ["scan", "Sample text", "--demo", "-o", str(invalid_path)]
    )
    assert result.exit_code == 1
    assert "Failed to export JSON report" in result.output
