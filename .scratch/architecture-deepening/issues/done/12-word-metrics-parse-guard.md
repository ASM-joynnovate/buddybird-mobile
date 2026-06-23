# word-metrics storage parse guard 강화

Status: done
Type: refactor (scope: analytics)
Source: architecture review 2회차 — 후보 5 (Worth exploring)

## What to build

`word-metrics-storage` 는 이미 `persistKeyedStore` 를 사용하지만, `parseWordMetricsMap` 이 `raw as WordMetricsMap` 타입 단언만 하고 **필드 검증을 건너뛴다**. 손상되거나 형식이 어긋난 메트릭이 silent 하게 로드될 수 있고, fallback 은 `() => ({})` 라 손상 시 전체 유실된다.

parse 를 entry 단위 guard 로 강화해, 유효한 `WordLifetimeMetrics` 항목만 통과시키고 손상 항목은 걸러내는 **부분 복구**를 가능하게 한다. training-storage/validation 이 쓰는 검증 수준에 맞춘다. seam 은 이미 쓰고 있으므로 parse 함수 교체가 핵심이며, 필요 시 `recover` 훅으로 손상 표면화.

## Acceptance criteria

- [ ] `parseWordMetricsMap` 이 `as` 단언 대신 entry 단위 type guard 로 검증(유효 항목만 통과, 손상 항목 제외)
- [ ] 부분 손상 시 전체 유실이 아니라 유효 항목 보존(가능한 범위에서 부분 복구)
- [ ] 손상 감지 시 보고 경로 일관(seam reportError/recover 활용)
- [ ] 기존 정상 데이터 로드 동작·메트릭 형식 보존
- [ ] `yarn lint && yarn typecheck` 그린

## Blocked by

None - can start immediately
