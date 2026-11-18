#!/bin/sh
# Runs three times weekly from the VPS. No credentials in command arguments/logs.
set -eu
repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
env_file=${KEEPALIVE_ENV_FILE:-"$repo_dir/.env.local"}
url=${KEEPALIVE_URL:-https://fadialhazim.com/api/internal/supabase-keepalive}
secret=$(sed -n 's/^KEEPALIVE_SECRET=//p' "$env_file" | tr -d '\r' | tail -n 1)
if [ -z "$secret" ]; then
  printf '%s\n' 'KEEPALIVE_SECRET is missing from the server environment file.' >&2
  exit 1
fi
printf 'Authorization: Bearer %s\n' "$secret" |
  curl --fail --silent --show-error --connect-timeout 10 --max-time 30 \
    --header @- "$url" > /dev/null
