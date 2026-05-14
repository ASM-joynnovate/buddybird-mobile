import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { createPresetSeedEntries, createWordEntry, deleteWordEntry, upsertWordEntry } from './word-library-model';
import { loadWordLibraryStore, saveWordLibraryStore } from './word-library-storage';
import type { CreateWordEntryInput, WordEntry, WordLibraryStore } from './word-library-types';

interface WordLibraryContextValue {
  entries: WordEntry[];
  isHydrated: boolean;
  createEntry: (input: CreateWordEntryInput) => Promise<WordEntry>;
  updateEntry: (entry: WordEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

const WordLibraryContext = createContext<WordLibraryContextValue | null>(null);

export function WordLibraryProvider({ children }: PropsWithChildren) {
  const [store, setStore] = useState<WordLibraryStore | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const storeRef = useRef<WordLibraryStore | null>(null);
  const writeQueueRef = useRef(Promise.resolve());

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

        if (Object.keys(loaded.entriesById).length === 0) {
          const nowIso = new Date().toISOString();
          const seeds = createPresetSeedEntries(nowIso);
          const seeded: WordLibraryStore = {
            ...loaded,
            entriesById: Object.fromEntries(seeds.map((s) => [s.id, s])),
            updatedAt: nowIso,
          };
          await saveWordLibraryStore(seeded);
          setLibraryState(seeded);
        } else {
          setLibraryState(loaded);
        }
      } catch {
        if (isMounted) {
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
    const nextWrite = writeQueueRef.current.then(operation, operation);
    writeQueueRef.current = nextWrite.catch(() => undefined);
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
    () => ({ entries, isHydrated, createEntry, updateEntry, deleteEntry }),
    [entries, isHydrated, createEntry, updateEntry, deleteEntry]
  );

  return <WordLibraryContext.Provider value={value}>{children}</WordLibraryContext.Provider>;
}

function cloneRecord<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, { ...v }])) as Record<string, T>;
}

export function useWordLibrary(): WordLibraryContextValue {
  const ctx = useContext(WordLibraryContext);
  if (!ctx) throw new Error('useWordLibrary must be used inside WordLibraryProvider');
  return ctx;
}
