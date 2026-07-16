# 프리셋 단어 콘텐츠 로컬라이즈 여부 결정

Status: needs-triage

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
