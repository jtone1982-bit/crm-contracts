#!/bin/bash
# setup-supabase.sh — quick helper to create required bucket
# Run after executing schema.sql in Supabase SQL Editor

set -e

echo "Supabase setup helper"
echo "Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set"

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: missing env variables"
  exit 1
fi

# Create public bucket candidate-files
curl -s -X POST "${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/bucket" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"id":"candidate-files","name":"candidate-files","public":true}' || true

echo "Bucket candidate-files created or already exists"
