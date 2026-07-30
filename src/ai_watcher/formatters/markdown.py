"""Markdown output formatter for exporting AnalysisReport to Markdown file or text string."""

from pathlib import Path

from ai_watcher.exceptions import ExportError
from ai_watcher.schemas.report import AnalysisReport


def render_markdown_report(report: AnalysisReport) -> str:
    """Render an AnalysisReport into a clean, formatted Markdown document string."""
    lines: list[str] = [
        f"# {report.title}",
        "",
        "## Metadata",
        f"- **Source:** `{report.source}`",
        f"- **Model Used:** `{report.model_used}`",
        f"- **Analyzed At:** `{report.analyzed_at.isoformat()}`",
        f"- **Priority:** **{report.priority.upper()}**",
        "",
        "## Executive Summary",
        report.summary,
        "",
        "## Key Points",
    ]
    for pt in report.key_points:
        lines.append(f"- {pt}")

    lines.extend(
        [
            "",
            "## Impacts & Recommendation",
            f"- **Technical Impact:** {report.impact_technical}",
            f"- **Business Impact:** {report.impact_business}",
        ]
    )
    if report.impact_regulatory:
        lines.append(f"- **Regulatory Impact:** {report.impact_regulatory}")

    lines.extend(
        [
            f"- **Recommendation:** {report.recommendation}",
            "",
            "## FinOps Metrics",
            "| Metric | Value |",
            "| :--- | :--- |",
            f"| Model | {report.model_used} |",
            f"| Prompt Tokens | {report.prompt_tokens:,} |",
            f"| Completion Tokens | {report.completion_tokens:,} |",
            f"| Total Tokens | {report.total_tokens:,} |",
            f"| Estimated Cost (USD) | ${report.estimated_cost_usd:.4f} |",
            f"| Execution Time (s) | {report.execution_time_seconds:.4f}s |",
            "",
        ]
    )
    return "\n".join(lines)


def export_markdown(report: AnalysisReport, output_path: Path | str) -> Path:
    """Export AnalysisReport to a Markdown file at output_path."""
    try:
        path = Path(output_path)
        md_content = render_markdown_report(report)
        path.write_text(md_content, encoding="utf-8")
        return path
    except OSError as err:
        raise ExportError(
            f"Failed to export Markdown report to '{output_path}': {err}"
        ) from err
