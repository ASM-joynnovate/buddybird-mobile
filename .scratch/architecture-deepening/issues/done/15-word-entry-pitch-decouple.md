# WordEntry ↔ PitchTransformMetadata 타입 디커플

Status: done
Type: refactor (scope: word-library)
Source: architecture review 2회차 — 후보 3b (Worth)

## 마이그레이션 불필요 (triage 해소)

앱이 아직 미배포 상태이며 기존 저장 데이터와의 호환은 버려도 된다(사용자 확정, 2026-06-21). 따라서 저장 스키마 변경에 따른 AsyncStorage 데이터 마이그레이션·하위호환 읽기가 필요 없다. 기존 needs-triage 사유(마이그레이션 설계)가 해소되어 `ready-for-agent` 로 승격한다 — 순수 타입/코드 변경으로 진행한다.

## What to build

`WordEntry` / `TrainingWord` 가 오디오 도메인 타입 `PitchTransformMetadata` 를 **직접 소유**(`pitchTransform?: PitchTransformMetadata`)해, 단어 라이브러리가 오디오 도메인에 타입으로 결합돼 있다. 오디오 pitch 변환 형태가 바뀌면 단어 entry 가 영향받고, word-library 를 오디오 도메인 없이 추론/테스트하기 어렵다.

`PitchTransformMetadata` 에 이미 `profileId` 가 있으므로, `WordEntry` 는 `pitchProfileId?: string` 같은 불투명 참조만 들고, 실제 pitch 메타데이터 해석은 오디오 도메인(또는 #09 `AudioSourceResolver`)이 소유하도록 역전한다.

기존 저장 데이터 호환은 고려하지 않는다(미배포). 저장 형식이 바뀌어도 마이그레이션/폴백 읽기 코드를 추가하지 말 것 — 새 스키마로 단순화한다. 단, #01~#03 에서 seam 이 커버하던 오디오 URI 영속(특히 #09 가 추가한 중첩 `pitchTransform.transformedUri`)이 새 구조에서 어떻게 정규화/hydration 되는지는 일관되게 유지한다(URI stale 방지 invariant 보존).

## Acceptance criteria

- [ ] `WordEntry`/`TrainingWord` 가 `PitchTransformMetadata` 를 직접 소유하지 않고 참조(`pitchProfileId` 등)만 보유
- [ ] pitch 메타데이터 해석 책임이 오디오 도메인으로 이동(word-library 의 audio 타입 import 제거)
- [ ] 오디오 URI 영속 invariant 유지(절대 URI 미저장, 재빌드 후 stale 방지) — 새 구조에 맞게 seam 선언 정합
- [ ] 마이그레이션/하위호환 코드 없음(미배포 — 새 스키마로 단순화)
- [ ] `yarn lint && yarn typecheck` 그린

## Blocked by

- #09 (AudioSourceResolver) — 이미 머지됨. pitch 해석을 오디오 도메인이 소유한 뒤라 word-library 에서 타입 분리가 자연스럽다.
