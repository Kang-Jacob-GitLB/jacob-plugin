#!/usr/bin/env bash
# sync-env.sh — sync-env.js 래퍼 (bootstrap.sh에서 호출)
set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
node "$SCRIPT_DIR/sync-env.js"
