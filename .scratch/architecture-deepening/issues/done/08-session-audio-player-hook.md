# 세션 오디오 재생을 useSessionAudioPlayer로 추출

Status: done
Type: refactor (scope: training)
Source: architecture review 2회차 — 후보 1 (Strong)

## What to build

#05 가 세션 라이프사이클을 순수 reducer 로 빼냈지만, `use-active-session` 에는 두 번째 상태머신인 **오디오 재생**이 그대로 남아 hook 이 여전히 ~230줄이다. 오디오 재생 관심사 전체(플레이어 생성, 재생 setup, 무음 갭 재replay, cleanup, silence 타이머)를 `useSessionAudioPlayer` 한 모듈로 추출해, 세션 hook 은 reducer 전이(dispatch)와 파생값만 노출하는 진짜 얇은 hook 으로 만든다.

추출 대상은 세션 phase/status 에 반응하는 오디오 재생 lifecycle 이다:
- 학습(learning) phase + running 일 때만 재생, 그 외 일시정지
- 재생 종료(didJustFinish) 후 무음 갭만큼 기다렸다가 다시 재생(루프 대체)
- 언마운트 시 안전한 정지(이미 teardown 된 네이티브 플레이어 호출 방지)

인터페이스(권장): `useSessionAudioPlayer({ audioUri, phase, status }) → { audioOn }`. 세션 전이·cycle 파생은 hook 에 남고, 오디오 재생은 이 모듈이 단독 소유한다.

## Acceptance criteria

- [ ] 오디오 재생 lifecycle(재생/일시정지/무음 갭 재생/cleanup)이 단일 모듈로 추출되고 React effect 가 그 안에 응집됨
- [ ] `use-active-session` 이 세션 전이(reducer dispatch) + 파생값 노출로 축소됨(오디오 effect 가 hook 에서 사라짐)
- [ ] `audioOn` 등 기존 result 필드와 외부 계약(UseActiveSessionResult) 보존 — 소비처 무변경
- [ ] 재생 동작·무음 갭 타이밍·번들 모듈/녹음 파일 분기·missing-file 가드 동작 보존
- [ ] `yarn lint && yarn typecheck` 그린, 세션 진행/일시정지/완료 시 재생 동작 수동 확인

## Blocked by

None - can start immediately
