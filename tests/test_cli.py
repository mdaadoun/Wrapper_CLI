from typer.testing import CliRunner

from src.ai_watcher.main import app

runner = CliRunner()


def test_app_help():
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    assert (
        "AI Watcher CLI: Automated content extraction and AI analysis" in result.stdout
    )
