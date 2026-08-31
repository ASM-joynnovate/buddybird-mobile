import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { reportError } from '@/features/analytics/error-reporter';
import { useI18n } from '@/features/i18n/i18n-context';

import {
  createWordEntry,
  deleteWordEntry,
  filterEntriesByLocale,
  reconcilePresetSeeds,
  upsertWordEntry,
} from './word-library-model';
import { loadWordLibraryStore, saveWordLibraryStore } from './word-library-storage';
import type { CreateWordEntryInput, WordEntry, WordLibraryStore } from './word-library-types';
import { requestWordUpload } from './word-upload';

interface WordLibraryContextValue {
  entries: WordEntry[];
  isHydrated: boolean;
  errorMessage: string | null;
  createEntry: (input: CreateWordEntryInput) => Promise<WordEntry>;
  deleteEntry: (id: string) => Promise<void>;
}

const WordLibraryContext = createContext<WordLibraryContextValue | null>(null);

export function WordLibraryProvider({ children }: PropsWithChildren) {
  const [store, setStore] = useState<WordLibraryStore | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const storeRef = useRef<WordLibraryStore | null>(null);
  const writeQueueRef = useRef<Promise<void> | null>(null);
  const { t, locale } = useI18n();

  const setLibraryState = useCallback((nextStore: WordLibraryStore): void => {
    const cloned: WordLibraryStore = { ...nextStore, entriesById: cloneRecord(nextStore.entriesById) };
    storeRef.current = cloned;
    setStore(cloned);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function hydrate(): Promise<void> {
      try {
        const loaded = await loadWordLibraryStore();

        if (!isMounted) return;

        // 프리셋은 삭제 불가 — 빈 스토어 최초 시드와 과거 삭제된 프리셋 복원을 정합화로 함께 처리.
        const nowIso = new Date().toISOString();
        const { store: reconciled, changed } = reconcilePresetSeeds(loaded, nowIso);
        if (changed) {
          await saveWordLibraryStore(reconciled);
        }
        setLibraryState(reconciled);
      } catch (error: unknown) {
        reportError(error, { scope: 'word-library.hydrate' });
        if (isMounted) {
          // 메시지는 렌더 시점에 t()로 해석해 인앱 언어 전환에도 즉시 따라간다.
          setLoadFailed(true);
          setLibraryState({ version: 1, entriesById: {}, updatedAt: new Date().toISOString() });
        }
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    }

    hydrate();

    return () => {
      isMounted = false;
    };
  }, [setLibraryState]);

  const enqueueWrite = useCallback((operation: () => Promise<void>): Promise<void> => {
    const nextWrite = (writeQueueRef.current ?? Promise.resolve()).then(operation, operation);
    // queue를 깨지 않기 위해 reject를 swallow한다. 호출자에게는 nextWrite로 reject가 전파됨.
    writeQueueRef.current = nextWrite.catch((error: unknown) => {
      reportError(error, { scope: 'word-library.writeQueue' });
    });
    return nextWrite;
  }, []);

  const updateStore = useCallback(
    async (update: (current: WordLibraryStore, nowIso: string) => WordLibraryStore): Promise<void> =>
      enqueueWrite(async () => {
        const current = storeRef.current;
        if (!current) throw new Error('단어 라이브러리가 아직 준비되지 않았습니다.');
        const nowIso = new Date().toISOString();
        const next = update(current, nowIso);
        await saveWordLibraryStore(next);
        setLibraryState(next);
      }),
    [enqueueWrite, setLibraryState]
  );

  const createEntry = useCallback(
    async (input: CreateWordEntryInput): Promise<WordEntry> => {
      const nowIso = new Date().toISOString();
      const entry = createWordEntry(input, nowIso);
      await updateStore((current, iso) => upsertWordEntry(current, entry, iso));
      // 업로드 트리거 ① (SPEC-0003): 단어 생성 — 게이트가 저장소를 읽으므로 영속화 후에 건다.
      // 프리셋 단어는 서버가 시드하므로 보내지 않는다.
      if (entry.sourceType === 'recording') requestWordUpload(entry.id);
      return entry;
    },
    [updateStore]
  );

  const deleteEntry = useCallback(
    async (id: string): Promise<void> => {
      await updateStore((current, nowIso) => deleteWordEntry(current, id, nowIso));
    },
    [updateStore]
  );

  // 표시 전용 로케일 필터 (BB-407) — 스토어/영속/reconcile 은 전 로케일 유니온을 그대로 유지한다.
  const entries = useMemo(
    () => (store ? filterEntriesByLocale(Object.values(store.entriesById), locale) : []),
    [store, locale]
  );

  const value = useMemo(
    () => ({
      entries,
      isHydrated,
      errorMessage: loadFailed ? t('wordLibrary.loadError') : null,
      createEntry,
      deleteEntry,
    }),
    [entries, isHydrated, loadFailed, t, createEntry, deleteEntry]
  );

  return <WordLibraryContext.Provider value={value}>{children}</WordLibraryContext.Provider>;
}

function cloneRecord<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, { ...v }])) as Record<string, T>;
}

export function useWordLibrary(): WordLibraryContextValue {
  const ctx = use(WordLibraryContext);
  if (!ctx) throw new Error('useWordLibrary must be used inside WordLibraryProvider');
  return ctx;
}
