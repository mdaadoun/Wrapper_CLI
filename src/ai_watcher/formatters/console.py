"""Console output formatters for rendering AnalysisReport to terminal."""

import typer
from ai_watcher.schemas.report import AnalysisReport


def display_report(report: AnalysisReport) -> None:
    """Render structured AnalysisReport and FinOps metrics to terminal."""
    typer.echo("\n--- ANALYSIS REPORT ---")
    typer.echo(f"Title: {report.title}")
    typer.echo(f"Source: {report.source}")
    typer.echo(f"Model: {report.model_used}")
    typer.echo(f"Analyzed At: {report.analyzed_at.isoformat()}")
    typer.echo(f"Priority: {report.priority.upper()}")
    typer.echo(f"\nSummary:\n{report.summary}")
    typer.echo("\nKey Points:")
    for pt in report.key_points:
        typer.echo(f" - {pt}")
    typer.echo(f"\nTechnical Impact: {report.impact_technical}")
    typer.echo(f"Business Impact: {report.impact_business}")
    if report.impact_regulatory:
        typer.echo(f"Regulatory Impact: {report.impact_regulatory}")
    typer.echo(f"Recommendation: {report.recommendation}")
    typer.echo("\n--- FINOPS METRICS ---")
    typer.echo(f"Prompt Tokens: {report.prompt_tokens}")
    typer.echo(f"Completion Tokens: {report.completion_tokens}")
    typer.echo(f"Total Tokens: {report.total_tokens}")
    typer.echo(f"Estimated Cost USD: ${report.estimated_cost_usd:.4f}")
    typer.echo(f"Execution Time: {report.execution_time_seconds:.4f}s")
