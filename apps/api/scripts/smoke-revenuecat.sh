#!/usr/bin/env bash
# Local smoke test for the RevenueCat webhook.
#
# Prereqs:
#   - apps/api/.env.local has REVENUECAT_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY set.
#   - Local API server running: `pnpm --filter @chronos/api dev`
#   - A real user row exists in public.users with the id you pass as USER_ID below.
#
# Usage:
#   USER_ID=<uuid-of-test-user> SECRET=<REVENUECAT_WEBHOOK_SECRET> ./smoke-revenuecat.sh
#
# What it does:
#   1. Fires an INITIAL_PURCHASE → expects status=pro.
#   2. Fires the same event id again → expects idempotent:true.
#   3. Fires EXPIRATION → expects status=lapsed.
#   4. Bad secret → expects 401.
#   5. Missing event.id → expects 400.

set -euo pipefail

: "${USER_ID:?USER_ID is required}"
: "${SECRET:?SECRET is required}"
URL="${URL:-http://localhost:8787/webhooks/revenuecat}"

post() {
  local label="$1"; shift
  local body="$1"; shift
  local secret="${1:-$SECRET}"
  echo
  echo "── $label"
  curl -sS -X POST "$URL" \
    -H "Authorization: Bearer $secret" \
    -H "Content-Type: application/json" \
    -d "$body" | tee /dev/stderr
  echo
}

EVT_PURCHASE=$(uuidgen)
EVT_EXPIRE=$(uuidgen)

post "1. INITIAL_PURCHASE → pro" "$(cat <<JSON
{"event":{"id":"$EVT_PURCHASE","type":"INITIAL_PURCHASE","app_user_id":"$USER_ID"}}
JSON
)"

post "2. duplicate INITIAL_PURCHASE → idempotent" "$(cat <<JSON
{"event":{"id":"$EVT_PURCHASE","type":"INITIAL_PURCHASE","app_user_id":"$USER_ID"}}
JSON
)"

post "3. EXPIRATION → lapsed" "$(cat <<JSON
{"event":{"id":"$EVT_EXPIRE","type":"EXPIRATION","app_user_id":"$USER_ID"}}
JSON
)"

post "4. bad secret → 401" "$(cat <<JSON
{"event":{"id":"x","type":"EXPIRATION","app_user_id":"$USER_ID"}}
JSON
)" "wrong-secret"

post "5. missing event.id → 400" "$(cat <<JSON
{"event":{"type":"EXPIRATION","app_user_id":"$USER_ID"}}
JSON
)"

echo
echo "Done. Verify in Supabase: select id, entitlement_status, last_entitlement_event_id from users where id = '$USER_ID';"
