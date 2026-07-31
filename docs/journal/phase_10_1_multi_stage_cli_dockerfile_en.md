# Dev Journal Session 10.1: Multi-Stage CLI Dockerfile Adaptation

**Date:** 2026-07-31

Adapted the multi-stage Dockerfile to package the AI Watcher application as an executable, unprivileged CLI container rather than a web server. Configured the builder stage to compile dependencies via Poetry, set up the runtime stage with minimal overhead, replaced the server CMD with an explicit ENTRYPOINT pointing to the Typer CLI module, and verified security controls with non-root appuser execution.

---

### 1. Concepts Introduced

- **Executable CLI Container Paradigm**: Utilizing Docker `ENTRYPOINT` instead of `CMD` to make the container act directly as a command-line executable that receives CLI arguments dynamically during `docker run`.
- **Multi-Stage Build Optimization**: Separating build-time dependencies (Poetry, compiler toolchain) in the builder stage from runtime artifacts (`.venv`, Python source) to achieve a lightweight image footprint (< 250 MB).
- **Unprivileged Execution & Least Privilege**: Executing container workloads under a dedicated non-root user (`appuser:1000`) and group (`appgroup`) to harden container runtime security.

---

### 2. Architecture Decisions (ADR)

#### ADR 1: ENTRYPOINT `["python", "-m", "src.ai_watcher.main"]` with CMD default arguments
- **Option 1**: Keep server `CMD ["uvicorn", ...]`.
- **Option 2 (Selected)**: `ENTRYPOINT ["python", "-m", "src.ai_watcher.main"]` with `CMD ["scan", "--help"]`.
- **Rationale**: Allows developers and CI/CD scripts to invoke containerized commands seamlessly (e.g., `docker run ai-watcher scan "text" --demo`) while providing a helpful usage default when executed with no arguments.

#### ADR 2: Non-root Security Hardening (`appuser:1000`)
- **Option 1**: Execute as default root user.
- **Option 2 (Selected)**: Explicit system group `appgroup` and user `appuser` with `chown` file ownership.
- **Rationale**: Prevents potential container breakout vulnerabilities by adhering to strict OS-level least privilege principles.

---

### 3. Implementation & Code

See `Dockerfile`, `tests/test_dockerfile.py`, `.dockerignore`, and `Makefile`.

---

### 4. Session Checklist & Deliverables

- [x] Adapted multi-stage Dockerfile for CLI entrypoint and removed `EXPOSE`/`HEALTHCHECK` web server remnants.
- [x] Created unit test suite `tests/test_dockerfile.py` covering multi-stage structure, entrypoint, user privileges, and `.dockerignore` rules.
- [x] Verified 100% test pass rate across 190 total test items.
