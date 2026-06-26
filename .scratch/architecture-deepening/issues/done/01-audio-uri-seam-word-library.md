# 오디오 URI 영속 seam 심화 + word-library store 이관

Status: done
Type: refactor (scope: audio, words)
Source: architecture review — 후보 1 (Strong, Top recommendation)

## What to build

오디오 URI의 `normalize`(저장 직전) / `hydrate`(로드 직후) 변환을 각 storage 모듈이 직접 호출해야 하는 "의무"에서, 영속 seam이 **자동으로 소유**하는 구조로 바꾼다. 첫 store(word-library)를 그 심화된 seam 위로 끝까지 이관한다.

현재 `persistKeyedStore`(`features/shared/persist-keyed-store.ts`)는 `getItem → JSON.parse → parse / fallback / serialize`를 한곳에 모은 deep seam이지만, 3개 store 중 `word-metrics-storage`만 사용한다. `word-library-storage`는 `AsyncStorage`를 직접 굴리고 `normalizeEntryForStorage` / `hydrateEntry` / `mapEntries`로 오디오 URI 변환을 손수 재구현한다.

이 슬라이스에서:
- `persistKeyedStore`(또는 그 위의 얇은 helper)가 "선언된 오디오 URI 필드 목록"을 받아 load 시 hydrate, save 시 normalize를 자동 적용하도록 인터페이스를 확장한다. 호출자는 어떤 필드가 오디오 URI인지만 선언한다.
- `word-library-storage`를 그 seam 위로 이관하고, 손수 만든 `normalizeEntryForStorage` / `hydrateEntry` / `mapEntries` 및 직접 `AsyncStorage` 호출을 삭제한다.
- `preset://` pass-through, 손상 시 `fallback`, 빈 store 기본값 등 기존 동작은 보존한다.

prefactor(seam 확장)와 첫 이관을 한 슬라이스로 묶어 end-to-end로 검증 가능하게 한다.

## Acceptance criteria

- [ ] `persistKeyedStore` 계층이 선언된 필드의 오디오 URI normalize/hydrate를 소유하며, 호출자는 normalize/hydrate를 직접 호출하지 않는다
- [ ] `word-library-storage`가 심화된 seam을 경유하고, `normalizeEntryForStorage`/`hydrateEntry`/`mapEntries`와 직접 `AsyncStorage` 호출이 제거됨
- [ ] `preset://` URI는 변환 대상에서 제외(pass-through), 손상 데이터는 기존처럼 `fallback` 반환
- [ ] 녹음 생성 → 앱 재빌드 → 단어 라이브러리 재생이 stale URI 없이 정상 동작(수동 확인)
- [ ] `yarn lint && yarn typecheck` 그린, 기존 동작 보존
- [ ] SHARED-MODULES §6.1 의 영향 범위를 본 PR 본문에 메모(문서 본 갱신은 #03)

## Blocked by

None - can start immediately
