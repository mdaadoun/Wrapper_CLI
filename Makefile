# ==============================================================================
# Makefile - Unified Command Interface for Wrapper_CLI
# ==============================================================================

POETRY := $(shell command -v poetry 2>/dev/null)
RUN_PREFIX := $(if $(POETRY),poetry run,.venv/bin/python -m)
PYTEST_CMD := $(if $(POETRY),poetry run env PYTHONPATH=src python -m pytest,.venv/bin/pytest)
RUFF_CMD := $(if $(POETRY),poetry run ruff,.venv/bin/ruff)
MYPY_CMD := $(if $(POETRY),poetry run env PYTHONPATH=src python -m mypy,PYTHONPATH=src .venv/bin/mypy)
CLI_CMD := $(if $(POETRY),poetry run env PYTHONPATH=src python -m ai_watcher.main,PYTHONPATH=src .venv/bin/python -m ai_watcher.main)

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
	$(if $(POETRY),poetry install,.venv/bin/pip install -e .)
	$(RUN_PREFIX) pre-commit install

clean:
	@echo "Cleaning cache directories and temporary files..."
	rm -rf .pytest_cache .mypy_cache .ruff_cache htmlcov .coverage
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

lint:
	@echo "--- [1/3] Static analysis (Ruff) ---"
	$(RUFF_CMD) check .
	@echo "--- [2/3] Code formatting check (Ruff Format) ---"
	$(RUFF_CMD) format --check .
	@echo "--- [3/3] Strict type check (Mypy) ---"
	$(MYPY_CMD) src/

test:
	$(PYTEST_CMD)

run:
	$(CLI_CMD) $(ARGS)

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
