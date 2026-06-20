import AsyncStorage from '@react-native-async-storage/async-storage';

import { reportError } from '@/features/analytics/error-reporter';
import { hydrateAudioUriFields, normalizeAudioUriFields } from '@/features/audio/audio-file-storage';

/**
 * AsyncStorage 한 키에 대한 read/write seam.
 *
 * `getItem → null-check → JSON.parse → parse` 형태와 에러 처리(reportError + fallback)를
 * 한곳에 모은다. 각 도메인 storage 모듈은 자신의 `parse`(검증·hydration)와 `fallback`(기본값),
 * 필요 시 `serialize`(정규화)만 주입한다.
 *
 * 오디오 URI 영속은 seam이 직접 소유한다: `audioUriCollections`로 어떤 컬렉션의 어떤 필드가
 * 오디오 URI인지만 선언하면 load 직후 hydrate, save 직전 normalize가 자동 적용된다.
 * 호출자는 normalize/hydrate를 직접 호출하지 않는다.
 */
export interface AudioUriCollection {
  /** T 상의 컬렉션 필드명 — `Record<string, entry>` 형태여야 한다 (예: `entriesById`) */
  readonly collection: string;
  /** 각 entry에서 오디오 URI를 담는 필드명 목록 (예: `['audioUri', 'transformedAudioUri']`) */
  readonly fields: readonly string[];
}

export interface PersistKeyedStoreConfig<T> {
  /** AsyncStorage 키 (예: `@buddybird/...`) */
  readonly key: string;
  /** 로드 실패 시 reportError 에 붙는 scope */
  readonly scope: string;
  /** JSON.parse 결과(unknown)를 검증·hydration 하여 T 로 변환 */
  readonly parse: (raw: unknown) => T;
  /** 미저장·손상·검증 실패 시 반환할 기본값 */
  readonly fallback: () => T;
  /** write 직전 정규화. 미지정 시 값을 그대로 직렬화 */
  readonly serialize?: (value: T) => unknown;
  /** 선언 시 seam이 오디오 URI normalize(save)/hydrate(load)를 자동 소유 */
  readonly audioUriCollections?: readonly AudioUriCollection[];
}

export interface KeyedStore<T> {
  load(): Promise<T>;
  save(value: T): Promise<void>;
}

export function persistKeyedStore<T>(config: PersistKeyedStoreConfig<T>): KeyedStore<T> {
  const { key, scope, parse, fallback, serialize, audioUriCollections } = config;

  return {
    async load(): Promise<T> {
      const raw = await AsyncStorage.getItem(key);

      if (raw === null) {
        return fallback();
      }

      try {
        const parsed: unknown = JSON.parse(raw);
        return applyAudioCollections(parse(parsed), audioUriCollections, hydrateAudioUriFields);
      } catch (error: unknown) {
        reportError(error, { scope });
        return fallback();
      }
    },

    async save(value: T): Promise<void> {
      const normalized = applyAudioCollections(value, audioUriCollections, normalizeAudioUriFields);
      const payload = serialize ? serialize(normalized) : normalized;
      await AsyncStorage.setItem(key, JSON.stringify(payload));
    },
  };
}

type EntryFieldTransform = (entry: Record<string, unknown>, fields: readonly string[]) => Record<string, unknown>;

// 선언된 각 컬렉션(Record<string, entry>)의 모든 entry에 필드 변환을 적용한다.
// 입력은 절대 변경하지 않으며, 변경이 없으면 원본 참조를 그대로 반환한다.
function applyAudioCollections<T>(
  value: T,
  collections: readonly AudioUriCollection[] | undefined,
  transform: EntryFieldTransform,
): T {
  if (!collections || collections.length === 0 || !value || typeof value !== 'object') {
    return value;
  }

  let next: Record<string, unknown> | undefined;

  for (const { collection, fields } of collections) {
    const source = (value as Record<string, unknown>)[collection];
    if (!source || typeof source !== 'object') continue;

    const mapped = mapRecord(source as Record<string, unknown>, (entry) => transform(entry, fields));
    if (mapped === source) continue;

    next = next ?? { ...(value as Record<string, unknown>) };
    next[collection] = mapped;
  }

  return (next as T) ?? value;
}

function mapRecord(
  record: Record<string, unknown>,
  transform: (entry: Record<string, unknown>) => Record<string, unknown>,
): Record<string, unknown> {
  let next: Record<string, unknown> | undefined;

  for (const id of Object.keys(record)) {
    const entry = record[id];
    if (!entry || typeof entry !== 'object') continue;

    const transformed = transform(entry as Record<string, unknown>);
    if (transformed === entry) continue;

    next = next ?? { ...record };
    next[id] = transformed;
  }

  return next ?? record;
}
