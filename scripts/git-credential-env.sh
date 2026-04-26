#!/usr/bin/env bash
# git-credential-env.sh
# ---------------------
# Git credential helper that reads GH_TOKEN (and optionally GH_USER)
# from the project's .env file.
#
# Usage (configured automatically via local git config):
#   git config --local credential.helper '!bash "${GIT_DIR}/../scripts/git-credential-env.sh"'

set -euo pipefail

# Resolve .env relative to this script's location (scripts/../.env)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [[ "$1" == "get" ]]; then
  if [[ -f "$ENV_FILE" ]]; then
    # Load only GH_TOKEN and GH_USER lines — do not eval the whole file
    while IFS='=' read -r key value; do
      [[ "$key" =~ ^# ]] && continue
      [[ -z "$key" ]] && continue
      export "$key"="$value"
    done < <(grep -E '^(GH_TOKEN|GH_USER)=' "$ENV_FILE" || true)
  fi

  echo "username=${GH_USER:-git}"
  echo "password=${GH_TOKEN:-}"
fi

# git credential helpers must be no-ops for "store" and "erase"

