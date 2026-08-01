#!/usr/bin/env bash
# Onboarding Simulation Script - Wrapper_CLI

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_URL="${REPO_URL:-$LOCAL_REPO_DIR}"
MAX_ONBOARDING_SECONDS=300
SERVER_STARTUP_TIMEOUT=30
TEST_PORT=8765

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

step() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}▶ $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

fail() {
    echo -e "${RED}❌ FAILED: $1${NC}"
    cleanup
    exit 1
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

cleanup() {
    if [ -n "${SERVER_PID:-}" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
        kill "$SERVER_PID" 2>/dev/null || true
        wait "$SERVER_PID" 2>/dev/null || true
    fi
    if [ -n "${TEMP_DIR:-}" ] && [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
}

trap cleanup EXIT

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     🚀 Wrapper_CLI — Onboarding Simulation                   ║"
echo "║        Zero-Setup Friction Scenario Validation               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

GLOBAL_START=$(date +%s)

step "Step 1/5: Create isolated temporary directory"
TEMP_DIR=$(mktemp -d /tmp/aipe_onboarding_XXXXXX)
echo "  Temporary folder created: $TEMP_DIR"
success "Isolated environment ready"

step "Step 2/5: Prepare clean repository copy"
CLONE_START=$(date +%s)
CLONE_DIR="$TEMP_DIR/Wrapper_CLI"
mkdir -p "$CLONE_DIR"
if command -v rsync >/dev/null 2>&1; then
    rsync -a --exclude='.venv' --exclude='__pycache__' --exclude='.pytest_cache' --exclude='.mypy_cache' --exclude='.ruff_cache' "$LOCAL_REPO_DIR/" "$CLONE_DIR/"
else
    cp -R "$LOCAL_REPO_DIR/." "$CLONE_DIR/"
    rm -rf "$CLONE_DIR/.venv" "$CLONE_DIR/.pytest_cache" "$CLONE_DIR/.mypy_cache" "$CLONE_DIR/.ruff_cache"
fi
CLONE_END=$(date +%s)
CLONE_DURATION=$((CLONE_END - CLONE_START))
success "Prepared clean environment in ${CLONE_DURATION}s"

step "Step 3/5: Execute 'make install' (Poetry + pre-commit)"
INSTALL_START=$(date +%s)
cd "$CLONE_DIR"
poetry config virtualenvs.in-project true --local 2>/dev/null || true
make install 2>&1 || fail "'make install' failed"
INSTALL_END=$(date +%s)
INSTALL_DURATION=$((INSTALL_END - INSTALL_START))
success "'make install' completed in ${INSTALL_DURATION}s"

step "Step 4/5: Environment consistency checks"
if [ -d "$CLONE_DIR/.venv" ]; then
    success ".venv/ created locally"
else
    fail ".venv/ directory was not created by 'make install'"
fi

if "$CLONE_DIR/.venv/bin/python" --version 2>/dev/null; then
    success "Python interpreter functional in .venv/"
else
    fail "Python interpreter in .venv/ failed"
fi

"$CLONE_DIR/.venv/bin/python" -c "import typer; import rich; import pydantic; import httpx; import bs4; import tenacity; print('  Typer', typer.__version__, '| Rich', '| Pydantic', pydantic.__version__)" \
    || fail "Production dependencies not importable"
success "Production dependencies importable"

if [ -f "$CLONE_DIR/.vscode/settings.json" ]; then
    success ".vscode/settings.json present"
else
    warn ".vscode/settings.json missing"
fi

if [ -f "$CLONE_DIR/.git/hooks/pre-commit" ]; then
    success "Pre-commit hook installed in .git/hooks/"
else
    warn "Pre-commit hook missing"
fi

step "Step 5/5: Launch CLI in demo mode"
cd "$CLONE_DIR"
if make run ARGS="scan 'Onboarding validation run' --demo"; then
    success "CLI executed successfully in demo mode"
else
    fail "CLI failed to execute in demo mode"
fi

GLOBAL_END=$(date +%s)
TOTAL_DURATION=$((GLOBAL_END - GLOBAL_START))

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║               📊 ONBOARDING REPORT                         ║${NC}"
echo -e "${BLUE}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC}  Git Clone ............................ ${GREEN}${CLONE_DURATION}s${NC}"
echo -e "${BLUE}║${NC}  make install ......................... ${GREEN}${INSTALL_DURATION}s${NC}"
echo -e "${BLUE}║${NC}  Consistency checks ................... ${GREEN}ok${NC}"
echo -e "${BLUE}║${NC}  CLI execution ........................ ${GREEN}ok${NC}"
echo -e "${BLUE}╠══════════════════════════════════════════════════════════════╣${NC}"

if [ "$TOTAL_DURATION" -le "$MAX_ONBOARDING_SECONDS" ]; then
    echo -e "${BLUE}║${NC}  ${GREEN}⏱️  TOTAL DURATION: ${TOTAL_DURATION}s / ${MAX_ONBOARDING_SECONDS}s (< 5 min) ✅${NC}"
    echo -e "${BLUE}║${NC}  ${GREEN}🏆 Zero-Setup Friction KPI: PASSED${NC}"
    EXIT_CODE=0
else
    echo -e "${BLUE}║${NC}  ${RED}⏱️  TOTAL DURATION: ${TOTAL_DURATION}s / ${MAX_ONBOARDING_SECONDS}s (> 5 min) ❌${NC}"
    echo -e "${BLUE}║${NC}  ${RED}📉 Zero-Setup Friction KPI: FAILED${NC}"
    EXIT_CODE=1
fi

echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"

exit $EXIT_CODE
