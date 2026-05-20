#!/usr/bin/env bash
# Delegate to release-bump.mjs (pass through all args, e.g. --no-git 0.2.0).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "${SCRIPT_DIR}/release-bump.mjs" "$@"
