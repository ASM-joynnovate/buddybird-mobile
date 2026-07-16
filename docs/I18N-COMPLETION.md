# 하드코딩 한국어 문자열 i18n 이관 [BB-155]

앱의 언어 결정 방식은 현행 유지한다 — 기기 언어를 따라가고(`expo-localization` → `normalizeLocale`), 기본값은 `ko`, 인앱 언어 선택 UI는 만들지 않는다.
(참고: `i18n-context`에 `setLocale`/`loadStoredLocale` 영속 오버라이드 스캐폴딩이 존재하나 writer가 없어 inert — 현재 동작은 기기 언어 따라가기와 동일하다. `profile.language*` 카피·`supportedLocales`도 정의만 있고 미소비.)
이 작업의 범위는 i18n을 거치지 않고 한국어를 하드코딩한 화면·모듈을 `features/i18n` 리소스로 이관해, 영어 기기 사용자에게 한국어가 섞여 보이는 문제를 해소하는 것이다.

## 1. 배경 — 감사 결과 (2026-07-15)

| 항목 | 상태 |
|---|---|
| `translations`의 `ko`/`en` 키 구조 일치 | 완료 — `Record<AppLocale, AppCopy>` 타입이 컴파일 타임에 강제, `yarn typecheck` 그린 |
| `en` 블록 내 미번역 한국어 잔재 | 없음 — `ko: '한국어'`(언어명 원어 표기) 1건만 존재하며 의도된 값 |
| i18n을 우회한 하드코딩 한국어 | **약 170곳 / 50여 파일** (주석 제외) |

온보딩·피드백 등 초기 화면은 `useI18n().t()`를 사용하고 있다.
미번역은 이후 추가된 세션·단어·프로필·홈 기능에 집중되어 있다.

**감사 이후 변경 (2026-07-16 재검증)**: BB-28 커밋(033ce60)이 Android 네이티브 알림에 한국어 5건을 추가했다 — §3.7 신설. 또한 §3.6의 '확인 필요' 항목들을 호출 경로 추적으로 판정 확정했다.

## 2. 목표 / 비목표

**목표**

- 사용자에게 노출되는 모든 문자열(화면 텍스트, Alert, 접근성 라벨)을 `i18n-resources.ts` 경유로 이관
- 시간 포맷(`초/분/시간`) 등 공유 유틸의 로케일 대응
- 단어 태그의 데이터 값과 표시 라벨 분리

**비목표**

- 인앱 언어 선택 UI (기기 언어 따라가기 유지)
- `components/debug/*` 개발자 전용 화면 번역
- 로그 전용 메시지(`reportError` / `console.warn`에만 전달되는 에러 메시지) 번역
- 새 로케일 추가 (`ko`/`en` 유지)

## 3. 작업 범위 — 우선순위 순

### 3.1 단어 태그 키-라벨 분리 (구조 변경, 가장 큼)

한국어 리터럴이 데이터 모델 값이자 UI 라벨로 이중 사용되고 있다.

| 파일 | 현재 |
|---|---|
| `features/word-library/word-library-types.ts:1-2` | `WordTag = '인사' \| '음식' \| '이름' \| '기타'` + `WORD_TAGS` 배열 |
| `constants/theme.ts:97-124` | `BuddyBirdCategory`가 같은 한국어 리터럴로 **4개** Record 키 정의 — `categoryColor`/`categoryShadow`/`categoryTint`/`categoryTintStrong` (내부 자기참조 lookup 포함) |
| `features/training/session-words-mock.ts:1` | `CATS = ['전체', '인사', …]` — `'전체'` 값·라벨 겸용의 실제 출처. `app/(tabs)/words.tsx:29,60,66`이 상태·비교에 사용 (이관 시 `features/word-library/word-categories.ts`로 이동·리네임) |
| `components/words/word-filter-bar.tsx:49-55` | 제네릭 컴포넌트(값을 그대로 라벨로 렌더) + 한국어 키 색 맵 `toneByCategory` |
| `features/word-library/word-library-model.ts:39-42` | 프리셋 단어의 `tag`에 한국어 값 저장 |
| `components/words/word-create-fields.tsx:44,59-64` | `WORD_TAGS`를 Chip 라벨로 직접 렌더 + 한국어 키 `toneByTag` |
| `components/words/word-create-modal.tsx:31,62` · `word-edit-modal.tsx:37,369-372` | `useState<WordTag>('인사')` 기본값 + 한국어 키 색 맵 |
| `app/(tabs)/words.tsx:63-73` + `features/analytics/events.ts:149-152` | **analytics 의존성** — `word_library_filter_changed`가 태그 값을 raw 전송. 키 전환 시 `from`/`to` 파라미터 값이 영문으로 바뀜 (0.7.0 프리릴리즈라 신 값 그대로 전송하기로 결정, PR에 명시) |

(그 외 `word-list-item.tsx`·`recorder-color-card.tsx`·`recorded-playback-row.tsx`·`use-word-selection.ts`는 `WordTag` 타입만 소비 — 키 전환 시 컴파일러가 강제.)

방향: `WordTag`를 영문 키(`greeting`/`food`/`name`/`etc`)로, `CATS`는 `all` 포함 영문 키로 전환하고 표시 라벨은 `t()`로 해석한다.
`constants/theme.ts`의 카테고리 맵 4개와 컴포넌트 색 맵 키도 동일 키로 전환한다.
**기존 사용자 저장 데이터(`entriesById`의 `tag` 필드)에 한국어 값이 이미 저장되어 있으므로 hydrate 시 1회 마이그레이션이 필요하다** — `word-library-storage.ts`가 `persistKeyedStore`에 주입하는 `parse`(`parseWordLibraryStore`)가 자연스러운 지점. 기존 version 분기/마이그레이션 선례는 없으므로 신규 패턴 수립임.

### 3.2 시간 포맷 유틸 로케일 대응

`features/shared/duration-format.ts`가 `초/분/시간`을 하드코딩한다. 여러 화면이 공유하므로 파급이 크다.
features는 JSX·훅 사용이 불가하므로 `profile-validation.ts`의 기존 패턴을 따라 `t`(또는 locale)를 인자로 주입받는 시그니처로 전환하고, 호출부(스크린/컴포넌트)가 `useI18n()`에서 꺼내 전달한다.
변경 후 `docs/SHARED-MODULES.md`의 해당 레지스트리 항목 시그니처를 갱신한다.

### 3.3 세션 플로우

| 파일 | 내용 |
|---|---|
| `features/training/session-config.ts` | 프리셋 `shortLabel`(짧게/중간/길게)·`description` — 카피를 키로 바꾸고 UI에서 `t()` 해석 |
| `components/session/running/session-completion-view.tsx` | "학습 완료! 🎉" 등 + `withSubjectParticle`(이/가 조사 로직) — 조사 처리는 한국어 전용이므로 로케일 분기 필요 (en은 조사 없음) |
| `components/session/setup/session-preset-card.tsx`, `cycle-summary.tsx`, `word-picker-card.tsx` | 세션 설정 카피 |
| `components/session/session-recovery-banner.tsx`, `running/session-header.tsx`, `session-controls.tsx`, `session-phase-badge.tsx`, `session-progress-ring.tsx`, `session-wave-section.tsx` | 세션 진행 카피 |
| `features/training/hooks/use-session-start.ts:23` | `'학습 시작'` — 홈 시작 버튼 라벨+접근성 라벨(`index.tsx:59,63`)로 노출 확정 → 이관 |
| `features/training/hooks/use-active-session.ts:112` | throw 메시지는 `reportError`로만 흐르고 렌더 텍스트는 `session-controls.tsx`의 '시작 실패' → 로그 전용 확정, 비목표 |
| `features/training/training-storage.ts:27`, `training-validation.ts:21`, `training-context.tsx:98` | **에러 메시지가 홈 화면에 렌더링** (`use-learning-setup.ts` → `index.tsx:51 <InlineError>`) → 이관 대상 (§3.6에서 편입) |

### 3.4 단어 관리 화면

| 파일 | 내용 |
|---|---|
| `app/(tabs)/words.tsx` | "단어 관리", '전체' 필터(§3.1과 연동), "단어 추가" 접근성 라벨 |
| `components/words/word-edit-modal.tsx`, `word-create-modal.tsx` | 이미 ~90% `t()` 이관 완료 — 잔여분만: Alert("저장 실패"/"삭제 실패"), 삭제 확인 문구, "닫기" 접근성 라벨 |
| `features/word-library/word-library-context.tsx:67` | `'단어 목록을 불러오지 못했어요.'` — words 화면 `<InlineError>` 노출 → 이관 대상 (§3.6에서 편입) |
| `components/words/word-create-fields.tsx`, `word-create-header.tsx`, `word-list-item.tsx`, `word-filter-bar.tsx`, `forms/recording-form-card.tsx`, `recorder/recorder-color-card.tsx` | 폼·리스트 카피와 접근성 라벨 |

### 3.5 프로필 · 홈 · 내비게이션

| 파일 | 내용 |
|---|---|
| `components/profile/profile-achievements-grid.tsx` | "업적", "불꽃 지킴이", "N일 연속" 등 |
| `components/profile/profile-stats-row.tsx`, `forms/profile-edit-form.tsx`, `profile-avatar-picker.tsx` | 프로필 카피 |
| `features/profile/profile-display.ts` | 품종명 맵(회색앵무 등) — 키는 이미 영문, 라벨만 `t()` 해석으로 전환 |
| `app/(tabs)/index.tsx` | "학습 시간" 섹션 타이틀, 시작 버튼 접근성 라벨 |
| `app/(tabs)/profile.tsx` | 시간 표기(§3.2와 연동) |
| `components/navigation/floating-tab-bar.tsx:12-14` | 탭 라벨(학습/단어/프로필) |
| `components/onboarding/onboarding-progress-header.tsx`, `onboarding-profile-view.tsx`, `components/mascot/buddy-bird.tsx` | 잔여 1~2건씩 (접근성 라벨) |

(`components/audio/waveform-placeholder.tsx`는 이미 이관 완료 — 잔여 한국어는 주석뿐, 감사 목록에서 제외.)

### 3.6 판정 확정 (2026-07-16 호출 경로 추적)

- **프리셋 단어 자체** (`word-library-model.ts`의 label '안녕'/'사과' 등): UI 카피가 아니라 앵무새가 학습할 콘텐츠 데이터다. 영어 사용자에게 영어 프리셋 단어를 줄지는 제품 결정 사항 — 이 작업에서는 보류하고 별도 이슈로 분리.
  참고: `i18n-resources.ts`의 `trainingTemplates.presetWords/sessions`는 로컬라이즈돼 있으나 **소비자 0인 죽은 카피**이며 실제 프리셋(`SEED_PRESETS`, `session-config.ts`)과 내용도 어긋난다(`water` vs `saranghae`) — 분리 이슈에 함께 기록.
- **storage 에러 메시지 판정**:
  - `word-library-storage.ts:20` — context가 catch 후 자체 메시지로 대체 → 로그 전용, 비목표
  - `profile-storage.ts:24,34` — `profile-context.errorMessage`에 소비자 없음 → 로그 전용, 비목표
  - `training-storage.ts:27` · `training-validation.ts:21` · `training-context.tsx:98` — **홈 화면 노출** → 이관 대상, §3.3 편입
  - `word-library-context.tsx:67` — **words 화면 노출** → 이관 대상, §3.4 편입

### 3.7 Android 네이티브 알림 (감사 이후 커밋 033ce60, BB-28)

`modules/session-audio-engine/android/src/main/java/com/joynnovate/buddybird/sessionaudio/AudioForegroundService.kt:59-71` — OS 알림 셰이드에 한국어 5건: 채널명 "학습 세션", 채널 설명, 알림 제목 "버디버드 학습 중", 본문, 액션 "학습 종료". `modules/`는 §5 grep 게이트 스캔 경로 밖이라 감사에서 빠졌다.
JS `features/i18n`이 아닌 **Android 리소스**(`res/values/strings.xml` ko + `res/values-en/strings.xml`)로 이관한다.

## 4. 진행 순서

```
1. §3.1 태그 키-라벨 분리 + 저장 데이터 마이그레이션 → 검증: typecheck + 구 데이터 hydrate 수동 확인
2. §3.2 duration-format 로케일 주입 → 검증: 호출부 전체 갱신, SHARED-MODULES.md 반영
3. §3.3~3.5 화면별 이관 (화면 단위 커밋, §3.6에서 편입된 에러 메시지 포함) → 검증: 아래 grep 게이트
4. §3.7 Android 알림 strings.xml 이관 → 검증: en 기기 알림 셰이드 확인
5. 프리셋 단어 이슈 분리 (§3.6)
```

리소스 추가 시 `AppCopy` 타입에 키를 먼저 추가하면 `ko`/`en` 동시 작성이 타입으로 강제된다.

## 5. 검증

- `yarn lint && yarn typecheck` 그린
- 하드코딩 잔재 grep 게이트 (0건 목표, 비목표 경로 제외):

```bash
grep -rn "[가-힣]" app components features hooks constants \
  | grep -v "features/i18n/i18n-resources.ts" \
  | grep -v "components/debug/" \
  | grep -vE ":[0-9]+:\s*(//|/?\*)"        # 행 시작 주석만 제외
grep -rn "[가-힣]" modules --include="*.kt" --include="*.swift"   # §3.7 네이티브 코드 (리소스 xml 제외)
```

주의: 첫 게이트는 행 시작 주석만 걸러 **인라인/JSDoc 본문 주석이 히트로 남는다(under-filter)** — 자동 pass/fail이 아닌 안전망이며, 잔여 히트는 육안 분류한다(주석·정규식·로그 전용만 허용). `components/ui/pill-button.tsx:37`의 한국어 감지 정규식은 텍스트가 아니라 letter-spacing 분기 로직 — 유지하되 en 라벨에서 스타일 확인.

- 수동 확인: 기기 언어 en 설정 후 홈 → 단어 관리 → 세션 설정/진행/완료 → 프로필 순회 + **Android 알림 셰이드**, 한국어 노출 0건. 영어 라벨에서 `pill-button` letter-spacing 정상 확인
- 기존 설치 시나리오: 한국어 태그가 저장된 구 데이터로 업그레이드 후 단어 목록·필터·analytics 이벤트 정상 동작

## 6. 관련

- JIRA: BB-155
- `docs/CONVENTIONS.md` — features JSX 금지 (t 주입 패턴 근거)
- `docs/SHARED-MODULES.md` — `duration-format` 시그니처 변경 시 갱신 대상
- `features/profile/profile-validation.ts` — feature 레이어 `t` 주입 선례
