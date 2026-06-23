# profile·fcm storage를 persist seam으로 마이그레이션

Status: done
Type: refactor (scope: persist)
Source: architecture review 2회차 — 후보 5 (Worth exploring)

## What to build

#01~#03 으로 깊어진 `persistKeyedStore`(AsyncStorage 단일 키 read/write seam, parse/fallback/recover 소유)가 있는데도 두 storage 모듈이 여전히 직접 `getItem → JSON.parse → 검증` 을 손으로 반복한다:

- `profile-storage`: seam 미사용, 실패 시 `throw ProfileStorageError`
- `fcm-storage`: seam 미사용, 두 키(registration / message receipts), guard + `null`/`[]` fallback

두 모듈을 `persistKeyedStore` 경유로 이관해, storage 모듈이 parse·fallback·recover 만 선언하는 얇은 모듈이 되게 한다. 손상 로드 표면화(recover 훅)를 seam 한 곳으로 일관화한다. fcm 은 키가 2개이므로 각 키마다 seam 인스턴스를 둔다.

(참고: `word-metrics-storage` 는 이미 seam 을 쓰므로 본 슬라이스 범위 밖 — parse 강화는 #12 에서 별도.)

## Acceptance criteria

- [ ] `profile-storage`, `fcm-storage`(registration·receipts)가 `persistKeyedStore` 를 경유
- [ ] 각 모듈은 parse(검증)·fallback·필요 시 recover 만 주입, 직접 `AsyncStorage`/`JSON.parse` 호출 제거
- [ ] 손상/검증 실패 시 보고·복구 전략이 seam 으로 일관화(기존 throw/null/[] 의 의미 보존)
- [ ] 저장 키·데이터 형식·기존 로드 동작 보존(마이그레이션 불필요한 호환 유지)
- [ ] `docs/SHARED-MODULES.md` 갱신, `yarn lint && yarn typecheck` 그린

## Blocked by

None - can start immediately
