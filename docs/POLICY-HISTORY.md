# Policy History

이 문서는 `buddybird-mobile`에 도입·확정된 정책의 시간순 이력입니다. 각 행은 그 정책이 처음 코드/문서로 들어온 시점을 기록합니다. 정책이 신규 도입·변경되면 `.claude/skills/buddybird-policy-update`가 본 문서 맨 아래에 행을 추가합니다.

## 1. 정책 도입 이력 (시간순)

| 날짜 | 출처 (plan / commit) | 도입 정책 | 영향 받은 docs / 모듈 |
|---|---|---|---|
| 2026-05-15 | plan `feat-add-analytics-tools-dev-sorted-minsky.md` · commits `c60e02d`, `025637a` | Firebase Analytics + Crashlytics + Microsoft Clarity 도입, `expo-tracking-transparency`로 ATT 게이트, `withFirebaseStaticPodfile` plugin, `firebase.json` 설정 | `package.json`, `app.json`, `plugins/`, `firebase.json`, `.gitignore` |
| 2026-05-15 | plan `ancient-jingling-sunset.md` · commits `daaed10`, `4741315`, `77162dd`, `97e13f8` | snake_case discriminated-union 이벤트 (`events.ts`), fanout AnalyticsClient + provider isolation, ATT 동의 게이트, identity/word-metrics storage, root layout 통합, 온보딩/세션 lifecycle 추적 | `features/analytics/`, `app/_layout.tsx`, `app/(onboarding)/*` |
| 2026-05-15 | plan `firebase-sequential-raccoon.md` · commits `f6fca3a`, `cdb3ac1` | Firebase modular API v22+ 의무화 — namespaced `analytics().logEvent()` 금지, `logScreenView` 대신 `logEvent('screen_view')` 사용 | `features/analytics/providers/`, `features/analytics/client.ts` |
| 2026-05-15 | plan `react-native-firebase-microsoft-react-na-shimmering-tarjan.md` · commit `c60e02d` | `@react-native-firebase/* ^24.0.0` 핀, Microsoft Clarity v4.6 정렬, iOS static linking 강제 | `package.json`, `plugins/withFirebaseStaticPodfile.js` |
| 2026-05-15 | plan `refactor-separate-file-responsibilities-elegant-quokka.md` · 다수 refactor commit | features 도메인별 파일 책임 분리 (`*-types.ts`, `*-storage.ts`, `*-context.tsx`, `*-validation.ts`, `*-model.ts`), 컴포넌트는 `components/<domain>/`로 이동, 스크린은 composition-only | `features/`, `components/`, `app/` |
| 2026-05-15 | plan `app-tabs-session-setup-tsx-abundant-tome.md` | 스크린 줄 수 예산 도입: 일반 스크린 ≤200, session-active ≤100, session-setup ≤80 | `app/(tabs)/session-setup.tsx`, `app/session-active.tsx` |
| 2026-05-15 | plan `bright-stirring-puffin.md` | session-active 라우트 분리, 세션 상태는 `features/training/`에 위임 | `app/session-active.tsx`, `features/training/` |
| 2026-05-15 | plan `feat-move-audio-record-session-refactor-humming-rivest.md` · commits `0a6b904`, `07e9d37`, `bfa3f8b` | 오디오 녹음·재생을 `features/audio/hooks/`로 통합, `elapsedSeconds`를 두 훅 모두에서 반환 의무화 | `features/audio/hooks/use-audio-recording.ts`, `use-audio-preview.ts` |
| 2026-05-15 | plan `zazzy-booping-sprout.md` · 5-track 병렬 리팩터 | (1) silent catch 제거 (2) 인라인 rgba → 토큰 (3) 공용 utils 추출 (`shared/ids`, `shared/date-utils`) (4) screen tracking hooks 폴더 이동 (5) provider failure 리포터 추출 | 다수 모듈, `constants/theme.ts`, `features/shared/`, `features/analytics/` |
| 2026-05-15 | commit `b1894f9` 이하 audio·training·word-library·words·i18n·profile refactor 시리즈 | empty catch 절대 금지 — non-fatal은 `console.warn('[scope]', err)`, fatal은 `reportError(err, { scope })` | `features/audio/`, `features/training/`, `features/word-library/`, `features/i18n/`, `features/profile/`, `components/words/` |
| 2026-05-15 | commits `9d39dae`, `4e2dff4`, `efe95e6`, `bef8ab3`, `ea78155` | 모든 인라인 `rgba()` 금지 → `BuddyBirdColors`의 `kickerMuted` / `kickerMutedOnDark` / `bodyMuted` / `placeholderMuted` 토큰 사용, dark-surface는 `*OnDark` 변형 추가 | `constants/theme.ts`, `components/`, `app/` |
| 2026-05-15 | commits `8cc1875`, `d6dec81` | 공용 utility는 `features/shared/`에 단일 source of truth: `createSessionId`, `diffDaysIso` | `features/shared/ids.ts`, `features/shared/date-utils.ts` |
| 2026-05-15 | commits `21db373`, `5567795` | `useScreenTracking`은 `features/analytics/hooks/`에 두고, 반환값으로 `elapsedMs()` 제공 — 인라인 `Date.now()` ref 금지 | `features/analytics/hooks/use-screen-tracking.ts` |
| 2026-05-15 | commit `4c86152` | `Species` 모델 plain string 단순화 — `SpeciesId` enum / `customSpecies` 필드 제거, `isPresetSpeciesId`로 preset 판별 | `features/profile/` |
| 2026-05-15 | commit `f39f3ff` 및 reportError 시리즈 | `reportError(err, { scope: 'feature.method', screen_name? })`를 cross-domain crash 리포팅 단일 진입점으로 사용, AnalyticsClient는 module-level reporter로 등록 | `features/analytics/error-reporter.ts` |
| 2026-05-15 | commits `025627a`, `8c53cb7` | `google-services.json`, `GoogleService-Info.plist`, `/android/`, `/ios/`, `.firebaserc`, `.firebase/` 모두 gitignore — Firebase config는 절대 commit 금지 | `.gitignore` |
| 2026-05-15 | plan `bright-kindling-breeze.md` | post-merge 컨벤션 정리: dark-surface kicker 토큰 (`kickerMutedOnDark`) 의무화, 검증 grep 체크리스트 명문화 | `constants/theme.ts`, 검증 grep |
| 2026-05-16 | commit `2ee3a25` | analytics 누락 이벤트 채우기 + dev merge 이후 코드 정합성 정렬, screen tracking 빠진 스크린 보강 | `app/`, `features/analytics/` |
| 2026-05-16 | 본 정책 문서화 작업 (plan `lucky-wiggling-candle.md`) | `docs/CONVENTIONS.md` / `docs/SHARED-MODULES.md` / `docs/WORKFLOW.md` / `docs/POLICY-HISTORY.md` 신설, `CLAUDE.md`에 Project Rules + Hard Rules + 정책 변경 자동화 안내 추가, `.claude/skills/buddybird-policy-update` 추가 | `CLAUDE.md`, `docs/`, `.claude/skills/` |
| 2026-05-16 | conversation `/buddybird-policy-update` 호출 (base `cd54b26`) | 작업 시작 전 현재 브랜치의 upstream 대비 최신 여부를 반드시 확인하고, 뒤처져 있으면 사용자에게 명시적으로 알리도록 의무화 | `docs/WORKFLOW.md`, `CLAUDE.md` |
| 2026-05-17 | plan `~/.claude/plans/hidden-scribbling-sunbeam.md` | session-preset-card 인라인 `WheelPicker`를 `components/ui/wheel-picker.tsx`로, 한국어 시간 포맷터(`fmtMins`/`formatDuration`)를 `features/shared/duration-format.ts`(`formatDurationMins`/`formatDurationSecs`)로 분리. `WheelPicker`는 추출 시점에 단일 caller로, §1-5(2회 이상 중복 시 추출) 예외 — 사유: UI primitive 재사용 잠재력 | `components/ui/wheel-picker.tsx`, `features/shared/duration-format.ts`, `components/session/setup/session-preset-card.tsx`, `components/session/setup/cycle-summary.tsx`, `docs/SHARED-MODULES.md` |
| 2026-05-17 | plan `~/.claude/plans/atomic-plotting-sedgewick.md` | 오디오 URI 영구화 정책 도입: AsyncStorage에는 `recording://<fileName>` / `preset://<label>` 만 저장 (절대 `file://` URI 금지). storage 계층에서 `normalizeAudioUriForStorage` / `hydrateAudioUriFromStorage` 의무 적용, 재생 직전 `recordingFileExists`로 stale/missing 가드. 사유: iOS 컨테이너 UUID는 빌드/재설치 시 변경되어 절대 URI는 stale (Apple TN2406, expo#32788). 기존 v1 데이터(절대 URI)는 load 시 그대로 pass-through 후 다음 save에서 자동 정규화 | `features/audio/audio-file-storage.ts`, `features/word-library/word-library-storage.ts`, `features/training/training-storage.ts`, `features/audio/hooks/use-audio-preview.ts`, `features/training/hooks/use-active-session.ts`, `docs/CONVENTIONS.md` §6, `docs/SHARED-MODULES.md` §6.1 |
| 2026-05-19 | plan `~/.claude/plans/react-native-eas-sharded-lobster.md` | 환경별 EAS 빌드 분리 (dev/prod) 정책 도입: `app.config.ts` 가 `APP_VARIANT` 로 `name`/`bundleIdentifier`/`package`/`scheme`/`googleServicesFile`/`extra.appVariant` 분기, dev/prod 별도 Firebase 프로젝트 (`buddybird-dev` vs `buddybird-9b84d`) + Bundle ID suffix (`.dev`), 환경별 비밀 설정은 `config/{env}/{service}/` 트리, EAS Cloud 의 file env vars 로 Firebase config 자동 주입. 빌드/배포 절차의 SSoT 로 `docs/BUILD-AND-RELEASE.md` 신설 — `ARCHITECTURE.md`/`README.md`/`CLAUDE.md` 는 포인터만 유지하며 빌드 명령어 직접 기재 금지 | `app.config.ts`, `eas.json`, `package.json`, `.gitignore`, `docs/BUILD-AND-RELEASE.md` (신규), `docs/ARCHITECTURE.md`, `CLAUDE.md` |
| 2026-05-19 | conversation `/buddybird-policy-update` 호출 | 환경 운영을 dev/prod 2-tier 로 단순화 — `development` 환경이 일반적인 staging 역할 (internal QA·기능 검수·릴리스 후보 검증) 까지 함께 맡는다. `preview` profile 은 'prod 식별자·Firebase 사용 + dev-client 없음' 같은 특수 검증이 필요한 경우에만 남겨두며 평시 internal 검증에는 사용하지 않는다. 코드/식별자/eas.json 변경 없음 — 문서 위치 재정의만 | `docs/BUILD-AND-RELEASE.md` §1, §8.3 |
| 2026-05-19 | conversation `/buddybird-policy-update` 호출 (직전 행 정정) | `preview` profile 을 EAS 표준 패턴에 맞춰 **내부 직원 internal alpha/beta testing 빌드** 로 재정의 — `eas.json` 의 `preview.env.APP_VARIANT` 를 `production` → `development` 변경, `developmentClient: false`·`distribution: internal` 유지, dev Firebase·dev Bundle ID(`.dev`)·dev keystore 사용. 직원이 internal 배포 링크로 설치해 일반 사용자처럼 동작 확인. 직전 행의 'preview = prod sanity check 용 특수 케이스' 정의는 본 행으로 대체. prod 환경 standalone 검증이 필요해지면 별도 profile (`production-internal` 등) 추가 검토 | `eas.json`, `docs/BUILD-AND-RELEASE.md` §1, §2, §5.1, §8.3, §11.4, §12 |
| 2026-05-19 | plan `~/.claude/plans/yarn-eas-build-local-preview-android-cryptic-glade.md` | `.easignore` 도입 — `.gitignore` 의 `/config/` 제외를 EAS tarball 한정으로 무력화하여 `config/{dev,prod}/firebase/` 만 포함시킨다. `**/*.jks`, `**/credentials.json`, `/config/{env}/android/` 는 명시적으로 재제외하여 keystore/credentials.json 이 tarball 에 새지 않도록 함. 원인: `yarn eas:build:local:{dev,preview,prod}:{ios,android}` 가 PREBUILD 단계에서 `app.config.ts` 의 fallback 경로 `./config/{env}/firebase/google-services.json` 를 열려다 ENOENT 로 실패. Cloud 빌드는 EAS env file-secret(`GOOGLE_SERVICES_JSON`/`GOOGLE_SERVICES_INFO_PLIST`) 가 우선되어 영향 없음. Firebase config commit 금지 정책은 그대로 유지 (`.gitignore` 변경 없음) | `.easignore` (신규), `docs/BUILD-AND-RELEASE.md` §4, §7.2, §10, §12 |
| 2026-05-19 | plan `~/.claude/plans/yarn-eas-build-local-preview-android-quiet-sky.md` | `plugins/withGradleJvmArgs.js` 도입 — Expo prebuild 가 생성하는 `android/gradle.properties` 의 `org.gradle.jvmargs` 를 `withGradleProperties` mod 로 `-Xmx6144m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8` 로 upsert. 원인: 기본값 `-Xmx2048m -XX:MaxMetaspaceSize=512m` 가 RN 0.81 + Reanimated 4.1 + Worklets + New Architecture + 4 ABI CMake 동시 configure 워크로드를 못 견디고 `:react-native-reanimated:configureCMakeRelWithDebInfo[armeabi-v7a]` 에서 Java heap space OOM 으로 실패. `android/` 는 prebuild 가 매번 재생성하므로 직접 편집 금지 — Android Gradle JVM 메모리 영속화는 항상 config plugin 으로 관리한다 | `plugins/withGradleJvmArgs.js` (신규), `app.config.ts`, `docs/BUILD-AND-RELEASE.md`, `docs/ARCHITECTURE.md` |
| 2026-05-21 | plan `~/.claude/plans/expo-eas-staging-steady-trinket.md` | EAS × GitHub Actions CI/CD 자동화 도입 (Android-first, iOS 는 Apple Developer 가입 후 Phase 6). 4-profile 구조 (`development`/`preview`/`staging`/`production`), staging 브랜치 push → `eas-staging.yml` 자동 빌드 + Play internal track 자동 제출, main push → `release-please.yml` 이 semver bump PR 자동 생성, release PR merge 시 tag → `eas-production.yml` 자동 빌드 (submit 은 수동 promote). `appVersionSource: remote` + `autoIncrement: true` (EAS 가 빌드된 `--platform` 의 카운터만 +1 — 현 Android-only 상황에서 iOS `buildNumber` 카운터는 dormant, Apple 가입 시점에 `eas build:version:set --platform ios` 로 초기화) 로 versionCode 자동 관리. `app.config.ts` 의 `version` 은 `pkg.version` 으로 단일 source 화 (release-please 가 `package.json.version` 을 bump). Hard Rules 추가: `version` 직접 편집 금지, `staging`/`main` 직접 push 금지, `ios.buildNumber`/`android.versionCode` 명시 금지, commit type 정책 (`feat:` minor / `fix:` patch / `feat!:` major) 필수 | `eas.json`, `package.json`, `app.config.ts`, `release-please-config.json` (신규), `.release-please-manifest.json` (신규), `.github/workflows/{ci,eas-staging,release-please,eas-production}.yml` (신규), `.github/CODEOWNERS` (신규), `docs/BUILD-AND-RELEASE.md` §1·§2·§12·§13, `docs/CONVENTIONS.md` §4, `CLAUDE.md` Hard Rules + 브랜치 전략 |
| 2026-05-21 | plan `~/.claude/plans/github-actions-parallel-minsky.md` | CI 게이트 표준화 — (1) 모든 workflow job 이름을 kebab-case + verb-first display name 으로 통일 (`build_and_submit`→`build-and-submit`, `release_please`→`release-please`, `build`→`build-production`). (2) `_verify.yml` / `_notify-slack.yml` reusable workflow (workflow_call) 추출, 신규 검증/알림 step 은 한 곳에서만 변경. (3) PR title commitlint (`amannn/action-semantic-pull-request@v5`) + path-based auto labeler (`actions/labeler@v5`) + PR 템플릿 도입 — PR title 이 conventional commits 비준수 시 머지 차단. (4) Dependabot (github-actions + npm weekly, Expo/react/react-native major bump ignore, grouped patches). (5) CodeQL JS/TS 보안 스캔 (public repo). (6) Slack Incoming Webhook 으로 staging/production 빌드 시작·결과 알림 (단일 채널, `SLACK_WEBHOOK_URL` secret, `continue-on-error` 로 알림 실패가 빌드 fail 처리 안 되도록). (7) 14일 초과 artifact 주간 자동 cleanup. branch protection 의 status check 이름은 신규 display name 으로 동기화 의무 (`Verify (lint + typecheck)` / `PR Title (Semantic)` / `Auto Label` / `CodeQL Analyze`) | `.github/workflows/{_verify,_notify-slack,pr-checks,codeql,cleanup-artifacts}.yml` (신규), `.github/workflows/{ci,eas-staging,eas-production,release-please}.yml`, `.github/{dependabot,labeler,CODEOWNERS,PULL_REQUEST_TEMPLATE.md}`, `docs/BUILD-AND-RELEASE.md` §12.1·§12.4·§12.9·§12.10 |
| 2026-05-21 | PR #33 머지 후 ruleset 갱신 (post-merge ops) | Branch protection 의 required status check **실측 이름** 확정 — reusable workflow 호출은 `<calling-job.name> / <reusable-job.name>` 형식 (예: `Verify (lint + typecheck) / Verify (lint + typecheck)`), matrix strategy 는 job `name` 뒤에 `(<matrix-value>)` 자동 첨부 (예: `CodeQL Analyze (javascript-typescript)`). 워크플로우 yaml 에서 추정 금지 — 항상 `gh api .../check-runs` 로 실측 후 ruleset 등록. ruleset PUT 은 전체 교체이므로 jq 패치 절차 (GET → jq 로 `required_status_checks` rule 만 교체 → PUT) 로 다른 rule 보존 의무. staging/main ruleset 의 required check 4개 (`Verify (...) / Verify (...)`, `PR Title (Semantic)`, `Auto Label`, `CodeQL Analyze (javascript-typescript)`) 로 활성화 완료 | `docs/BUILD-AND-RELEASE.md` §12.9 |
| 2026-05-25 | goal `firebase cloud messaging 추가` | Firebase Cloud Messaging 도입 — `@react-native-firebase/messaging ^24.0.0`, Expo Router custom entrypoint에서 background handler 선등록, Android `POST_NOTIFICATIONS`, iOS APNs entitlement/background mode, token은 로컬 저장만 수행. FCM payload에 보호자 PII 금지, client receipt는 metadata만 영속화 | `package.json`, `index.js`, `app.config.ts`, `features/notifications/`, `docs/ARCHITECTURE.md`, `docs/BUILD-AND-RELEASE.md`, `docs/SHARED-MODULES.md` |
| 2026-05-25 | plan `RNFirebase Messaging Usage 기준 재구현 계획` | RNFirebase Messaging Usage 기준 보강 — iOS background FCM headless launch에서는 root provider/effect를 렌더하지 않고, Android `POST_NOTIFICATIONS`는 API 33+에서만 요청·확인하며 API 32 이하는 authorized로 처리 | `features/notifications/fcm-client.ts`, `app/_layout.tsx`, `docs/SHARED-MODULES.md`, `docs/BUILD-AND-RELEASE.md` |
| 2026-05-25 | conversation 정책 정정 | 도메인 hook 배치 규칙 변경 — hook 개수와 무관하게 `features/<domain>/hooks/use-<topic>.ts` 를 사용하고, 평면 `features/<domain>/use-<topic>.ts` 배치는 금지 | `docs/CONVENTIONS.md` §1.2, `docs/SHARED-MODULES.md` §10, `docs/WORKFLOW.md` |
| 2026-06-07 | plan `~/.claude/plans/greedy-skipping-puddle.md` (staging 기동 크래시 `NoClassDefFoundError: AnyTypeCache` 수정) | expo 네이티브 의존성 SDK 정합성 의무화 — expo 관리 패키지(`expo-*` + bundledNativeModules의 react-native-*)는 반드시 `npx expo install <pkg>`로만 추가·업그레이드, `yarn add` 직접 사용 금지 (PR #56에서 `yarn add expo-crypto`로 SDK 56용 56.0.4가 설치되어 SDK 54 런타임에서 기동 즉시 크래시). 의존성 변경 후 `npx expo install --check` 0건 의무, CI `_verify.yml`에 동일 게이트 추가로 모든 PR 차단형 강제. 동반 조치: `expo-crypto ~15.0.9` 정정 및 기존 비정합 9건(`expo`, `expo-file-system`, `expo-font`, `expo-localization`, `expo-router`, `expo-updates`, `react-native-gesture-handler`, `react-native-svg`, `@react-navigation/bottom-tabs`) `expo install --fix`로 일괄 정렬 | `package.json`, `yarn.lock`, `.github/workflows/_verify.yml`, `docs/CONVENTIONS.md` §5·§7 (신규), `CLAUDE.md` Hard Rules |
| 2026-06-07 | conversation (release-please 오작동 분석 + RN 배포 자동화 조사) | **deprecated: release-please 기반 자동 semver** → 수동 bump + 버전 게이트 직접 릴리즈 파이프라인으로 전환. 배경: (1) `target-branch` 미지정으로 release PR이 default 브랜치(dev)에 생성되는 오작동 (PR #64), (2) squash-merge 환경에서 squash 본문 불릿(`* feat:`) 미파싱 → promote PR마다 `BEGIN_COMMIT_OVERRIDE` 수동 작성 의존, (3) 릴리즈당 main 머지 2회 필요. 고스타 RN 앱(Bluesky·Expensify·Mattermost·RocketChat) 조사 결과 conventional-commit 자동 semver 도구 채택 0곳 — 수동 bump PR + 명시적 트리거가 실무 표준. 신규 구조: `yarn release:bump <patch\|minor\|major>` 커밋을 promote cascade에 포함 → main push 시 `eas-production.yml` `release-gate`가 package.json version과 기존 태그 비교 (이미 태그된 버전이면 빌드 skip) → 빌드 성공 후 tag `vX.Y.Z` + GitHub Release(`--generate-notes`) 자동 생성. CHANGELOG.md 파일 폐지 (GitHub Releases가 릴리즈 노트 단일 소스), commit type→semver 자동 매핑 폐지 (type은 PR title gate + bump 수준 판단 근거로 유지), 핫픽스는 `release:bump patch` 커밋 포함 의무 | `.github/workflows/release-please.yml`·`release-please-config.json`·`.release-please-manifest.json`·`CHANGELOG.md` 삭제, `.github/workflows/eas-production.yml` 재작성, `package.json` (`release:bump` 스크립트), `.github/labeler.yml`, `docs/BUILD-AND-RELEASE.md` §12.1·§12.2·§12.5·§12.6·§12.11·§13 Hard Rules, `docs/CONVENTIONS.md` §4.1.1, `CLAUDE.md` Hard Rules·브랜치 전략 |

## 2. 정책 카테고리별 요약

### 2.1 Analytics
- 이벤트 정의: `features/analytics/events.ts`의 `AnalyticsEvent` discriminated union에 먼저 등록 후 사용
- 이벤트 이름: snake_case, ≤40 chars, `<domain>_<action>` 패턴, `clampEventName()`을 통해 길이 보장
- 스크린 트래킹: 매 스크린 함수 상단 `useScreenTracking('<screen_name>')` 한 번
- Firebase: modular API v24만 사용, namespaced `analytics().…` / `crashlytics().…` 금지
- ATT: iOS에서 거부 시 모든 provider 비활성, AnalyticsProvider bootstrap 단계에서 결정
- Fanout: 각 provider는 try/catch로 격리, 한 provider 실패가 다른 provider를 막지 않음
- Clarity masking: `maskingMode: 'Balanced'`, 사용자 입력 필드 mask
- userId lifecycle: `setUserId(profileId | null)` — profile 생성/삭제 시점에 호출
- PII: 보호자 이름·이메일·전화·정확한 위치 절대 수집 금지

### 2.2 에러 처리
- Fatal: `reportError(err, { scope: 'feature.method', screen_name?: '...' })`
- Non-fatal: `console.warn('[scope]', err)`
- Empty catch `try { } catch {}` 절대 금지
- Silent fallback 금지 — 사용자 영향 시 surface

### 2.3 파일·폴더·스타일
- features는 도메인 flat-file 패턴 (`*-types`, `*-storage`, `*-context`, `*-validation`, `*-model`, `*-config`)
- 훅 2개 이상이면 `features/<domain>/hooks/` 서브폴더
- 컴포넌트는 `components/ui` / `components/<domain>` / `components/<domain>/forms` / `components/session/{setup,running}`
- 스크린 줄 수: 일반 ≤200, session-active ≤100, session-setup ≤80
- JSX는 `app/`과 `components/`에만 — features는 JSX 금지
- 색·폰트·spacing·radii는 `constants/theme.ts`에서만, 인라인 rgba 금지
- dark-surface 대응 시 `*OnDark` 토큰 추가

### 2.4 재사용
- 신규 utility/hook/token 추가 전 `docs/SHARED-MODULES.md` + `constants/theme.ts` grep 의무
- 단일-caller utility 추출 금지, 2회 이상 중복 시에만 추출
- features 간 cross-domain import는 plan별 허용 규칙을 따름 (예: training → word-library 금지)

### 2.5 네이티브 설정
- `@react-native-firebase/* ^24.0.0` 핀 (modular API 전제)
- `plugins/withFirebaseStaticPodfile.js` + `app.config.ts` plugin 등록 의무
- `plugins/withGradleJvmArgs.js` 로 Android Gradle JVM heap/metaspace 영속 주입 — `android/gradle.properties` 직접 편집 금지 (prebuild 가 덮어씀)
- `firebase.json`: crashlytics 디버그 off, analytics auto-collection on
- Expo Go 사용 불가 → dynamic config + prebuild 기반
- 환경별 빌드(dev/prod), EAS Secret, 출시 절차는 `docs/BUILD-AND-RELEASE.md` 가 SSoT

### 2.6 커밋 디시플린
- Conventional commits 소문자: `feat`, `fix`, `refactor`, `chore`, `docs`, `perf`, `ci`
- scope는 도메인 (`feat(analytics):`, `refactor(audio):`)
- 책임 단위 분리 (deps / config / feature / wiring을 각각의 커밋으로)
- 커밋 전 `yarn lint && yarn typecheck` 그린
- `--no-verify` 금지, try/catch 우회 금지, attribution 라인 금지 (전역 settings)

## 3. 갱신 규칙

- 본 문서는 정책이 신규 도입·변경되면 반드시 갱신
- 갱신은 `.claude/skills/buddybird-policy-update`가 자동 수행 (수동 호출 또는 발화 트리거)
- 기존 행은 수정·삭제하지 않음. 정책이 폐기되면 새 행에 "deprecated: …"로 추가
