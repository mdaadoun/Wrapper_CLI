"""Console output formatters for rendering AnalysisReport to terminal."""

from ai_watcher.schemas.report import AnalysisReport
from rich.console import Console, Group, RenderableType
from rich.markdown import Markdown
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

console = Console()

PRIORITY_COLORS = {
    "low": "green",
    "medium": "yellow",
    "high": "red",
}


def display_report(
    report: AnalysisReport, console_instance: Console | None = None
) -> None:
    """Render structured AnalysisReport and FinOps metrics to terminal using Rich Panel."""
    target_console = console_instance or console
    priority_color = PRIORITY_COLORS.get(report.priority.lower(), "white")

    renderables: list[RenderableType] = []

    # Metadata Header
    header_text = Text()
    header_text.append("Source: ", style="bold dim")
    header_text.append(f"{report.source}\n", style="dim")
    header_text.append("Model: ", style="bold dim")
    header_text.append(f"{report.model_used} | ", style="dim")
    header_text.append("Date: ", style="bold dim")
    header_text.append(f"{report.analyzed_at.isoformat()}\n", style="dim")
    header_text.append("Priority: ", style="bold")
    header_text.append(f"{report.priority.upper()}", style=f"bold {priority_color}")
    if report.is_cached:
        header_text.append(" | ", style="dim")
        header_text.append("Cache: ", style="bold dim")
        header_text.append("[CACHE HIT]", style="bold green")
    header_text.append("\n\n")
    renderables.append(header_text)

    # Executive Summary (Markdown)
    renderables.append(Text("Executive Summary", style="bold cyan underline"))
    renderables.append(Markdown(report.summary))
    renderables.append(Text("\nKey Points", style="bold cyan underline"))

    # Bulleted Key Points
    key_points_text = Text()
    for pt in report.key_points:
        key_points_text.append(f" • {pt}\n")
    renderables.append(key_points_text)

    # Impacts & Recommendation
    impacts_text = Text()
    impacts_text.append("\nImpacts & Recommendation\n", style="bold cyan underline")
    impacts_text.append("Technical Impact: ", style="bold")
    impacts_text.append(f"{report.impact_technical}\n")
    impacts_text.append("Business Impact: ", style="bold")
    impacts_text.append(f"{report.impact_business}\n")
    if report.impact_regulatory:
        impacts_text.append("Regulatory Impact: ", style="bold")
        impacts_text.append(f"{report.impact_regulatory}\n")

    impacts_text.append("\nRecommendation: ", style=f"bold {priority_color}")
    impacts_text.append(f"{report.recommendation}\n", style=priority_color)
    renderables.append(impacts_text)

    # Render main analysis report panel
    title_text = f"[bold white]{report.title}[/bold white] [[bold {priority_color}]{report.priority.upper()}[/bold {priority_color}]]"
    panel = Panel(
        Group(*renderables),
        title=title_text,
        border_style=priority_color,
        expand=True,
    )
    target_console.print(panel)

    # Render FinOps Metrics Table (Step 6.2)
    cost = report.estimated_cost_usd
    if cost < 0.01:
        cost_style = "green"
    elif cost < 0.05:
        cost_style = "yellow"
    else:
        cost_style = "red"

    metrics_table = Table(
        title="FinOps Metrics", show_header=True, header_style="bold cyan"
    )
    metrics_table.add_column("Model", style="white", justify="left")
    metrics_table.add_column("Prompt Tokens", style="dim", justify="right")
    metrics_table.add_column("Completion Tokens", style="dim", justify="right")
    metrics_table.add_column("Total Tokens", style="bold", justify="right")
    metrics_table.add_column("Cost (USD)", style=cost_style, justify="right")
    metrics_table.add_column("Latency (s)", style="white", justify="right")

    metrics_table.add_row(
        report.model_used,
        f"{report.prompt_tokens:,}",
        f"{report.completion_tokens:,}",
        f"{report.total_tokens:,}",
        f"${report.estimated_cost_usd:.4f}",
        f"{report.execution_time_seconds:.4f}s",
    )
    target_console.print(metrics_table)


def display_error(
    error: Exception | str, console_instance: Console | None = None
) -> None:
    """Render clean error message in a red Rich panel without raw tracebacks."""
    target_console = console_instance or Console(stderr=True)
    msg = str(error)
    panel = Panel(
        Text(msg, style="bold red"),
        title="[bold red]❌ Error[/bold red]",
        border_style="red",
        expand=False,
    )
    target_console.print(panel)
