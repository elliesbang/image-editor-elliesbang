#!/usr/bin/env bash
set -euo pipefail

if ! command -v netlify >/dev/null 2>&1; then
  echo "The Netlify CLI is required. Install it with 'npm install -g netlify-cli'." >&2
  exit 1
fi

read -rp "SUPABASE_URL: " SUPABASE_URL
read -rp "SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
read -rp "JWT_SECRET: " JWT_SECRET

echo "\nWriting values to your Netlify site..."
netlify env:set SUPABASE_URL "$SUPABASE_URL"
netlify env:set SUPABASE_ANON_KEY "$SUPABASE_ANON_KEY"
netlify env:set JWT_SECRET "$JWT_SECRET"

echo "All variables have been configured."
