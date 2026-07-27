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


def test_scan_auto_detection_text():
    result = runner.invoke(app, ["scan", "Hello World"])
    assert result.exit_code == 0
    assert "Scanning source [text mode]: Hello World" in result.stdout


def test_scan_auto_detection_url():
    result = runner.invoke(app, ["scan", "https://example.com"])
    assert result.exit_code == 0
    assert "Scanning source [url mode]: https://example.com" in result.stdout


def test_scan_auto_detection_file(tmp_path):
    sample = tmp_path / "test.md"
    sample.write_text("content")
    result = runner.invoke(app, ["scan", str(sample)])
    assert result.exit_code == 0
    assert f"Scanning source [file mode]: {sample}" in result.stdout


def test_scan_explicit_text_flag():
    result = runner.invoke(app, ["scan", "-t", "Hello World"])
    assert result.exit_code == 0
    assert "Scanning source [text mode]: Hello World" in result.stdout


def test_scan_explicit_file_flag():
    result = runner.invoke(app, ["scan", "--file", "document.md"])
    assert result.exit_code == 0
    assert "Scanning source [file mode]: document.md" in result.stdout


def test_scan_explicit_url_flag():
    result = runner.invoke(app, ["scan", "-u", "https://example.com"])
    assert result.exit_code == 0
    assert "Scanning source [url mode]: https://example.com" in result.stdout


def test_scan_empty_source_exit_code():
    result = runner.invoke(app, ["scan", "   "])
    assert result.exit_code == 1
    assert "Error: Source cannot be empty or whitespace-only." in result.stderr
