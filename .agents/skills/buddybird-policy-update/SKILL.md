---
name: buddybird-policy-update
description: buddybird-mobile 프로젝트의 정책이 결정/변경되었을 때 docs/POLICY-HISTORY.md를 갱신하고 관련 docs (CONVENTIONS / SHARED-MODULES / WORKFLOW / analytics / ARCHITECTURE) 또는 신규 docs 파일을 생성·수정. 사용자가 "정책 변경", "이제부터", "의무화", "from now on", "deprecated" 등 정책 변경 의도를 표현하거나 `/buddybird-policy-update` 명시 호출 시 트리거.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# buddybird-policy-update

`buddybird-mobile`의 정책을 코드와 docs 양쪽에서 일관되게 유지하는 자동화 skill입니다. 정책 변경이 감지되면 (1) 해당 카테고리의 docs를 업데이트하고, (2) `docs/POLICY-HISTORY.md`에 행을 추가하고, (3) AGENTS.md 포인터를 점검하고, (4) 검증 grep을 실행합니다.

## 트리거

### 발화 기반 (자동)

다음 키워드/패턴이 사용자 메시지에 포함되면 자동 트리거:

- "정책 변경", "컨벤션 변경", "컨벤션 추가"
- "이제부터", "앞으로", "from now on"
- "의무화", "필수", "강제", "must"
- "금지", "deprecated", "no longer allowed"
- "기본값 변경", "default 변경"

### 명시 호출

```
/buddybird-policy-update <한 줄 정책 설명>
```

## 동작 7단계

### 1. 변경 분류

정책을 다음 카테고리로 매핑:

| 카테고리 | 대상 docs |
|---|---|
| Analytics (이벤트·screen tracking·PII·ATT·fanout·Crashlytics) | `docs/analytics.md` §정책 |
| 파일/폴더/스타일/커밋/에러 처리 | `docs/CONVENTIONS.md` |
| 재사용 utility/hook/token | `docs/SHARED-MODULES.md` |
| 사전·사후 검증 워크플로우 | `docs/WORKFLOW.md` |
| Firebase·plugin·gitignore·EAS 등 네이티브 | `docs/ARCHITECTURE.md` §네이티브 설정 |
| 신규 카테고리 (테스트·성능 budget·접근성 등) | 새 `docs/<TOPIC>.md` 생성 + `AGENTS.md` Project Rules 포인터 추가 |

**오분류 방지 예시**

| 정책 | 잘못된 분류 | 올바른 분류 |
|---|---|---|
| "이제부터 screen tracking은 의무" | CONVENTIONS | analytics.md §정책 |
| "audio hook은 elapsedSeconds를 반환해야 함" | analytics | SHARED-MODULES (audio 섹션) |
| "yarn typecheck 통과해야 커밋 가능" | analytics | CONVENTIONS §4 커밋 |
| "Firebase config는 commit 금지" | CONVENTIONS | ARCHITECTURE §네이티브 설정 |

분류가 모호하면 사용자에게 확인 질문을 던지세요.

### 2. docs 업데이트

대상 파일의 적절한 H2/H3 섹션에 단정문 한 줄 또는 표 행을 추가합니다. `Edit` tool로 surgical edit, 기존 문장은 건드리지 않음.

신규 docs 카테고리면 `Write`로 새 파일 생성 (제목·간략 설명 + 단정문 표).

### 3. `docs/POLICY-HISTORY.md` append

§1 표 끝에 행 추가:

```
| <YYYY-MM-DD> | <출처: plan/commit hash/conversation> | <정책 한 줄 요약> | <영향 받은 docs/모듈> |
```

날짜는 `date +%Y-%m-%d`로 절대 날짜 사용.

### 4. `AGENTS.md` 점검

- 신규 docs 파일을 생성한 경우 → `## Project Rules` 포인터 블록에 한 줄 추가
- 정책이 Hard Rule 수준의 단정문이면 → `## Hard Rules`에도 추가
- 줄 수가 200을 넘으면 경고 후 사용자에게 정리 제안

### 5. 검증 grep

정책이 코드와 self-consistent한지 확인. 카테고리별 표준 grep:

```bash
# 인라인 rgba 금지 정책
rg "rgba\(" components/ features/ app/

# empty catch 금지 정책
rg "catch\s*\(\s*\w*\s*\)\s*\{\s*\}" features/ app/ components/

# namespaced Firebase 금지 정책
rg "analytics\(\)\.|crashlytics\(\)\." features/ app/

# 스크린 줄 수 예산
wc -l app/session-active.tsx app/\(tabs\)/session-setup.tsx

# 신규 shared 모듈 export 확인 (정책이 새 export 명시 시)
rg "<export>" features/shared/ features/<domain>/
```

위반 사례가 있으면 보고서에 포함하고 별도 cleanup task를 제안.

### 6. 사용자 확인 (분류 모호 시)

다음 경우 사용자에게 확인:
- 정책이 둘 이상 카테고리에 걸친다
- 신규 docs 카테고리 생성이 필요한지 불확실
- 기존 정책과 직접 충돌 (deprecated 처리 필요)

### 7. 요약 보고

마지막 출력:
- 변경된 파일 목록 (created / modified)
- POLICY-HISTORY에 추가된 행
- 검증 grep 결과 (위반 0건 vs 위반 N건)
- 다음 단계 제안 (필요 시 cleanup task, manual 검증, 커밋 분리 등)

## 작성 가이드

- docs 본문은 한국어, 코드 블록·식별자는 영어
- 정책은 단정문 ("X must Y", "no Z")으로
- 추가는 surgical edit, 기존 행 수정 금지
- `AGENTS.md`는 ≤200줄 유지

## 위치

본 skill은 `buddybird-mobile/.Codex/skills/buddybird-policy-update/`에 위치합니다 (프로젝트 로컬). 레포를 clone한 모든 협업자가 동일한 skill로 정책을 갱신합니다.

## 템플릿

- `templates/policy-history-row.md` — POLICY-HISTORY 행 템플릿
- `templates/analytics-policy-entry.md` — analytics §정책 항목 템플릿
- `templates/convention-entry.md` — CONVENTIONS 항목 템플릿
- `templates/shared-module-entry.md` — SHARED-MODULES 행 템플릿
