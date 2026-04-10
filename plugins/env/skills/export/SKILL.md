---
name: export
description: 현재 PC의 settings.json에서 env.json을 생성/갱신한다. "/export", "환경 내보내기", "export env" 등의 요청에 사용한다.
allowed-tools: Bash, Read, Edit
---

## 현재 상태

- settings.json: !`cat "$HOME/.claude/settings.json" 2>/dev/null || echo "not found"`
- 현재 env.json: !`cat "$(find "$HOME/.claude" -maxdepth 8 -path "*/env/env.json" -type f 2>/dev/null | head -1)" 2>/dev/null || echo "not found"`

## 변수 치환 규칙 (역방향)

settings.json의 값을 env.json에 저장할 때, 머신 의존 경로를 변수로 치환한다:
- 홈 디렉토리 경로 (`$HOME` 또는 `$USERPROFILE` 값) → `${HOME}`
- 사용자명 (`$USER` 또는 `$USERNAME` 값) → `${USER}`

## 작업 지침

현재 PC의 settings.json을 분석하여 env.json을 생성한다.

### 1. settings.json 분석

settings.json에서 아래 섹션을 추출한다:

| settings.json 키 | env.json 매핑 |
|---|---|
| `extraKnownMarketplaces` | `marketplaces` 배열 |
| `enabledPlugins` (값이 `true`인 것만) | `plugins` 객체 (`"latest"`) |
| `mcpServers` | `mcpServers` 객체 |
| `hooks` | `hooks` 객체 |
| 나머지 포터블 설정 | `settings` 객체 |

**제외 항목** (머신별 상태이므로):
- `feedbackSurveyState`
- `permissions` (비어있으면)
- `enabledPlugins` (plugins 섹션으로 이동)
- `extraKnownMarketplaces` (marketplaces 섹션으로 이동)

### 2. 변수 치환 (역방향)

모든 문자열 값에서 머신 의존 경로를 `${HOME}`, `${USER}` 변수로 교체한다.

### 3. env.json 생성

위에서 추출한 데이터를 env.json 형식으로 구성한다:

```json
{
  "marketplaces": [...],
  "plugins": { "name@marketplace": "latest", ... },
  "mcpServers": { ... },
  "hooks": { ... },
  "settings": { ... }
}
```

### 4. 사용자 확인

생성된 env.json 내용을 사용자에게 보여주고 확인을 받는다.

### 5. jacob-plugin 저장소에 푸시

```bash
TMPDIR=$(mktemp -d)
git clone --depth 1 https://github.com/Kang-Jacob-GitLB/jacob-plugin.git "$TMPDIR/jacob-plugin"
```

`$TMPDIR/jacob-plugin/plugins/env/env.json`에 저장한다.

```bash
cd "$TMPDIR/jacob-plugin"
git add plugins/env/env.json
git commit -m "feat: env.json 환경 내보내기"
git push origin main
```

### 6. 설치된 env.json 동기화 및 정리

```bash
INSTALLED_ENV=$(find "$HOME/.claude" -maxdepth 8 -path "*/env/env.json" -type f 2>/dev/null | head -1)
[ -n "$INSTALLED_ENV" ] && cp "$TMPDIR/jacob-plugin/plugins/env/env.json" "$INSTALLED_ENV"
rm -rf "$TMPDIR"
```

### 7. 완료 보고

- 추출된 마켓플레이스 수
- 추출된 플러그인 수
- 추출된 MCP 서버 수
- 추출된 hook 수
- 추출된 설정 항목 수
