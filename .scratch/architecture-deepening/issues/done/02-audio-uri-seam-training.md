# training store를 심화된 오디오 URI seam으로 이관

Status: done
Type: refactor (scope: audio, training)
Source: architecture review — 후보 1 (Strong)

## What to build

#01에서 심화한 영속 seam 위로 `training-storage`(`features/training/training-storage.ts`)를 이관한다. training store는 `TrainingWord`(audioUri/transformedAudioUri)와 `AudioRecording`(originalUri/transformedUri) 두 종류의 오디오 URI 필드를 가지므로, 심화된 seam이 record-of-records와 다중 필드를 처리할 수 있어야 한다(필요 시 #01의 인터페이스를 이 케이스까지 일반화).

이 슬라이스에서:
- `training-storage`를 심화된 seam 경유로 바꾸고, 손수 만든 `normalizeWordForStorage` / `hydrateWord` / `normalizeRecordingForStorage` / `hydrateRecording` / `mapRecord` 를 삭제한다.
- 기존의 `parseStoredTrainingStore` 검증과 `TrainingStorageError` 발생 동작(손상 시 throw)은 보존한다 — word-library와 달리 training은 fallback이 아니라 throw임에 유의.

## Acceptance criteria

- [ ] `training-storage`가 심화된 seam을 경유하고, `normalizeWordForStorage`/`hydrateWord`/`normalizeRecordingForStorage`/`hydrateRecording`/`mapRecord`가 제거됨
- [ ] `TrainingWord`와 `AudioRecording`의 모든 오디오 URI 필드가 seam을 통해 normalize/hydrate 됨
- [ ] 손상 데이터 시 기존대로 `TrainingStorageError` throw, `parseStoredTrainingStore` 검증 유지
- [ ] 녹음 포함 세션 저장 → 앱 재빌드 → 세션/녹음 재생이 stale URI 없이 정상 동작(수동 확인)
- [ ] `yarn lint && yarn typecheck` 그린, 기존 동작 보존

## Blocked by

- #01 (오디오 URI 영속 seam 심화 + word-library store 이관)
