#!/bin/bash
set -e

ROUTE_ID="$1"
URL="$2"
OUTPUT_FILE="$3"

DURATION="6s"
CONNECTIONS=64
WARMUP_DURATION="1s"

if [ -z "$ROUTE_ID" ] || [ -z "$URL" ] || [ -z "$OUTPUT_FILE" ]; then
    echo "Usage: benchmark.sh <route_id> <url> <output_file>"
    exit 1
fi

echo "Running warmup for $WARMUP_DURATION..."
oha -z "$WARMUP_DURATION" -c "$CONNECTIONS" --no-tui -q "$URL" > /dev/null 2>&1 || true

echo "Running benchmark for $DURATION with $CONNECTIONS connections..."
oha -z "$DURATION" -c "$CONNECTIONS" --no-tui -j "$URL" > "$OUTPUT_FILE"

rps=$(jq '.summary.requestsPerSec' "$OUTPUT_FILE")
p50=$(jq '.latencyPercentiles.p50 * 1000' "$OUTPUT_FILE")
p95=$(jq '.latencyPercentiles.p95 * 1000' "$OUTPUT_FILE")
p99=$(jq '.latencyPercentiles.p99 * 1000' "$OUTPUT_FILE")
errors=$(jq '.summary.errorDistribution | to_entries | map(.value) | add // 0' "$OUTPUT_FILE")

echo "Results for $ROUTE_ID:"
echo "  Requests/sec: $rps"
echo "  Latency p50: ${p50}ms"
echo "  Latency p95: ${p95}ms"
echo "  Latency p99: ${p99}ms"
echo "  Errors: $errors"

cat > "${OUTPUT_FILE}.parsed" << EOF
{
  "route_id": "$ROUTE_ID",
  "duration_seconds": 6,
  "requests_per_sec": $rps,
  "latency_ms": {
    "p50": $p50,
    "p95": $p95,
    "p99": $p99
  },
  "errors": $errors
}
EOF

echo "Benchmark complete. Results saved to ${OUTPUT_FILE}.parsed"
