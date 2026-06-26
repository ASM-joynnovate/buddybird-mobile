# 오디오 소스 변환을 AudioSourceResolver로 통합 + 중첩 URI 커버

Status: done
Type: refactor (scope: audio)
Source: architecture review 2회차 — 후보 3 (Strong)

## What to build

오디오 URI 변환 책임이 세 곳에 흩어져 있다: persist seam(`persist-keyed-store`)이 normalize/hydrate 를, `word-library-preset-audio` 가 preset→module 매핑을, 컴포넌트(`word-row` 등)가 `preset://` 판별을 또 재구현한다. 이를 단일 `AudioSourceResolver` 모듈로 모아 "오디오 소스를 어떻게 해석하나"의 single source of truth 를 만든다.

함께 해결할 **실제 버그**: `WordEntry.pitchTransform` / `TrainingWord.pitchTransform`(둘 다 AsyncStorage 에 저장됨) 안의 `PitchTransformMetadata.transformedUri?: string` 는 오디오 URI 인데, 현재 `audioUriCollections` 는 flat 필드(`audioUri`, `transformedAudioUri`)만 normalize/hydrate 한다. 즉 **중첩 경로 `pitchTransform.transformedUri` 가 변환되지 않아** 재빌드/재설치 후 iOS 컨테이너 UUID 변경 시 stale 절대 URI 로 남아 재생이 깨질 수 있다. seam 의 컬렉션 선언이 중첩 경로(예: `'pitchTransform.transformedUri'`)를 지원하도록 확장하거나, resolver 가 이 변환을 소유하게 한다.

인터페이스(권장): `resolveSource(entry) → { uri, isPreset }`, `normalizeForStorage`, `hydrateFromStorage`(preset→module 매핑 포함). 호출부(word-row, word-edit, training setup)는 resolver 만 소비한다.

## Acceptance criteria

- [ ] preset→module 매핑·`recording://` 정규화·storage hydration 이 단일 모듈로 통합됨
- [ ] `word-row` 등에 중복된 `preset://` 판별/preset 모듈 재해석 로직 제거
- [ ] 중첩 `pitchTransform.transformedUri` 가 저장 시 normalize / 로드 시 hydrate 되도록 커버(stale 버그 해소)
- [ ] 기존 top-level 필드(`audioUri`/`transformedAudioUri`/recording `originalUri`/`transformedUri`) 변환 동작 보존
- [ ] `docs/SHARED-MODULES.md` 의 오디오 관련 행 갱신
- [ ] `yarn lint && yarn typecheck` 그린

## Blocked by

None - can start immediately
