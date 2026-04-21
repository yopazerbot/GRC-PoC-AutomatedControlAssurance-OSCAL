#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8000}"

echo "Running mock-pass scenario..."
curl -s -X POST "$BASE_URL/api/runs" \
  -H "Content-Type: application/json" \
  -d '{"mode": "mock-pass"}' | python -m json.tool

echo ""
echo "Running mock-fail scenario..."
curl -s -X POST "$BASE_URL/api/runs" \
  -H "Content-Type: application/json" \
  -d '{"mode": "mock-fail"}' | python -m json.tool

echo ""
echo "Listing runs..."
curl -s "$BASE_URL/api/runs" | python -m json.tool
