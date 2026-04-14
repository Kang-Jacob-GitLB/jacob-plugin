# mccm

**m**y-**c**laude-**c**ode-**m**arketplace — Claude Code 플러그인 마켓플레이스.

## 플러그인

### env — 환경 동기화

새 PC나 다른 장비에서 Claude Code를 쓸 때마다 플러그인, MCP 서버, hooks, settings를 하나씩 다시 설정해야 하고, 팀원에게 구두로 전달하거나 문서를 따로 만들어야 하며, 설정이 각 PC에 흩어져 있어서 어디가 최신인지 알 수 없고, settings.json을 직접 복사하면 경로(홈 디렉토리, 사용자명)가 달라서 그대로 안 된다.

env 플러그인은 `mccm.json` 파일 하나에 환경 전체를 선언적으로 정의하고, GitHub Gist에 저장해서 어디서든 동기화할 수 있게 한다. 경로의 머신 의존값은 `${HOME}`, `${USER}` 변수로 자동 치환되어 OS/사용자가 달라도 동작한다.

| 스킬 | 설명 |
|------|------|
| [download](plugins/env/skills/download/) | Gist → 로컬 적용 — 충돌 시 사용자 확인, 로컬 전용 항목 삭제 선택 |
| [upload](plugins/env/skills/upload/) | 로컬 → Gist 업로드 — Gist 전용 항목 삭제 선택, 사용자 확인 후 반영 |

**사전 요구사항:** [GitHub CLI (`gh`)](https://cli.github.com/) 설치 및 인증 (`gh auth login`)

> **⚠️ 보안 주의:** MCP 서버의 API 토큰 등 민감 정보가 mccm.json에 포함됩니다. Gist는 기본 **secret**으로 생성되지만, 기존에 `--public`으로 만든 Gist가 있다면 secret Gist로 재생성하세요. secret Gist도 URL을 아는 사람은 접근할 수 있으므로 URL 공유에 주의하세요.

**mccm.json 관리 범위:**

| 항목 | mccm.json 키 | settings.json 매핑 |
|------|------------|-------------------|
| 마켓플레이스 | `marketplaces` | `extraKnownMarketplaces` |
| 플러그인 | `plugins` | `enabledPlugins` |
| CLI 도구 | `clis` | — (check/install 명령으로 관리) |
| MCP 서버 | `mcpServers` | `mcpServers` |
| hooks | `hooks` | `hooks` |
| 설정 | `settings` | 최상위 키 (language, env 등) |

### dev — 개발 스킬팩

| 스킬 | 설명 |
|------|------|
| [commit](plugins/dev/skills/commit/) | Git 커밋 스킬 — 보안 검토, 브랜치 생성, 스테이징, 커밋 메시지 작성 |
| [pr](plugins/dev/skills/pr/) | PR 생성 스킬 — push, 제목/본문 생성, assignee, label 자동 설정, Actions 체크 추적 |
| [cleanup](plugins/dev/skills/cleanup/) | 리모트 동기화 스킬 — 기본 브랜치 이동, pull, prune, 로컬 브랜치 정리 |
| [md-to-pdf](plugins/dev/skills/md-to-pdf/) | Markdown → PDF 변환 — GitHub 웹 스타일 렌더링 |
| [md-to-gdoc](plugins/dev/skills/md-to-gdoc/) | Markdown → Google Docs 변환 — GitHub 스타일 서식, gws CLI 사용 |

## 설치 방법

```bash
claude plugin marketplace add Kang-Jacob-GitLB/mccm
claude plugin install env@mccm
```

설치 후 `/download` 실행하면 Gist의 mccm.json 기반으로 전체 환경(플러그인, MCP, hooks, settings)이 구성된다.

환경을 변경한 후 `/upload`로 Gist에 반영하면 다른 PC에서 `/download`로 동기화할 수 있다.

## 프로젝트별 커스터마이즈

각 스킬은 프로젝트의 `CLAUDE.md`에서 해당 섹션을 찾아 **명시된 슬롯만** 오버라이드한다. 명시되지 않은 슬롯은 기본값을 사용한다. 각 슬롯의 기본값은 해당 SKILL.md를 참조한다.

| 스킬 | CLAUDE.md 섹션 | 슬롯 |
|------|---------------|------|
| commit | `## mccm:Commit Conventions` | language, title-format, types, title-max-length, body, branch-prefixes, branch-format |
| pr | `## mccm:PR Conventions` | base-branch, language, title-format, types, title-max-length, body-format, label-map, auto-assignee, checks-timeout |
| cleanup | `## mccm:Cleanup Conventions` | default-branch, protected-branches |

예시 (`CLAUDE.md`):

```markdown
## mccm:Commit Conventions
- language: 한글
- title-format: {제목}
- types: add, fix, update, remove
- title-max-length: 40
- body: 필수

## mccm:PR Conventions
- language: 한글
- title-format: [{타입}] {제목}
- label-map: feat→enhancement, fix→bug

## mccm:Cleanup Conventions
- protected-branches: main, master, develop
```

## 플러그인 구조

```
mccm/
├── .claude-plugin/
│   └── marketplace.json
└── plugins/
    ├── env/
    │   ├── .claude-plugin/
    │   │   └── plugin.json
    │   └── skills/              ← mccm.json은 gist로 관리
    │       ├── download/
    │       │   └── SKILL.md
    │       └── upload/
    │           └── SKILL.md
    └── dev/
        ├── .claude-plugin/
        │   └── plugin.json
        └── skills/
            ├── commit/
            │   └── SKILL.md
            ├── pr/
            │   └── SKILL.md
            ├── cleanup/
            │   └── SKILL.md
            ├── md-to-pdf/
            │   └── SKILL.md
            └── md-to-gdoc/
                └── SKILL.md
```

## 새 스킬 추가 방법

1. `plugins/{플러그인}/skills/{skill-name}/SKILL.md` 작성
2. PR 생성 → 리뷰 → 머지
3. 사용자는 세션 시작 시 자동 업데이트 (또는 `claude plugin marketplace update mccm`)
