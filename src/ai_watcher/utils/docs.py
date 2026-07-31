"""
Documentation utility functions for AI Watcher CLI.
Provides metadata, CLI option reference, and documentation integrity verification.
"""

from pathlib import Path
from typing import Any, Dict, List

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DOCS_DIR = PROJECT_ROOT / "docs"

REQUIRED_DOC_FILES = [
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


def get_project_metadata() -> Dict[str, Any]:
    """Return core project metadata."""
    return {
        "name": "AI Watcher CLI",
        "version": "1.0.0",
        "description": "Automated tech surveillance & LLM FinOps CLI wrapper",
        "phase": "Step 10.3",
        "roadmap_status": "Documentation Finalization & README Complete",
        "author": "AI Engineering Team",
        "license": "MIT",
    }


def get_cli_usage_doc() -> Dict[str, Any]:
    """Return CLI usage examples and flag references for 3 input sources."""
    return {
        "sources": {
            "text": "ai-watcher scan 'LLM technology update' --demo",
            "file": "ai-watcher scan ./article.md --demo",
            "url": "ai-watcher scan https://example.com/blog --demo",
        },
        "flags": [
            {"flag": "--text (-t)", "desc": "Force raw text mode"},
            {"flag": "--file (-f)", "desc": "Force local file path mode"},
            {"flag": "--url (-u)", "desc": "Force web URL scraping mode"},
            {
                "flag": "--output (-o)",
                "desc": "Output format: console, json, or .md/.json file",
            },
            {
                "flag": "--demo (-d)",
                "desc": "Run offline demo mode with mocked LLM response",
            },
            {
                "flag": "--cache-ttl",
                "desc": "Cache time-to-live in seconds (default: 3600)",
            },
            {"flag": "--no-cache", "desc": "Bypass reading and writing local cache"},
        ],
        "docker": {
            "build": "docker build -t ai-watcher .",
            "run": "docker run -e GEMINI_API_KEY=your_key ai-watcher scan 'test' --demo",
        },
    }


def verify_docs_integrity() -> List[str]:
    """Verify presence and non-emptiness of all required documentation files."""
    missing: List[str] = []

    readme_path = PROJECT_ROOT / "README.md"
    if not readme_path.exists() or readme_path.stat().st_size == 0:
        missing.append("README.md")

    readme_fr_path = PROJECT_ROOT / "README_fr.md"
    if not readme_fr_path.exists() or readme_fr_path.stat().st_size == 0:
        missing.append("README_fr.md")

    for doc in REQUIRED_DOC_FILES:
        doc_path = DOCS_DIR / doc
        if not doc_path.exists() or doc_path.stat().st_size == 0:
            missing.append(f"docs/{doc}")

    return missing
