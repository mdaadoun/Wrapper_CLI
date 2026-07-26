#!/usr/bin/env bash
# Onboarding Simulation Script - AIPE_Framework (Step 6.2)

set -euo pipefail

REPO_URL="git@github.com:mdaadoun/Wrapper_CLI.git"
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

step "Step 2/5: Clone repository from GitHub"
CLONE_START=$(date +%s)
git clone "$REPO_URL" "$TEMP_DIR/AIPE_Framework" 2>&1 || fail "Git clone failed"
CLONE_END=$(date +%s)
CLONE_DURATION=$((CLONE_END - CLONE_START))
success "Cloned in ${CLONE_DURATION}s"

CLONE_DIR="$TEMP_DIR/AIPE_Framework"

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

"$CLONE_DIR/.venv/bin/python" -c "import fastapi; import pydantic; import uvicorn; print('  FastAPI', fastapi.__version__, '| Pydantic', pydantic.__version__, '| Uvicorn', uvicorn.__version__)" \
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

step "Step 5/5: Launch 'make dev' & test healthcheck"
cd "$CLONE_DIR"
"$CLONE_DIR/.venv/bin/python" -m uvicorn src.main:app --port "$TEST_PORT" &
SERVER_PID=$!

echo "  Waiting for server startup (PID: $SERVER_PID)..."
WAIT_COUNT=0
SERVER_READY=false

while [ "$WAIT_COUNT" -lt "$SERVER_STARTUP_TIMEOUT" ]; do
    if curl -sf "http://localhost:${TEST_PORT}/health" > /dev/null 2>&1; then
        SERVER_READY=true
        break
    fi
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
done

if [ "$SERVER_READY" = true ]; then
    success "FastAPI server started in ${WAIT_COUNT}s"
    HEALTH_RESPONSE=$(curl -sf "http://localhost:${TEST_PORT}/health")
    echo "  /health response: $HEALTH_RESPONSE"

    if echo "$HEALTH_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
assert data.get('status') == 'healthy', f'status={data.get(\"status\")}'
assert 'version' in data, 'missing version'
assert 'environment' in data, 'missing environment'
print('  Validated fields: status=healthy, version=' + data['version'] + ', environment=' + data['environment'])
" 2>&1; then
        success "Healthcheck /health matches contract"
    else
        fail "/health response does not comply with contract"
    fi
else
    fail "Server failed to start within ${SERVER_STARTUP_TIMEOUT}s"
fi

kill "$SERVER_PID" 2>/dev/null || true
wait "$SERVER_PID" 2>/dev/null || true
unset SERVER_PID

GLOBAL_END=$(date +%s)
TOTAL_DURATION=$((GLOBAL_END - GLOBAL_START))

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║               📊 ONBOARDING REPORT                         ║${NC}"
echo -e "${BLUE}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC}  Git Clone ............................ ${GREEN}${CLONE_DURATION}s${NC}"
echo -e "${BLUE}║${NC}  make install ......................... ${GREEN}${INSTALL_DURATION}s${NC}"
echo -e "${BLUE}║${NC}  Consistency checks ................... ${GREEN}ok${NC}"
echo -e "${BLUE}║${NC}  Server start + healthcheck ........... ${GREEN}${WAIT_COUNT}s${NC}"
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
