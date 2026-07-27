"""
CLI entrypoint utilizing Typer.
Optimized for token usage and readability.
"""

import typer

from src.ai_watcher.core.detector import detect_source_type
from src.ai_watcher.exceptions import WatcherError

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
    except WatcherError as err:
        typer.secho(f"Error: {err}", fg=typer.colors.RED, err=True)
        raise typer.Exit(code=1) from err


if __name__ == "__main__":
    app()
