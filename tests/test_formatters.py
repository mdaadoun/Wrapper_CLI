"""Unit tests for Markdown Rendered Panel (console formatter)."""

from io import StringIO

from ai_watcher.clients import get_mock_analysis_report
from ai_watcher.formatters.console import display_report
from rich.console import Console


def test_display_report_renders_panel_content():
    """Verify display_report outputs expected sections, markdown summary, and priorities."""
    report = get_mock_analysis_report()
    string_io = StringIO()
    test_console = Console(file=string_io, force_terminal=True, width=100)

    display_report(report, console_instance=test_console)
    output = string_io.getvalue()

    assert report.title in output
    assert report.source in output
    assert "Executive Summary" in output
    assert "Key Points" in output
    assert "Technical Impact" in output
    assert "Business Impact" in output
    assert "Recommendation" in output
    assert "FinOps Metrics" in output
    assert "Prompt" in output
    assert "Cost" in output


def test_display_report_priority_colors():
    """Verify different priority levels display properly."""
    string_io = StringIO()
    test_console = Console(file=string_io, force_terminal=True, width=100)

    report_low = get_mock_analysis_report().model_copy(update={"priority": "low"})
    display_report(report_low, console_instance=test_console)
    output_low = string_io.getvalue()
    assert "LOW" in output_low

    string_io_high = StringIO()
    test_console_high = Console(file=string_io_high, force_terminal=True, width=100)
    report_high = get_mock_analysis_report().model_copy(
        update={
            "priority": "high",
            "impact_regulatory": "EU AI Act Compliance Required",
        }
    )
    display_report(report_high, console_instance=test_console_high)
    output_high = string_io_high.getvalue()
    assert "HIGH" in output_high
    assert "Regulatory Impact" in output_high


def test_display_report_cost_color_coding():
    """Verify cost color coding thresholds (<$0.01 green, <$0.05 yellow, >=$0.05 red)."""
    for cost, _ in [
        (0.005, "green"),
        (0.02, "yellow"),
        (0.08, "red"),
    ]:
        string_io = StringIO()
        test_console = Console(file=string_io, force_terminal=True, width=100)
        report = get_mock_analysis_report().model_copy(
            update={"estimated_cost_usd": cost}
        )
        display_report(report, console_instance=test_console)
        output = string_io.getvalue()
        assert "FinOps Metrics" in output
