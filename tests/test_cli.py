from typer.testing import CliRunner

from src.ai_watcher.main import app

runner = CliRunner()


def test_app_help():
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    assert (
        "AI Watcher CLI: Automated content extraction and AI analysis" in result.stdout
    )


def test_scan_help():
    result = runner.invoke(app, ["scan", "--help"])
    assert result.exit_code == 0
    assert "Scan and analyze tech content from text, file, or URL." in result.stdout
    assert "--text" in result.stdout
    assert "--file" in result.stdout
    assert "--url" in result.stdout


def test_scan_default_mode():
    result = runner.invoke(app, ["scan", "Hello World"])
    assert result.exit_code == 0
    assert "Scanning source [auto mode]: Hello World" in result.stdout


def test_scan_text_flag():
    result = runner.invoke(app, ["scan", "-t", "Hello World"])
    assert result.exit_code == 0
    assert "Scanning source [text mode]: Hello World" in result.stdout


def test_scan_file_flag():
    result = runner.invoke(app, ["scan", "--file", "document.md"])
    assert result.exit_code == 0
    assert "Scanning source [file mode]: document.md" in result.stdout


def test_scan_url_flag():
    result = runner.invoke(app, ["scan", "-u", "https://example.com"])
    assert result.exit_code == 0
    assert "Scanning source [url mode]: https://example.com" in result.stdout
