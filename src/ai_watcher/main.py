"""
CLI entrypoint utilizing Typer.
Optimized for token usage and readability.
"""

import typer

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
    mode = "auto"
    if text:
        mode = "text"
    elif file:
        mode = "file"
    elif url:
        mode = "url"

    typer.echo(f"Scanning source [{mode} mode]: {source}")


if __name__ == "__main__":
    app()
