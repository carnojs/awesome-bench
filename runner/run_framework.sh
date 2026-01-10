#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRAMEWORK_PATH="$1"
RESULTS_DIR="${SCRIPT_DIR}/../site/public/results"
CONTRACT_FILE="${SCRIPT_DIR}/../benchmarks/contract.json"

if [ -z "$FRAMEWORK_PATH" ]; then
    echo "Usage: run_framework.sh <framework_path>"
    echo "Example: run_framework.sh frameworks/go/fiber"
    exit 1
fi

if [ ! -d "$FRAMEWORK_PATH" ]; then
    echo "Error: Framework directory not found: $FRAMEWORK_PATH"
    exit 1
fi

if [ ! -f "$FRAMEWORK_PATH/framework.json" ]; then
    echo "Error: framework.json not found in $FRAMEWORK_PATH"
    exit 1
fi

if [ ! -f "$FRAMEWORK_PATH/Dockerfile" ]; then
    echo "Error: Dockerfile not found in $FRAMEWORK_PATH"
    exit 1
fi

FRAMEWORK_ID=$(jq -r '.id' "$FRAMEWORK_PATH/framework.json")
FRAMEWORK_LANGUAGE=$(jq -r '.language' "$FRAMEWORK_PATH/framework.json")
FRAMEWORK_NAME=$(jq -r '.framework' "$FRAMEWORK_PATH/framework.json")
FRAMEWORK_URL=$(jq -r '.url // ""' "$FRAMEWORK_PATH/framework.json")
CONTRACT_VERSION=$(jq -r '.contract_version' "$FRAMEWORK_PATH/framework.json")

echo "========================================"
echo "Running benchmark for: $FRAMEWORK_ID"
echo "Language: $FRAMEWORK_LANGUAGE"
echo "Framework: $FRAMEWORK_NAME"
echo "========================================"

CONTAINER_NAME="benchhub-${FRAMEWORK_ID}-$$"
IMAGE_NAME="benchhub/${FRAMEWORK_ID}:latest"

cleanup() {
    echo "Cleaning up..."
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
}
trap cleanup EXIT

echo ""
echo "Building Docker image..."
docker build -t "$IMAGE_NAME" "$FRAMEWORK_PATH"

echo ""
echo "Starting container..."
docker run -d --name "$CONTAINER_NAME" -p 8080:8080 "$IMAGE_NAME"

echo ""
echo "Waiting for server to be ready..."
MAX_RETRIES=60
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health | grep -q "200"; then
        echo "Server is ready!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 1
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "Error: Server failed to start within ${MAX_RETRIES} seconds"
    exit 1
fi

echo ""
echo "Validating contract compliance..."
"$SCRIPT_DIR/validate_contract.sh" "http://localhost:8080"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
FRAMEWORK_RESULTS_DIR="${RESULTS_DIR}/frameworks/${FRAMEWORK_ID}"
mkdir -p "$FRAMEWORK_RESULTS_DIR"

TMP_DIR=$(mktemp -d)

echo ""
echo "Running benchmarks..."

ROUTES_COUNT=$(jq '.routes | length' "$CONTRACT_FILE")
BENCHMARKS_JSON="{"

for i in $(seq 0 $((ROUTES_COUNT - 1))); do
    ROUTE_ID=$(jq -r ".routes[$i].id" "$CONTRACT_FILE")
    ROUTE_PATH=$(jq -r ".routes[$i].path" "$CONTRACT_FILE")

    echo ""
    echo "Benchmarking route: $ROUTE_ID ($ROUTE_PATH)"

    "$SCRIPT_DIR/benchmark.sh" "$ROUTE_ID" "http://localhost:8080${ROUTE_PATH}" "${TMP_DIR}/${ROUTE_ID}.json"

    ROUTE_RESULT=$(cat "${TMP_DIR}/${ROUTE_ID}.json.parsed")
    RPS=$(echo "$ROUTE_RESULT" | jq '.requests_per_sec')
    P50=$(echo "$ROUTE_RESULT" | jq '.latency_ms.p50')
    P95=$(echo "$ROUTE_RESULT" | jq '.latency_ms.p95')
    P99=$(echo "$ROUTE_RESULT" | jq '.latency_ms.p99')
    ERRORS=$(echo "$ROUTE_RESULT" | jq '.errors')

    if [ "$i" -gt 0 ]; then
        BENCHMARKS_JSON="${BENCHMARKS_JSON},"
    fi

    BENCHMARKS_JSON="${BENCHMARKS_JSON}\"${ROUTE_ID}\":{\"duration_seconds\":6,\"requests_per_sec\":${RPS},\"latency_ms\":{\"p50\":${P50},\"p95\":${P95},\"p99\":${P99}},\"errors\":${ERRORS}}"
done

BENCHMARKS_JSON="${BENCHMARKS_JSON}}"

OHA_VERSION=$(oha --version 2>/dev/null | head -n1 || echo "unknown")
OS_INFO="${RUNNER_OS:-$(uname -s)}"
CI_INFO="${CI:-false}"

SNAPSHOT=$(cat << EOF
{
  "framework_id": "$FRAMEWORK_ID",
  "language": "$FRAMEWORK_LANGUAGE",
  "framework": "$FRAMEWORK_NAME",
  "url": "$FRAMEWORK_URL",
  "measured_at": "$TIMESTAMP",
  "contract_version": $CONTRACT_VERSION,
  "runner_version": "1.0.0",
  "environment": {
    "os": "$OS_INFO",
    "ci": "$CI_INFO",
    "oha_version": "$OHA_VERSION"
  },
  "benchmarks": $BENCHMARKS_JSON
}
EOF
)

TIMESTAMP_FILE=$(echo "$TIMESTAMP" | tr ':' '-')
echo "$SNAPSHOT" | jq '.' > "${FRAMEWORK_RESULTS_DIR}/${TIMESTAMP_FILE}.json"
echo "$SNAPSHOT" | jq '.' > "${FRAMEWORK_RESULTS_DIR}/latest.json"

rm -rf "$TMP_DIR"

echo ""
echo "========================================"
echo "Benchmark complete for: $FRAMEWORK_ID"
echo "Results saved to: ${FRAMEWORK_RESULTS_DIR}/latest.json"
echo "========================================"
