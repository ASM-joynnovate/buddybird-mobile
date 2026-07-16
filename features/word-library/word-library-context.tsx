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

import { createPresetSeedEntries, createWordEntry, deleteWordEntry, upsertWordEntry } from './word-library-model';
import { loadWordLibraryStore, saveWordLibraryStore } from './word-library-storage';
import type { CreateWordEntryInput, WordEntry, WordLibraryStore } from './word-library-types';

interface WordLibraryContextValue {
  entries: WordEntry[];
  isHydrated: boolean;
  errorMessage: string | null;
  createEntry: (input: CreateWordEntryInput) => Promise<WordEntry>;
  updateEntry: (entry: WordEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

const WordLibraryContext = createContext<WordLibraryContextValue | null>(null);

export function WordLibraryProvider({ children }: PropsWithChildren) {
  const [store, setStore] = useState<WordLibraryStore | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const storeRef = useRef<WordLibraryStore | null>(null);
  const writeQueueRef = useRef<Promise<void> | null>(null);
  const { t, locale } = useI18n();
  // hydrate effect가 t/locale 변경에 재실행되지 않도록 ref로 고정
  // (인앱 언어 전환이 없어 로케일은 실행 중 고정)
  const tRef = useRef(t);
  tRef.current = t;
  const localeRef = useRef(locale);
  localeRef.current = locale;

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

        const nowIso = new Date().toISOString();
        const seeds =
          Object.keys(loaded.entriesById).length === 0
            ? createPresetSeedEntries(nowIso, localeRef.current)
            : [];
        if (seeds.length > 0) {
          const seeded: WordLibraryStore = {
            ...loaded,
            entriesById: Object.fromEntries(seeds.map((s) => [s.id, s])),
            updatedAt: nowIso,
          };
          await saveWordLibraryStore(seeded);
          setLibraryState(seeded);
        } else {
          // 시드할 프리셋이 없는 로케일(en)은 빈 store 를 저장하지 않는다 — 매 실행 재저장 방지.
          setLibraryState(loaded);
        }
      } catch (error: unknown) {
        reportError(error, { scope: 'word-library.hydrate' });
        if (isMounted) {
          setErrorMessage(tRef.current('wordLibrary.loadError'));
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
      return entry;
    },
    [updateStore]
  );

  const updateEntry = useCallback(
    async (entry: WordEntry): Promise<void> => {
      await updateStore((current, nowIso) => upsertWordEntry(current, entry, nowIso));
    },
    [updateStore]
  );

  const deleteEntry = useCallback(
    async (id: string): Promise<void> => {
      await updateStore((current, nowIso) => deleteWordEntry(current, id, nowIso));
    },
    [updateStore]
  );

  const entries = useMemo(
    () => (store ? Object.values(store.entriesById).sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : []),
    [store]
  );

  const value = useMemo(
    () => ({ entries, isHydrated, errorMessage, createEntry, updateEntry, deleteEntry }),
    [entries, isHydrated, errorMessage, createEntry, updateEntry, deleteEntry]
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
