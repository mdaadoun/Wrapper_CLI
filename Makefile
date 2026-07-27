# ==============================================================================
# Makefile - Unified Command Interface for Wrapper_CLI
# ==============================================================================

.PHONY: install clean lint test dev dashboard docker-build onboarding-check help

help:
	@echo "======================================================================"
	@echo "                   Wrapper_CLI - Available Commands                   "
	@echo "======================================================================"
	@echo "  make install      - Onboarding: Install dependencies & git hooks."
	@echo "  make clean        - Maintenance: Purge cache & temporary artifacts."
	@echo "  make lint         - Quality: Run Ruff linter/formatter & strict Mypy."
	@echo "  make test         - QA: Run full pytest test suite."
	@echo "  make dashboard    - Interface: Start Next.js interactive dashboard."
	@echo "  make run          - CLI: Execute main CLI command."
	@echo "                      Example: make run ARGS=\"--help\""
	@echo "  make docker-build - Docker: Build multi-stage image (< 250 MB target)."
	@echo "  make onboarding-check - Simulation: Validate < 5 min zero-setup onboarding."
	@echo "======================================================================"

install:
	poetry install
	poetry run pre-commit install

clean:
	@echo "Cleaning cache directories and temporary files..."
	rm -rf .pytest_cache .mypy_cache .ruff_cache htmlcov .coverage
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

lint:
	@echo "--- [1/3] Static analysis (Ruff) ---"
	poetry run ruff check .
	@echo "--- [2/3] Code formatting check (Ruff Format) ---"
	poetry run ruff format --check .
	@echo "--- [3/3] Strict type check (Mypy) ---"
	poetry run python -m mypy src/

test:
	poetry run python -m pytest

run:
	poetry run python -m src.ai_watcher.main $(ARGS)

dashboard:
	npm --prefix dashboard run dev

docker-build:
	@echo "--- Building production multi-stage Docker image ---"
	docker build -t wrapper-cli:latest .
	@echo "--- Final image size ---"
	@docker images wrapper-cli:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

onboarding-check:
	@echo "--- Zero-Setup Friction Onboarding Simulation ---"
	bash scripts/simulate_onboarding.sh
