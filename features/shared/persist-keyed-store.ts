import AsyncStorage from '@react-native-async-storage/async-storage';

import { reportError } from '@/features/analytics/error-reporter';

/**
 * AsyncStorage 한 키에 대한 read/write seam.
 *
 * `getItem → null-check → JSON.parse → parse` 형태와 에러 처리(reportError + fallback)를
 * 한곳에 모은다. 각 도메인 storage 모듈은 자신의 `parse`(검증·hydration)와 `fallback`(기본값),
 * 필요 시 `serialize`(정규화)만 주입한다.
 */
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
}

export interface KeyedStore<T> {
  load(): Promise<T>;
  save(value: T): Promise<void>;
}

export function persistKeyedStore<T>(config: PersistKeyedStoreConfig<T>): KeyedStore<T> {
  const { key, scope, parse, fallback, serialize } = config;

  return {
    async load(): Promise<T> {
      const raw = await AsyncStorage.getItem(key);

      if (raw === null) {
        return fallback();
      }

      try {
        const parsed: unknown = JSON.parse(raw);
        return parse(parsed);
      } catch (error: unknown) {
        reportError(error, { scope });
        return fallback();
      }
    },

    async save(value: T): Promise<void> {
      const payload = serialize ? serialize(value) : value;
      await AsyncStorage.setItem(key, JSON.stringify(payload));
    },
  };
}
