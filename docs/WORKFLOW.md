# Workflow

`pethub-mobile`에서 코드 변경을 시작하기 전·중·후에 거쳐야 하는 체크리스트입니다.

## 1. 코딩 전 (Pre-coding)

- [ ] 현재 브랜치가 원격(upstream/origin) 대비 최신 상태인지 확인 (`git fetch` 후 `git status` / `git rev-list --left-right --count @{u}...HEAD`). 뒤처져 있으면 코드 변경을 시작하기 전에 사용자에게 명시적으로 알리고 pull/rebase 여부를 확인 받는다.
- [ ] `docs/SHARED-MODULES.md` 검색 — 동일·유사 utility/hook이 이미 있는지
- [ ] `constants/theme.ts` 검색 — 사용하려는 색·spacing·radii가 토큰으로 존재하는지
- [ ] `rg "<function-name>"` 으로 기존 구현 확인
- [ ] 신규 analytics 이벤트는 `features/analytics/events.ts`의 `AnalyticsEvent` discriminated union에 **먼저** 등록 후 사용
- [ ] 신규 색·muted 토큰은 `constants/theme.ts`에 **먼저** 추가 후 사용 (인라인 rgba 금지)
- [ ] 신규 utility는 `features/shared/` 또는 `features/<domain>/`에 작성 + `docs/SHARED-MODULES.md`에 등록 예정

## 2. 코딩 중 (In-coding)

- [ ] 스크린 줄 수 예산 준수 (일반 ≤200, session-active ≤100, session-setup ≤80)
- [ ] features는 JSX 금지 (Provider 제외)
- [ ] 도메인 경계 위반 금지 (예: `features/training/` → `@/features/word-library` import 금지)
- [ ] empty catch 금지 — `reportError(err, { scope })` 또는 `console.warn('[scope]', err)` 사용
- [ ] silent fallback 금지 — 사용자 영향이 있으면 surface
- [ ] Firebase는 modular API v24만 (`getAnalytics(app)` 형태, namespaced 금지)

## 3. 커밋 전 (Pre-commit)

### 3.1 자동 검증

```bash
yarn lint
yarn typecheck
```

둘 다 그린이어야 함. `--no-verify` 절대 금지.

### 3.2 검증 grep (모두 0건)

```bash
rg "rgba\(" components/ features/ app/
rg "catch\s*\(\s*\w*\s*\)\s*\{\s*\}" features/ app/ components/
rg "analytics\(\)\.|crashlytics\(\)\." features/ app/
```

### 3.3 신규 추가물 등록 확인

- 신규 shared utility → `docs/SHARED-MODULES.md`에 행 추가됨
- 신규 정책 (의무화·금지·기본값 변경 등) → `/pethub-policy-update` 호출 또는 발화 트리거로 `docs/POLICY-HISTORY.md` 갱신됨
- 신규 docs 카테고리 → `CLAUDE.md` Project Rules 포인터에 추가됨

### 3.4 수동 user flow

- 변경 영향 범위에 따라 README의 수동 검증 체크리스트 실행
- Firebase DebugView / Clarity Live / Crashlytics 검증 (analytics 변경 시)

### 3.5 커밋 메시지

- Conventional commits 소문자, scope 포함 (`feat(audio): …`)
- 책임 단위로 분리 — 한 커밋 = 한 책임
- 본문 영어, attribution 라인 금지

## 4. 테스트 정책 (MVP)

- **MVP 단계에서는 자동 테스트를 작성하지 않습니다.** (`yarn` 스크립트에 Jest 미설치)
- 검증은 다음에 의존:
  1. TypeScript (`yarn typecheck`)
  2. Lint (`yarn lint`)
  3. 수동 user flow (README 체크리스트)
  4. Firebase DebugView / Clarity Live (analytics 변경 시)

테스트 도입은 별도 정책 변경으로 결정합니다.
