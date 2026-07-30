"""
CLI entrypoint utilizing Typer.
Optimized for token usage and readability.
"""

import typer
from ai_watcher.clients import LLMClient
from ai_watcher.config import get_settings
from ai_watcher.core.detector import detect_source_type
from ai_watcher.core.extractor import extract
from ai_watcher.exceptions import ExportError, WatcherError
from ai_watcher.formatters import (
    display_report,
    export_markdown,
)

app = typer.Typer(help="AI Watcher CLI: Automated content extraction and AI analysis.")


@app.callback()
def main() -> None:
    """
    AI Watcher CLI main callback.
    """
    pass


@app.command()
def scan(
    source: str = typer.Argument(
        ..., help="Source to scan: raw text, file path, or URL."
    ),
    text: bool = typer.Option(
        False, "--text", "-t", help="Force source mode to raw text."
    ),
    file: bool = typer.Option(
        False, "--file", "-f", help="Force source mode to file path."
    ),
    url: bool = typer.Option(
        False, "--url", "-u", help="Force source mode to web URL."
    ),
    output: str = typer.Option(
        "console",
        "--output",
        "-o",
        help="Output format/destination: 'console' (default Rich UI), 'json' (raw JSON to stdout), or a filename with '.md' or '.json' extension.",
    ),
    demo: bool = typer.Option(
        False, "--demo", "-d", help="Run in demo mode with mocked LLM response."
    ),
) -> None:
    """
    Scan and analyze tech content from text, file, or URL.
    """
    try:
        source_type = detect_source_type(
            source=source,
            force_text=text,
            force_file=file,
            force_url=url,
        )
        if output.lower() == "console":
            typer.echo(f"Scanning source [{source_type.value} mode]: {source}")

        # Ingestion phase
        content = extract(source, source_type)
        if output.lower() == "console":
            typer.echo(f"Extracted {len(content)} characters.")

        # Analysis phase (demo vs live)
        if demo:
            if output.lower() == "console":
                typer.echo("Executing in DEMO mode (mocked LLM response)...")
            client = LLMClient(demo_mode=True)
        else:
            settings = get_settings()
            client = LLMClient(
                api_key=settings.gemini_api_key.get_secret_value(),
                model_name=settings.model_name,
            )

        report = client.analyze(content=content, source=source)

        # Output formatting phase
        out_fmt = output.lower()
        if out_fmt == "console":
            display_report(report)
        elif out_fmt == "json":
            typer.echo(report.model_dump_json(indent=2))
        elif out_fmt.endswith(".json"):
            try:
                with open(output, "w", encoding="utf-8") as f:
                    f.write(report.model_dump_json(indent=2))
            except OSError as err:
                raise ExportError(
                    f"Failed to export JSON report to '{output}': {err}"
                ) from err
            typer.echo(f"Report successfully exported to JSON: {output}")
        elif out_fmt == "markdown" or out_fmt.endswith(".md"):
            out_file = output if out_fmt.endswith(".md") else "report.md"
            export_markdown(report, out_file)
            typer.echo(f"Report successfully exported to Markdown: {out_file}")
        else:
            # Default fallback for custom filenames without extension: treated as markdown file path
            export_markdown(report, output)
            typer.echo(f"Report successfully exported to: {output}")

    except WatcherError as err:
        typer.secho(f"Error: {err}", fg=typer.colors.RED, err=True)
        raise typer.Exit(code=1) from err


if __name__ == "__main__":
    app()
