"""
CLI entrypoint utilizing Typer.
Optimized for token usage and readability.
"""

import typer
from ai_watcher.clients import LLMClient
from ai_watcher.config import get_settings
from ai_watcher.core.detector import detect_source_type
from ai_watcher.core.extractor import extract
from ai_watcher.exceptions import WatcherError
from ai_watcher.formatters import display_report

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
        typer.echo(f"Scanning source [{source_type.value} mode]: {source}")

        # Ingestion phase
        content = extract(source, source_type)
        typer.echo(f"Extracted {len(content)} characters.")

        # Analysis phase (demo vs live)
        if demo:
            typer.echo("Executing in DEMO mode (mocked LLM response)...")
            client = LLMClient(demo_mode=True)
        else:
            settings = get_settings()
            client = LLMClient(
                api_key=settings.gemini_api_key.get_secret_value(),
                model_name=settings.model_name,
            )

        report = client.analyze(content=content, source=source)
        display_report(report)

    except WatcherError as err:
        typer.secho(f"Error: {err}", fg=typer.colors.RED, err=True)
        raise typer.Exit(code=1) from err


if __name__ == "__main__":
    app()
