#!/bin/bash
set -e

ROUTE_ID="$1"
URL="$2"
OUTPUT_FILE="$3"
METHOD="${4:-GET}"
BODY="$5"

DURATION="6s"
CONNECTIONS=64

if [ -z "$ROUTE_ID" ] || [ -z "$URL" ] || [ -z "$OUTPUT_FILE" ]; then
    echo "Usage: benchmark.sh <route_id> <url> <output_file> [method] [body]"
    exit 1
fi

echo "Running benchmark for $DURATION with $CONNECTIONS connections..."
if [ "$METHOD" = "POST" ] && [ -n "$BODY" ] && [ "$BODY" != "null" ]; then
    oha -z "$DURATION" --no-tui -j -m POST -H "Content-Type: application/json" -d "$BODY" "$URL" > "$OUTPUT_FILE"
else
    oha -z "$DURATION" --no-tui -j "$URL" > "$OUTPUT_FILE"
fi

echo "Parsing results..."

rps=$(jq '.summary.requestsPerSec // 0' "$OUTPUT_FILE")

p50=$(jq '(.latencyPercentiles.p50 // 0) * 1000' "$OUTPUT_FILE")
p95=$(jq '(.latencyPercentiles.p95 // 0) * 1000' "$OUTPUT_FILE")
p99=$(jq '(.latencyPercentiles.p99 // 0) * 1000' "$OUTPUT_FILE")

total=$(jq '.summary.total // 0' "$OUTPUT_FILE")
success_rate=$(jq '.summary.successRate // 1' "$OUTPUT_FILE")
errors=$(echo "$total $success_rate" | awk '{printf "%.0f", $1 * (1 - $2)}')

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
