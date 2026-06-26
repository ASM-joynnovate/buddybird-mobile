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

`type`: `feat` | `fix` | `refactor` | `chore` | `docs` | `perf` | `ci`
`scope`: 도메인 (`analytics`, `audio`, `training`, `profile`, `theme`, `i18n`, `words`, `ios`, `deps`, …)

예:
- `feat(analytics): track session abandonment`
- `refactor(audio): replace silent catch swallows with explicit warn logging`
- `chore(deps): add firebase, clarity, expo-tracking-transparency packages`

### 4.1.1 commit type 과 semver

commit type 은 더 이상 자동 semver bump 를 결정하지 않습니다 (release-please 제거, 2026-06-07 — `docs/POLICY-HISTORY.md` 참고). `version` bump 는 릴리즈 promote 전 `yarn release:bump <patch|minor|major>` 로 명시적으로 수행합니다.

type 은 여전히 정확하게 작성하세요 — PR title gate (`PR Title (Semantic)`) 차단 기준이며, 릴리즈 시 bump 수준 (fix 만 → patch, feat 포함 → minor) 을 판단하는 근거입니다.

상세 정책은 `docs/BUILD-AND-RELEASE.md` §12.2.

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
