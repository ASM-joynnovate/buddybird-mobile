# 프리셋 단어 콘텐츠 로컬라이즈 여부 결정

Status: ready-for-human

## 배경

BB-155(하드코딩 한국어 i18n 이관)에서 보류·분리된 항목. `features/word-library/word-library-model.ts`의 `SEED_PRESETS` label('안녕'/'사과'/'사랑해'/'다녀와')은 UI 카피가 아니라 **앵무새가 학습할 콘텐츠 데이터**다. 영어 기기 사용자에게 영어 프리셋 단어(예: hello/apple)를 시드할지는 제품 결정 사항이라 BB-155 범위에서 제외했다.

## 참고 — 죽은 카피 존재

`features/i18n/i18n-resources.ts`의 `trainingTemplates.presetWords`/`trainingTemplates.sessions`는 ko/en 로컬라이즈가 이미 되어 있으나 **소비자가 0인 죽은 카피**이며, 실제 시드(`SEED_PRESETS`)·실제 세션 프리셋(`features/training/session-config.ts`)과 내용도 어긋난다(`water` vs `saranghae` 등). 이 이슈를 진행할 때:

- 프리셋을 로컬라이즈하기로 하면 → `trainingTemplates.presetWords`를 실제 시드의 SSoT로 승격하거나 갱신 후 연결
- 로컬라이즈하지 않기로 하면 → 죽은 `trainingTemplates` 블록 제거 검토

## 고려사항

- 시드는 최초 hydrate 1회만 실행되므로, 기존 설치 사용자에게는 소급 적용되지 않음
- 프리셋 오디오(`preset://…`)가 한국어 발화 음원이라면 라벨만 영어로 바꾸는 것은 무의미 — 음원 자체의 언어 결정이 선행되어야 함

## 관련

- BB-155, `docs/I18N-COMPLETION.md` §3.6

## Comments

**2026-07-16 — 결정·구현 완료 (feat/bb-155-i18n-migration):**

1. **로컬라이즈 확정** — 비-ko 로케일은 영어 프리셋 4개(Hello/Hi/I love you/Kiss, 키 `en-*` 접두) 시드. ko는 기존 4개 유지. `SEED_PRESETS_BY_LOCALE` + `createPresetSeedEntries(nowIso, locale)`.
2. **미지원 언어 fallback을 ko→en 전환** (`DEFAULT_LOCALE = 'en'`) — UI·프리셋 항상 일치. `docs/POLICY-HISTORY.md` 2026-07-16 행 참고.
3. **죽은 `trainingTemplates` 카피 삭제** — SEED_PRESETS 분기가 SSoT로 확정되어 승격 대신 제거.
4. 오디오: `assets/audio/ko-kr/` 이동 완료, `assets/audio/en-us/` 4개 파일(default_Hello/Hi/Kiss/I-love-you.m4a)은 추가 대기 — 파일 도착 후 커밋 예정.

잔여 확인(사람): en 오디오 파일 추가 + 시뮬레이터 검증(신규 설치 en/ko, 업그레이드, 재생).

**2026-07-16 — 계획 변경 (같은 날 정정):**

en 프리셋 음원을 출시 전에 확보하지 않기로 하여 **en 로케일은 프리셋을 시드하지 않는 것으로 변경** (`SEED_PRESETS_BY_LOCALE.en = []`). en 오디오 파일 4개·`assets/audio/en-us/` 불필요. 빈 목록은 empty state 카피가 안내. 향후 영어 음원이 확보되면 `en-*` 접두 키 규칙으로 이 이슈를 재개. `docs/POLICY-HISTORY.md` 2026-07-16 정정 행 참고.

**2026-07-17 — 최종 결정 (재정정):**

**프리셋은 언어 설정과 무관하게 ko 고정** — 시드 로케일 분기를 제거하고 평면 `SEED_PRESETS`(한국어 4개)로 복귀. 영어 UI 사용자도 한국어 프리셋(안녕/사과/사랑해/다녀와)을 받는다. 언어 전환은 UI에만 적용. 향후 로케일별 프리셋이 다시 필요해지면 이 이슈 재개 (`en-*` 접두 키 + `assets/audio/en-us/` 규칙 재사용).
