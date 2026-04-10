#!/usr/bin/env bash
# bootstrap.sh — 새 PC에서 1회 실행
# jacob-plugin 마켓플레이스 등록 → env 플러그인 설치 → 전체 환경 동기화

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== jacob-plugin 부트스트랩 ==="

# 1. jacob-plugin 마켓플레이스 등록
echo "[1/3] 마켓플레이스 등록..."
claude plugin marketplace add Kang-Jacob-GitLB/jacob-plugin 2>/dev/null; true

# 2. env 플러그인 설치
echo "[2/3] env 플러그인 설치..."
claude plugin install env@jacob-plugin 2>/dev/null; true

# 3. env.json 기반 전체 환경 동기화 (dev 포함)
echo "[3/3] 환경 동기화..."
node "$SCRIPT_DIR/plugins/env/scripts/sync-env.js"

echo "=== 완료. 이후 /sync, /add, /export 스킬 사용 가능. ==="
