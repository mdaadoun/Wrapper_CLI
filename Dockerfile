# ==============================================================================
# Dockerfile - Multi-Stage Production Image for AI Watcher CLI
# ==============================================================================

# STAGE 1: BUILDER
FROM python:3.10-slim AS builder

ENV POETRY_VERSION=1.8.2
ENV POETRY_HOME=/opt/poetry
ENV POETRY_VIRTUALENVS_IN_PROJECT=true
ENV POETRY_NO_INTERACTION=1
ENV PATH="${POETRY_HOME}/bin:${PATH}"

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && curl -sSL https://install.python-poetry.org | python3 - \
    && apt-get purge -y curl \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY pyproject.toml poetry.lock ./
RUN poetry install --only main --no-root
COPY src/ ./src/

# STAGE 2: RUNTIME
FROM python:3.10-slim AS runtime

LABEL maintainer="Michael <michael@example.com>"
LABEL description="Wrapper_CLI - Automated AI Watcher CLI Microservice"
LABEL version="0.1.0"

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH="/app/.venv/bin:${PATH}"
ENV PYTHONPATH="/app/src:${PYTHONPATH}"

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system appgroup \
    && adduser --system --uid 1000 --ingroup appgroup --no-create-home appuser

COPY --from=builder --chown=appuser:appgroup /app/.venv /app/.venv
COPY --from=builder --chown=appuser:appgroup /app/src /app/src

USER appuser

ENTRYPOINT ["python", "-m", "src.ai_watcher.main"]
CMD ["scan", "--help"]
