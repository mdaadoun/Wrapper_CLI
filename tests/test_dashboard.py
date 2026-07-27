"""Unit tests for Wrapper_CLI Dashboard documentation integrity and Next.js build."""

import json
import os
import subprocess
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
DOCS_DIR = PROJECT_DIR / "docs"


def test_documentation_files_exist() -> None:
    """Verify essential documentation markdown files exist in English and French."""
    required_docs = [
        "presentation_en.md",
        "presentation_fr.md",
        "roadmap_en.md",
        "roadmap_fr.md",
        "glossary_en.md",
        "glossary_fr.md",
        "questions_en.md",
        "questions_fr.md",
        "code_en.md",
        "code_fr.md",
    ]

    for doc_name in required_docs:
        doc_path = DOCS_DIR / doc_name
        assert doc_path.exists(), f"Missing required doc file: {doc_name}"
        assert doc_path.stat().st_size > 0, f"Doc file is empty: {doc_name}"


def test_nextjs_dashboard_package_json() -> None:
    """Verify Next.js dashboard project configuration exists and contains required scripts."""
    pkg_path = PROJECT_DIR / "dashboard" / "package.json"
    assert pkg_path.exists(), "dashboard/package.json missing"

    content = json.loads(pkg_path.read_text(encoding="utf-8"))
    assert "scripts" in content
    assert "dev" in content["scripts"]
    assert "build" in content["scripts"]


def test_nextjs_dashboard_build() -> None:
    """Verify Next.js dashboard compiles cleanly without build errors."""
    next_dir = PROJECT_DIR / "dashboard"
    env = os.environ.copy()
    env["NODE_ENV"] = "production"

    result = subprocess.run(
        ["npm", "run", "build"],
        cwd=str(next_dir),
        env=env,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, (
        f"Next.js build failed with code {result.returncode}. Output:"
        f" {result.stdout} {result.stderr}"
    )
