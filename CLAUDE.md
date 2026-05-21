# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

버디버드 Mobile ("버디버드") is an Expo Router-based React Native app for coaching parrots to learn speech. The app is Korean-primary. Phase 1 covers onboarding only; audio recording, pitch transform, active training sessions, and multi-profile support are not yet implemented.


## Reference

`docs/PRD.md`: 전체 요구사항 및 기술 스펙
`docs/ARCHITECTURE.md`: 네비게이션 구조, 피처 모듈, 컴포넌트, 디자인 시스템, 네이티브 설정

## Project Rules — 코딩 전에 읽기

| 문서 | 내용 |
|---|---|
| `docs/CONVENTIONS.md` | 파일·폴더 레이아웃, 스타일 토큰, 에러 처리, 커밋 컨벤션 |
| `docs/SHARED-MODULES.md` | 재사용 가능한 utility/hook/token 레지스트리 — 새 utility 작성 전 grep 의무 |
| `docs/WORKFLOW.md` | 코딩 전·중·후 체크리스트 + 검증 grep 게이트 |
| `docs/POLICY-HISTORY.md` | 정책 도입 이력 (출처 plan/commit + 영향 범위) |
| `docs/analytics.md` §정책 | 이벤트 grammar, ATT, PII, 에러 보고, Firebase modular API |
| `docs/ARCHITECTURE.md` §네이티브 설정 | Firebase RNFirebase v24 핀, Podfile plugin, gitignore |
| `docs/BUILD-AND-RELEASE.md` | 환경별 빌드(dev/staging/prod)·EAS Secret·Firebase config·CI/CD 파이프라인(staging→자동 internal 배포, main→자동 빌드+수동 promote)·semver/buildNumber 정책 (배포 SSoT) |

## 정책 변경 시 (자동화)

새 정책이 합의·변경되면 `.claude/skills/buddybird-policy-update` skill이 자동 수행:

- 발화 트리거: "정책 변경", "이제부터", "의무화", "from now on", "deprecated" 등
- 명시 호출: `/buddybird-policy-update <한 줄 정책 설명>`

skill이 (1) 해당 카테고리 docs 갱신, (2) `docs/POLICY-HISTORY.md`에 행 추가, (3) `CLAUDE.md` 포인터 점검, (4) 검증 grep 실행을 자동으로 처리합니다.

위치: `buddybird-mobile/.claude/skills/buddybird-policy-update/`

## Hard Rules (절대 위반 금지)

- 작업 시작 전 현재 브랜치가 upstream 대비 최신인지 확인 — 뒤처져 있으면 코드 변경 전에 사용자에게 명시적으로 알리고 pull/rebase 여부 확인
- 신규 utility / 색 / 이벤트는 `docs/SHARED-MODULES.md` · `constants/theme.ts` · `features/analytics/events.ts`를 **먼저 검색**한 뒤에만 추가
- 신규 analytics 이벤트는 `features/analytics/events.ts`의 `AnalyticsEvent` union에 **먼저** 등록
- 스크린은 composition-only, 일반 ≤200줄 / `app/session-active.tsx` ≤100 / `app/(tabs)/session-setup.tsx` ≤80
- features는 JSX 금지 (Provider만 예외)
- Empty catch (`try {} catch {}`) 금지 — `reportError(err, { scope })` (fatal) 또는 `console.warn('[scope]', err)` (non-fatal)
- Firebase는 modular API v24만 사용 — namespaced `analytics().…` / `crashlytics().…` 금지
- 인라인 `rgba()` 금지 — 신규 muted 토큰은 `constants/theme.ts`에 먼저 추가
- Conventional commits 소문자 + scope, `yarn lint && yarn typecheck` 그린 후에만 커밋 — `feat:` (minor) / `fix:` (patch) / `feat!:` 또는 footer `BREAKING CHANGE:` (major) 의 정확한 type 필수 (semver bump 영향, `docs/BUILD-AND-RELEASE.md` §12.2)
- `--no-verify` 금지, try/catch로 lint 우회 금지, attribution 라인 금지
- 보호자 PII (이름·이메일·전화·정확한 위치) 수집 금지
- Firebase config 파일 (`GoogleService-Info.plist`, `google-services.json`) commit 금지
- `package.json` / `.release-please-manifest.json` / `app.config.ts` 의 `version` 필드 직접 편집 금지 — release-please 가 PR 로 관리
- `staging` / `main` 브랜치 직접 push 금지 — PR-only 보호 브랜치 (보호 정책 `docs/BUILD-AND-RELEASE.md` §12.9, 우회는 §12.6 핫픽스 절차로만)
- `ios.buildNumber` / `android.versionCode` 를 `app.config.ts` 에 명시 금지 — EAS remote autoIncrement 가 관리

## 브랜치 전략

- `feature/*` → `dev`: 통합용, CI 만 (lint/typecheck)
- `dev` → `staging`: PR merge 시 개발계 자동 출시 (Play internal track)
- `staging` → `main`: PR merge → release-please PR 자동 생성 → merge 시 운영 빌드 자동, 출시는 수동 promote
- `hotfix/*` → `main`: 긴급 패치, staging 우회 가능. merge 후 `main → staging` back-merge 의무

## Commands

```bash
# Metro (Expo Go 호환, 환경 미지정 = development 기본)
yarn start                       # Expo dev server
yarn start:dev                   # APP_VARIANT=development
yarn start:prod                  # APP_VARIANT=production

# 로컬 네이티브 빌드 + 실행 (환경 전환 시 prebuild 필수)
yarn prebuild:dev                # expo prebuild --clean (dev 식별자로 네이티브 디렉토리 재생성)
yarn prebuild:prod               # expo prebuild --clean (prod 식별자로 네이티브 디렉토리 재생성)
yarn ios:dev   / yarn ios:prod   # iOS 시뮬레이터
yarn android:dev / yarn android:prod # Android 에뮬레이터
yarn web                         # Web browser (환경 분기 없음)

# EAS Cloud 빌드 (eas.json 프로필 사용)
yarn eas:build:dev:all           # development 프로필 (dev-client, 매일 개발용)
yarn eas:build:preview:all       # preview 프로필 (직원 internal alpha/beta testing)
yarn eas:build:prod:all          # production 프로필 (스토어 출시용)
# 플랫폼 단독: eas:build:{dev,preview,prod}:{ios,android}

# EAS Local 빌드 (--local, 머신에서 직접 빌드)
yarn eas:build:local:dev:ios     # 그 외: local:{dev,preview,prod}:{ios,android}

# 검증
yarn lint                        # ESLint via expo lint
yarn typecheck                   # tsc --noEmit (no Jest; no test runner configured)
```

환경별 식별자 매핑, EAS Secret 등록, Firebase config 배치, Keystore·credentials.json 운영, App Store/Play Store 제출 절차 등 빌드/배포의 모든 상세는 `docs/BUILD-AND-RELEASE.md` (배포 SSoT) 에서 단일하게 관리한다. 본 Commands 블록은 발견용 인용일 뿐이며 절차 본문을 두지 않는다.

There is no test suite. Verification is done manually per the checklist in README.md.


## Behavioral Guidelines

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
