"""
Unit tests for Step 10.1: Multi-Stage CLI Dockerfile Adaptation.
Validates multi-stage build instructions, ENTRYPOINT configuration, non-root appuser setup,
.dockerignore exclusions, and Makefile integration.
"""

from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
DOCKERFILE_PATH = PROJECT_DIR / "Dockerfile"
DOCKERIGNORE_PATH = PROJECT_DIR / ".dockerignore"
MAKEFILE_PATH = PROJECT_DIR / "Makefile"


def test_dockerfile_exists_and_non_empty() -> None:
    """Verify Dockerfile exists at project root and is non-empty."""
    assert DOCKERFILE_PATH.exists(), "Dockerfile must exist at project root."
    assert DOCKERFILE_PATH.stat().st_size > 0, "Dockerfile must not be empty."


def test_dockerfile_multi_stage_structure() -> None:
    """Verify Dockerfile utilizes multi-stage build (builder and runtime stages)."""
    content = DOCKERFILE_PATH.read_text(encoding="utf-8")
    assert "FROM python:3.10-slim AS builder" in content, "Builder stage missing."
    assert "FROM python:3.10-slim AS runtime" in content, "Runtime stage missing."
    assert content.count("FROM ") >= 2, "Dockerfile must contain at least 2 stages."


def test_dockerfile_cli_entrypoint_configuration() -> None:
    """Verify Dockerfile sets ENTRYPOINT for CLI execution and removes web server CMD/EXPOSE."""
    content = DOCKERFILE_PATH.read_text(encoding="utf-8")
    assert (
        'ENTRYPOINT ["python", "-m", "src.ai_watcher.main"]' in content
    ), "ENTRYPOINT must execute main CLI module."
    assert 'CMD ["scan", "--help"]' in content, "CMD must set default CLI arguments."
    assert "uvicorn" not in content, "Web server (uvicorn) must be removed."
    assert "EXPOSE " not in content, "HTTP server EXPOSE directive must be removed."
    assert "HEALTHCHECK " not in content, "HTTP healthcheck directive must be removed."


def test_dockerfile_security_non_root_user() -> None:
    """Verify Dockerfile configures unprivileged non-root appuser and group."""
    content = DOCKERFILE_PATH.read_text(encoding="utf-8")
    assert "addgroup --system appgroup" in content, "appgroup creation missing."
    assert (
        "adduser --system --uid 1000 --ingroup appgroup" in content
    ), "appuser creation missing."
    assert "USER appuser" in content, "USER directive must switch to appuser."
    assert (
        "--chown=appuser:appgroup" in content
    ), "Copy directives must preserve non-root ownership."


def test_dockerignore_exclusions() -> None:
    """Verify .dockerignore excludes virtual environment, tests, docs, git, and dashboard."""
    assert DOCKERIGNORE_PATH.exists(), ".dockerignore file must exist."
    content = DOCKERIGNORE_PATH.read_text(encoding="utf-8")
    lines = [
        line.strip()
        for line in content.splitlines()
        if line.strip() and not line.startswith("#")
    ]
    assert ".venv/" in lines, ".venv/ must be excluded in .dockerignore."
    assert "tests/" in lines, "tests/ must be excluded in .dockerignore."
    assert "dashboard/" in lines, "dashboard/ must be excluded in .dockerignore."
    assert "docs/" in lines, "docs/ must be excluded in .dockerignore."
    assert ".git/" in lines, ".git/ must be excluded in .dockerignore."


def test_makefile_docker_build_target() -> None:
    """Verify Makefile includes docker-build target for image creation."""
    assert MAKEFILE_PATH.exists(), "Makefile must exist at project root."
    content = MAKEFILE_PATH.read_text(encoding="utf-8")
    assert "docker-build:" in content, "docker-build target missing in Makefile."
    assert "docker build -t" in content, "docker build command missing in Makefile."
