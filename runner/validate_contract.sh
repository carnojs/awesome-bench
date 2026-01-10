#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACT_FILE="${SCRIPT_DIR}/../benchmarks/contract.json"
BASE_URL="${1:-http://localhost:8080}"

if [ ! -f "$CONTRACT_FILE" ]; then
    echo "Error: Contract file not found at $CONTRACT_FILE"
    exit 1
fi

validate_route() {
    local id="$1"
    local method="$2"
    local path="$3"
    local expect_status="$4"
    local expect_content_type="$5"
    local response_type="$6"
    local response_body="$7"
    local request_body="$8"

    local url="${BASE_URL}${path}"
    local response
    local http_code
    local content_type
    local body

    if [ "$method" = "POST" ] && [ -n "$request_body" ] && [ "$request_body" != "null" ]; then
        response=$(curl -s -w "\n%{http_code}\n%{content_type}" -X POST -H "Content-Type: application/json" -d "$request_body" "$url")
    else
        response=$(curl -s -w "\n%{http_code}\n%{content_type}" -X "$method" "$url")
    fi
    body=$(echo "$response" | sed -n '1p')
    http_code=$(echo "$response" | sed -n '2p')
    content_type=$(echo "$response" | sed -n '3p')

    if [ "$http_code" != "$expect_status" ]; then
        echo "FAIL [$id]: Expected status $expect_status, got $http_code"
        return 1
    fi

    if [[ ! "$content_type" =~ ^${expect_content_type} ]]; then
        echo "FAIL [$id]: Expected content-type '$expect_content_type', got '$content_type'"
        return 1
    fi

    if [ "$response_type" = "text" ]; then
        if [ "$body" != "$response_body" ]; then
            echo "FAIL [$id]: Expected body '$response_body', got '$body'"
            return 1
        fi
    elif [ "$response_type" = "json" ]; then
        local expected_json=$(echo "$response_body" | jq -cS '.')
        local actual_json=$(echo "$body" | jq -cS '.' 2>/dev/null)
        if [ "$expected_json" != "$actual_json" ]; then
            echo "FAIL [$id]: JSON mismatch"
            echo "  Expected: $expected_json"
            echo "  Got: $actual_json"
            return 1
        fi
    fi

    echo "PASS [$id]"
    return 0
}

echo "Validating health endpoint..."
health_path=$(jq -r '.server.health.path' "$CONTRACT_FILE")
health_status=$(jq -r '.server.health.expect_status' "$CONTRACT_FILE")
health_response=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}${health_path}")
health_code=$(echo "$health_response" | tail -n1)

if [ "$health_code" != "$health_status" ]; then
    echo "FAIL [health]: Expected status $health_status, got $health_code"
    exit 1
fi
echo "PASS [health]"

echo ""
echo "Validating routes..."

routes_count=$(jq '.routes | length' "$CONTRACT_FILE")
failed=0

for i in $(seq 0 $((routes_count - 1))); do
    id=$(jq -r ".routes[$i].id" "$CONTRACT_FILE")
    method=$(jq -r ".routes[$i].method" "$CONTRACT_FILE")
    path=$(jq -r ".routes[$i].path" "$CONTRACT_FILE")
    expect_status=$(jq -r ".routes[$i].expect_status" "$CONTRACT_FILE")
    expect_content_type=$(jq -r ".routes[$i].headers[\"content-type\"]" "$CONTRACT_FILE")
    response_type=$(jq -r ".routes[$i].response.type" "$CONTRACT_FILE")
    response_body=$(jq -c ".routes[$i].response.body" "$CONTRACT_FILE")
    request_body=$(jq -c ".routes[$i].request.body // null" "$CONTRACT_FILE")

    # Substituir path params
    path_params=$(jq -c ".routes[$i].path_params // {}" "$CONTRACT_FILE")
    if [ "$path_params" != "{}" ]; then
        for key in $(echo "$path_params" | jq -r 'keys[]'); do
            value=$(echo "$path_params" | jq -r ".[\"$key\"]")
            path=$(echo "$path" | sed "s/:$key/$value/g")
        done
    fi

    # Adicionar query params
    query_params=$(jq -c ".routes[$i].query // {}" "$CONTRACT_FILE")
    if [ "$query_params" != "{}" ]; then
        query_string=$(echo "$query_params" | jq -r 'to_entries | map("\(.key)=\(.value)") | join("&")')
        path="${path}?${query_string}"
    fi

    if [ "$response_type" = "text" ]; then
        response_body=$(jq -r ".routes[$i].response.body" "$CONTRACT_FILE")
    fi

    if ! validate_route "$id" "$method" "$path" "$expect_status" "$expect_content_type" "$response_type" "$response_body" "$request_body"; then
        failed=1
    fi
done

echo ""
if [ $failed -eq 1 ]; then
    echo "Validation FAILED"
    exit 1
fi

echo "All validations PASSED"
exit 0
