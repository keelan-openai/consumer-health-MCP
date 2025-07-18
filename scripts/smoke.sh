#!/usr/bin/env bash
set -euo pipefail
BASE=${1:-http://localhost:3000}

echo "Health:"
curl -s $BASE/ | jq .

echo "Search (empty):"
curl -s -X POST $BASE/search -H 'Content-Type: application/json' -d '{}' | jq .

echo "Search (blood):"
curl -s -X POST $BASE/search -H 'Content-Type: application/json' -d '{"query":"blood"}' | jq .

echo "Fetch existing:"
curl -s -X POST $BASE/fetch -H 'Content-Type: application/json' -d '{"id":"bp-001"}' | jq .

echo "Fetch missing:"
curl -s -X POST $BASE/fetch -H 'Content-Type: application/json' -d '{"id":"nope"}' | jq .

echo "Body spec:"
curl -s -X POST $BASE/nbodyspec -H 'Content-Type: application/json' -d '{"height":180,"weight":75}' | jq .
