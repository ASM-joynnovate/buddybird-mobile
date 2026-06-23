# 녹음/프리뷰를 RecordingSession seam으로 합성

Status: done
Type: refactor (scope: audio)
Source: architecture review 2회차 — 후보 2 (Strong)

## What to build

`useAudioRecording`(9개 상태 반환)과 `useAudioPreview`(6개 상태)가 너무 많은 상태를 노출해, 단어 편집/생성 모달이 **여러 오디오 hook 인스턴스를 동시에 들고 명령형으로 손배선**한다(예: "재녹음 시작하면 기존 entry 재생 정지"). 녹음 lifecycle 이 컴포넌트 조건문에 흩어지고, `RecordingFormCard` 는 12개 prop 을 받는다.

녹음 lifecycle·metering·파일 영속·상태→라벨 매핑을 소유하는 `RecordingSession` seam 을 만들어, 컴포넌트가 `useRecordingSession()` 하나만 소비하는 stateless 뷰가 되게 한다. "사용자가 녹음 중·재생 가능·재설정 가능" 이라는 개념을 한 곳에 모은다.

인터페이스(권장): `useRecordingSession() → { state, metering, file, actions: { start, stop, reset }, ui: { statusLabel, isRecording, canPlayback } }`. 상태→라벨 매핑(현재 두 모달이 제각각 계산)을 seam 안에서 한 번만 한다.

## Acceptance criteria

- [ ] 녹음 lifecycle·metering·파일 영속·상태→라벨 매핑이 단일 seam(`RecordingSession`)으로 합성됨
- [ ] 단어 생성/편집 모달이 여러 오디오 hook 을 직접 조율하지 않고 seam 하나를 소비(명령형 동기화 제거)
- [ ] `RecordingFormCard` 의 prop drilling 축소(상태는 seam, 콜백만 전달)
- [ ] 녹음·재생·재녹음 전환 동작 보존(기존 entry 재생/신규 녹음/신규 재생 상호 배타 동작 유지)
- [ ] 오디오 소스 정규화·preset 해석은 #09 `AudioSourceResolver` 를 경유(재구현 금지)
- [ ] `docs/SHARED-MODULES.md` 갱신, `yarn lint && yarn typecheck` 그린

## Blocked by

- #09 (AudioSourceResolver) — soft 선행. 하드 블록은 아니나, 녹음 파일 정규화/preset 해석이 resolver 위에 얹히면 churn 이 적다.
