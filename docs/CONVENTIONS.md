# Conventions

`buddybird-mobile`의 파일·폴더·스타일·에러 처리·커밋 컨벤션. 모두 단정문(rule)이며, 위반 시 PR/커밋이 거부됩니다.

## 1. 파일·폴더 레이아웃

### 1.1 `features/<domain>/` — flat-file 패턴

도메인 로직은 `features/`에 두며, 다음 파일명 컨벤션을 따릅니다 (JSX 금지):

| 파일 | 책임 |
|---|---|
| `*-types.ts` | 도메인 타입·인터페이스 |
| `*-storage.ts` | AsyncStorage 입출력 |
| `*-context.tsx` | React Context + Provider (JSX는 Provider만) |
| `*-validation.ts` | 입력 검증 |
| `*-model.ts` | 도메인 비즈니스 로직 (순수 함수) |
| `*-config.ts` | 상수·프리셋 |
| `*-<role>.ts` (예: `*-gate.ts`·`*-batch.ts`·`*-response.ts`·`*-meta.ts`) | 단일 역할 순수 모듈 — `*-model.ts` 하나로 커질 로직을 역할 단위로 분리 (I/O 없음). 외부 API I/O 는 `*-client.ts` 로 격리 |

### 1.2 `hooks/` 서브폴더 사용 기준

- 도메인 hook은 개수와 무관하게 `features/<domain>/hooks/use-<topic>.ts`에 둠
- `features/<domain>/use-<topic>.ts` 평면 배치는 금지. 기존 평면 hook 발견 시 수정 범위에 포함될 때 `hooks/`로 이동

### 1.3 `components/` 분류

| 폴더 | 용도 |
|---|---|
| `components/ui/` | 도메인 무관 primitive (Card, Chip, FormField, PillButton, IconSymbol) |
| `components/layout/` | 화면 레이아웃 (PetScreen 등) |
| `components/<domain>/` | 도메인 표시 컴포넌트 (`profile/`, `audio/`, `words/`, …) |
| `components/<domain>/forms/` | 폼 컴포넌트가 3개 이상 모일 때만 분리 |
| `components/session/{setup,running}/` | 세션 단계별 컴포넌트 |

### 1.4 스크린 줄 수 예산 (composition-only)

스크린(`app/**/*.tsx`)은 hook 호출 + JSX composition만. 로직은 features/hooks로 위임.

| 스크린 | 상한 |
|---|---|
| 일반 스크린 | ≤200 줄 |
| `app/session-active.tsx` | ≤100 줄 |
| `app/(tabs)/session-setup.tsx` | ≤80 줄 |

### 1.5 JSX 위치

- JSX는 `app/`과 `components/`에만
- `features/`에서 JSX는 `*-context.tsx`의 Provider만 허용

### 1.6 Cross-domain import 규칙

- features 간 직접 import는 plan별 허용 규칙을 따름
- 예: `features/training/` → `@/features/word-library` import 금지 (반대 방향만 허용)
- 경로 alias는 `@/` (root) 사용. 상대 경로 `../../`는 features 내부에서만 허용

### 1.7 커스텀 훅 vs 순수 함수 결정 기준

- React state·effect를 사용 → 훅 (`use-*.ts`)
- pure transform / no React API → 함수 (`*-model.ts` 또는 `features/shared/`)

### 1.8 추출 임계값

- 동일 코드가 **2회 이상 중복**될 때만 utility로 추출
- single-caller만 있을 함수의 사전 추출 금지
- 추출 즉시 `docs/SHARED-MODULES.md`에 등록

## 2. 스타일

### 2.1 토큰 의무

모든 색·폰트·spacing·radii는 `constants/theme.ts`에서만 import. 인라인 값 금지.

```ts
// 잘못된 예 (금지)
<View style={{ color: 'rgba(31,58,61,0.55)', padding: 12 }} />

// 올바른 예
<View style={{ color: BuddyBirdColors.kickerMuted, padding: Spacing.md }} />
```

### 2.2 인라인 `rgba()` 절대 금지

- 신규 muted 색이 필요하면 `constants/theme.ts`의 `BuddyBirdColors`에 토큰 먼저 추가
- 검증: `rg "rgba\(" components/ features/ app/` 0건 유지

### 2.3 dark-surface 대응

- dark surface 위 텍스트가 새로 필요하면 `<base>OnDark` 토큰 신규 정의
- 예: `kickerMutedOnDark`, `bodyMutedOnDark`

## 3. 에러 처리 & 로깅

### 3.1 분류

| 상황 | 처리 |
|---|---|
| Fatal — 사용자 영향 + 크래시 위험 | `reportError(err, { scope: 'feature.method', screen_name?: '...' })` |
| Non-fatal — 로깅만 필요 | `console.warn('[scope]', err)` |
| 무시 가능 — 정말 의도된 fallback | 인라인 주석으로 **이유**를 남기고 처리 |

### 3.2 절대 금지

- `try { } catch {}` 또는 `catch (e) {}` — empty catch 금지
- silent fallback — 사용자 영향이 있는 실패를 surface 없이 묻기 금지
- `console.log` 디버그 잔여물 — 정식 로깅은 `console.warn` 또는 `reportError`

### 3.3 scope 명명

- `<domain>.<method>` 형식 (예: `audio.startRecording`, `profile.persist`)
- `screen_name`은 화면에서 발생한 에러일 때만 추가

## 4. 커밋

### 4.1 Conventional Commits (소문자)

```
<type>(<scope>): <description>
```

`type`: `feat` | `fix` | `refactor` | `chore` | `docs` | `perf` | `ci` | `test`
`scope`: 도메인 (`analytics`, `audio`, `training`, `profile`, `theme`, `i18n`, `words`, `ios`, `deps`, …)

예:
- `feat(analytics): track session abandonment`
- `refactor(audio): replace silent catch swallows with explicit warn logging`
- `chore(deps): add firebase, clarity, expo-tracking-transparency packages`

### 4.1.1 commit type 과 semver

commit type 은 더 이상 자동 semver bump 를 결정하지 않습니다 (release-please 제거, 2026-06-07 — `docs/POLICY-HISTORY.md` 참고). `version` bump 는 릴리즈 promote 전 `yarn release:bump <patch|minor|major>` 로 명시적으로 수행합니다.

type 은 여전히 정확하게 작성하세요 — PR title gate (`PR Title (Semantic)`) 차단 기준이며, 릴리즈 시 bump 수준 (fix 만 → patch, feat 포함 → minor) 을 판단하는 근거입니다.

상세 정책은 `docs/BUILD-AND-RELEASE.md` §12.3.

### 4.2 책임 단위 분리

한 커밋 = 한 책임. deps / config / feature / wiring을 다른 커밋으로 분리:

- `chore(deps): add X` — package.json 변경만
- `chore(ios): add Y plugin` — 네이티브 설정만
- `feat(<domain>): wire Y into root layout` — 코드 통합

### 4.3 사전 게이트

```bash
yarn lint
yarn typecheck
```

둘 다 그린 후에만 커밋. `--no-verify` 절대 금지. try/catch로 lint 우회 금지.

### 4.4 메시지 규칙

- attribution 라인 (Co-Authored-By 등) 추가 금지 — 전역 `~/.claude/settings.json`로 제어
- 본문은 영어로 작성
- 1줄 제목 + 빈 줄 + 선택적 본문 (bullet 위주)

## 5. 검증 grep (코드와 컨벤션 self-consistency)

커밋 전 0건 확인:

```bash
# 인라인 rgba 금지
rg "rgba\(" components/ features/ app/

# empty catch 금지
rg "catch\s*\(\s*\w*\s*\)\s*\{\s*\}" features/ app/ components/

# namespaced Firebase API 금지 (modular API만)
rg "analytics\(\)\.|crashlytics\(\)\." features/ app/

# 스크린 줄 수 예산
wc -l app/session-active.tsx          # ≤100
wc -l app/\(tabs\)/session-setup.tsx  # ≤80

# expo 네이티브 의존성 SDK 정합성 (§7) — CI `_verify.yml`에서도 강제
npx expo install --check

# 네이티브 의존성 패치 활성 확인 (§7.2) — CI `_verify.yml`에서도 강제
grep "expo-image-picker@patch:" yarn.lock
```

## 6. 데이터 영구화 (Storage)

### 6.1 오디오 파일 URI는 정규화된 키로만 영구화

iOS는 앱 컨테이너 UUID를 빌드·재설치·OS 업데이트 시점에 변경합니다 ([Apple TN2406](https://developer.apple.com/library/archive/technotes/tn2406/_index.html), [expo/expo#32788](https://github.com/expo/expo/issues/32788)). 따라서 `file:///var/mobile/Containers/Data/Application/{UUID}/Documents/...` 같은 절대 URI를 AsyncStorage에 그대로 저장하면 **재빌드 후 stale 상태가 되어 재생/세션 사용이 깨집니다.**

규칙 (단정문):

- AsyncStorage에 저장되는 `WordEntry.audioUri` / `WordEntry.transformedAudioUri` / `TrainingWord.audioUri` / `TrainingWord.transformedAudioUri` / `AudioRecording.originalUri` / `AudioRecording.transformedUri` 등 **모든 오디오 URI 필드**는 `recording://<fileName>` 또는 `preset://<label>` 형식만 영구화 — 절대 `file://` URI 저장 금지.
- 변환은 영속 seam(`features/shared/persist-keyed-store.ts`의 `persistKeyedStore`)이 소유한다. storage 모듈은 `audioUriCollections`로 변환 대상 컬렉션·필드만 선언하고, `normalizeAudioUriForStorage` / `hydrateAudioUriFromStorage`를 직접 호출하지 않는다. seam이 write 직전 정규화 / read 직후 복원을 자동 수행한다. UI/도메인 코드는 in-memory 절대 URI를 그대로 사용.
- 재생/세션 직전 `recordingFileExists(uri)`로 stale·missing 가드 — 깨진 entry는 재생 비활성화 또는 무음 진행, 크래시 금지.
- preset URI(`preset://<label>`)는 변환·검사 대상에서 제외 (pass-through).
- 신규 storage 모듈은 seam의 `audioUriCollections` 선언만으로 변환 invariant가 인터페이스 차원에서 강제됨 — 별도 검증 grep 불필요.

신규 영구화 대상이 늘어나면 동일 패턴을 적용하고 본 §과 [SHARED-MODULES §6.1](./SHARED-MODULES.md#61-오디오-파일-저장-utility--featuresaudioaudio-file-storagets)을 함께 갱신하세요.

## 7. 의존성 관리

### 7.1 expo 네이티브 의존성은 `npx expo install`로만 추가·업그레이드

expo가 버전을 관리하는 패키지(`expo-*`, 그리고 `react-native-gesture-handler`·`react-native-svg` 등 SDK `bundledNativeModules.json`에 포함된 react-native-* 네이티브 모듈)는 네이티브 코드가 `expo-modules-core`의 특정 버전을 가정하고 컴파일됩니다. `yarn add`로 최신 버전을 직접 설치하면 peerDependency(`expo: "*"`)가 경고 없이 통과하지만, 런타임에 `NoClassDefFoundError` 등으로 **앱이 기동 즉시 크래시**할 수 있습니다 (실사례: `expo-crypto@56` × SDK 54 → `NoClassDefFoundError: expo.modules.kotlin.types.AnyTypeCache`, 2026-06 staging 전면 크래시).

규칙 (단정문):

- expo 관련 패키지 추가·업그레이드는 반드시 `npx expo install <pkg>` 사용 — `yarn add <expo-pkg>` 직접 사용 금지.
- 의존성 변경 후 `npx expo install --check`가 0건이어야 커밋 가능 — CI `_verify.yml`이 모든 PR에서 동일 검사로 차단.
- SDK 기대치보다 최신 버전이 필요한 예외는 PR 본문에 사유 명시 + 에뮬레이터 기동 검증 결과 첨부 후에만 허용.

### 7.2 네이티브 의존성 패치는 Yarn patch (`.yarn/patches` + `resolutions`)로 관리

네이티브 의존성의 버그를 앱에서 우회할 수 없을 때(예: 네이티브 fatal 크래시)는 Yarn 네이티브 patch 프로토콜로 수정합니다 (도입 사례: BB-235, expo-image-picker 크롭 ENOENT 크래시).

규칙 (단정문):

- 패치 생성은 `yarn patch <pkg>` → 수정 → `yarn patch-commit -s` 로만. patch-package 금지 — Yarn Berry에서는 postinstall 재실행이 보장되지 않아 패치가 **무음 유실**됨 (재현 확인됨).
- 패치는 `.yarn/patches/`에 커밋하고 `package.json`의 `resolutions`에 range descriptor(`<pkg>@npm:<범위>`)로 연결. `dependencies` 항목은 원래 버전 범위를 유지해야 `npx expo install --check` 게이트(§7.1)가 통과 — `dependencies`를 `patch:` 프로토콜로 직접 바꾸지 않는다.
- Android 소스를 패치한 expo 모듈은 `package.json`의 `expo.autolinking.android.buildFromSource` 배열에 등록 의무 — SDK 54부터 expo 모듈은 프리컴파일 AAR(`local-maven-repo`)로 소비되므로 등록 없이는 소스 패치가 빌드에 반영되지 않음. 이 `expo` 키는 expo-modules-autolinking이 `package.json`에서만 읽는다 — `app.config.ts`로 옮기면 조용히 무력화됨.
- 패치된 패키지를 업그레이드할 때는 `yarn patch`로 패치를 재생성하고 `resolutions` 키의 버전 범위를 함께 갱신. 키가 `dependencies` 범위와 불일치하면 Yarn 4는 **경고 없이 패치를 드롭**함 → CI `_verify.yml`이 `yarn.lock`의 `@patch:` 항목 존재를 게이트로 검증.
- 현재 패치 목록: `expo-image-picker@17.0.11` — 크롭 출력 디렉토리 사전 재생성 (BB-235). 업스트림 수정 릴리즈 시 패치·`resolutions`·`buildFromSource`·CI 게이트를 함께 제거.

## 8. e2e 테스트 (Maestro)

BB-159로 도입. Android-first, 대상은 dev variant(`com.joynnovate.buddybird.dev`) — prod 빌드로 실행 금지 (운영 Firebase 오염).
시나리오별 절차·커버리지는 `docs/E2E-SCENARIOS.md` (사람이 읽는 카탈로그) 참고 — 본 §8은 규약·레시피의 단일 출처.

### 8.1 testID·플로우 규약

- 인터랙션 셀렉터는 **testID**, 콘텐츠 assert만 텍스트(로케일 무관 데이터 — 시드 단어 라벨 등). UI 카피 텍스트 셀렉터 금지 — i18n(en fallback)·카피 변경·`textTransform: uppercase`에 취약.
- 네이밍: `<screen>-<element>` kebab-case (`onboarding-welcome-cta`, `session-start-cta`). 동적 목록은 `<prefix>-<id>` (`species-chip-budgie`, `tab-words`).
- 공용 터치 컴포넌트(`PillButton`·`Chip`)는 `testID?: string`을 받아 `Pressable3D`로 전달. 신규 공용 터치 컴포넌트도 동일 패턴 의무.
- 플로우는 모든 행동(tapOn)을 관찰 가능한 결과(assertVisible)와 짝지어 작성. `sleep` 금지 — auto-wait + `extendedWaitUntil` 사용. 녹음 최소 길이는 상태 라벨의 경과 타이머 텍스트(예: `0:02`) 대기로 보장 (예외: 재생 유지처럼 assert할 상태가 없는 경우만 `waitForAnimationToEnd` 바운디드 대기 허용).
- 플로우 = 사용자 절차 단위(선형, 조건 분기 금지). 인프라 방해 요소 정리만 subflow의 자가 회복 루프(조건부)로 처리.

### 8.2 레이아웃

```
.maestro/
  config.yaml        # 워크스페이스 (flows 포함 패턴)
  flows/             # 시나리오 (tags: smoke / regression)
  subflows/          # 공통 절차 (complete-onboarding — clearState + 방해 요소 자가 회복 루프)
```

### 8.3 로컬 실행 레시피

1. 에뮬레이터 기동 후 애니메이션 비활성화(재부팅 시 재적용): `adb shell settings put global window_animation_scale 0` + `transition_animation_scale`·`animator_duration_scale` 동일
2. debug 빌드는 Metro 필수 — `yarn start:dev` 켠 상태에서 `yarn e2e:android`(전체) / `yarn e2e:android:smoke`(smoke만)
3. 최초 1회 또는 네이티브 변경 시 `yarn android:dev`로 설치
4. debug 빌드 전용 방해 요소(dev-client 런처·dev menu·업데이트 모달·에뮬레이터 ANR)는 subflow 자가 회복 루프가 정리. subflow의 Metro 런처 진입 스텝은 **`optional: true` tapOn**이다 — debug 빌드엔 그 행이 뜰 때까지 암묵 대기 후 탭되고(느린 Metro 연결도 견딤), preview/release 빌드(JS 번들 내장)엔 끝내 안 떠 실패 없이 스킵된다. env 플래그 없이 빌드 종류로 자동 분기하므로 로컬(`yarn e2e:android[:smoke]`)·CI 모두 커맨드가 같다. dev menu(Continue/Reload)도 dev-client 전용이라 preview엔 노출되지 않고 `when:visible` 가드로 무시된다 (BB-384)
5. e2e 표준 기기 로케일은 **en-US** — 기기 로케일이 ko면 Gboard가 한국어 자판이 되어 Maestro `inputText`의 ASCII가 한글로 조합됨 (BB-159 실측: "Mango" → "ㅡ무해"). 시나리오는 로케일 무관 설계(인터랙션 testID + 콘텐츠 assert는 시드 한글 라벨)라 ko 고정이 필요 없다. 실행 전 확인: `adb shell settings get system system_locales`가 `en-US`가 아니면 `settings put system system_locales en-US` 후 Gboard 재시작(`am force-stop com.google.android.inputmethod.latin`)

> **Maestro 버전은 CI와 맞춘다** — CI 핀은 `e2e.yml`의 `env.MAESTRO_VERSION`(현재 `2.7.0`). 로컬 설치·고정: `curl -Ls https://get.maestro.mobile.dev | MAESTRO_VERSION=2.7.0 bash`. 버전이 어긋나면 로컬은 통과하고 CI만 깨지는(또는 반대) 실패가 난다.

### 8.4 검증 한계 (e2e가 보장하지 않는 것)

- 오디오 **내용** — 에뮬레이터 무음 녹음도 통과 (최소 길이·레벨 게이트 없음). 절차·UI 상태까지만 검증
- 세션 자연 완주·재생 소리·iOS 플로우(ATT) — README 수동 체크리스트 몫
- **업데이트 모달 간섭** — subflow 자가 회복 루프는 웰컴 도달 전 모달만 정리. 플로우 본편 중 등장하면 실패하고, 강제 업데이트 모달(닫기 없음)은 회복 불가. 근본 해결은 dev 리모트 컨피그 조정(별도 결정 전까지 알려진 리스크)

### 8.5 CI 실행 (BB-384)

`.github/workflows/e2e.yml` 가 GitHub Actions에서 실행. 상세 파이프라인은 `docs/BUILD-AND-RELEASE.md` §12.11, 규약 요점만 여기 둔다.

- **빌드**: EAS `preview` 프로필로 Android APK 빌드 → 에뮬레이터 설치. preview는 `developmentClient` 미포함(JS 번들 내장)이라 **Metro 불필요** → subflow의 Metro 런처 진입 스텝(`optional: true` tapOn)이 실패 없이 자동 스킵됨 (§8.3 step 4). dev variant(`com.joynnovate.buddybird.dev`)·dev Firebase 유지.
- **트리거**: PR→main = smoke(01~05) 머지 전 게이트 / nightly(schedule) = 전체 suite / `workflow_dispatch` = 수동(suite 선택). docs·마크다운만 바뀐 PR은 `paths-ignore`로 스킵.
- **Maestro 버전**: 워크플로우 `env.MAESTRO_VERSION`(현재 `2.7.0`)으로 핀 고정 — 로컬도 같은 버전 설치 유지(§8.3). 버전이 어긋나면 로컬/CI 한쪽만 깨지는 실패가 난다.
- **에뮬레이터**: `reactivecircus/android-emulator-runner`(api-level 34, x86_64, 기본 AOSP 이미지). google_apis 는 Firebase 실 init(네트워크)으로 스플래시 부팅이 느려져 웰컴 대기를 간헐 초과함(BB-384 실측: AOSP 5/5 vs google_apis 3/5) — e2e 는 UI·절차만 검증(§8.4)이라 Firebase 실동작이 불필요하므로 AOSP 로 결정적 부팅을 택함. 애니메이션 비활성화·로케일 en-US(§8.3 step 5)를 스크립트에서 강제.
- **실패 시**: Slack 알림(`_notify-slack.yml` 재사용) + Maestro 리포트 아티팩트 업로드.
