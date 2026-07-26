"""
CLI entrypoint utilizing Typer.
Optimized for token usage and readibility.
"""

import typer

app = typer.Typer(help="AI Watcher CLI: Automated content extraction and AI analysis.")


@app.callback()
def main() -> None:
    """
    AI Watcher CLI Entrypoint.
    """
    pass


if __name__ == "__main__":
    app()
