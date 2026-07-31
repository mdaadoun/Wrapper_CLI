"""
Unit tests for AI Watcher CLI documentation utility functions and README validation.
Ensures documentation integrity, metadata consistency, and CLI option flag completeness.
"""

from pathlib import Path

from ai_watcher.utils.docs import (
    get_cli_usage_doc,
    get_project_metadata,
    verify_docs_integrity,
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def test_project_metadata() -> None:
    """Verify core project metadata structure and non-empty values."""
    meta = get_project_metadata()
    assert meta["name"] == "AI Watcher CLI"
    assert meta["version"] == "1.0.0"
    assert "Step 10.3" in meta["phase"]
    assert len(meta["description"]) > 0


def test_cli_usage_doc() -> None:
    """Verify CLI usage dictionary contains examples for 3 input sources and option flags."""
    usage = get_cli_usage_doc()
    sources = usage["sources"]
    assert "text" in sources
    assert "file" in sources
    assert "url" in sources

    flags = usage["flags"]
    assert len(flags) >= 7
    flag_names = [f["flag"] for f in flags]
    assert any("--text" in fn for fn in flag_names)
    assert any("--file" in fn for fn in flag_names)
    assert any("--url" in fn for fn in flag_names)
    assert any("--output" in fn for fn in flag_names)
    assert any("--demo" in fn for fn in flag_names)

    docker = usage["docker"]
    assert "build" in docker
    assert "run" in docker


def test_verify_docs_integrity() -> None:
    """Verify that all required project documentation files exist on disk."""
    missing = verify_docs_integrity()
    assert missing == [], f"Missing required doc files: {missing}"


def test_readme_sections() -> None:
    """Verify README.md contains key required sections for Step 10.3."""
    readme_path = PROJECT_ROOT / "README.md"
    assert readme_path.exists()
    content = readme_path.read_text(encoding="utf-8")

    required_sections = [
        "Key Features & Specifications",
        "CLI Usage Examples across 3 Input Sources",
        "Option Flags Reference",
        "Docker Deployment & Runtime Instructions",
        "FinOps Cost & Token Breakdown",
        "Quickstart Guide",
    ]

    for section in required_sections:
        assert section in content, f"Section '{section}' missing from README.md"
