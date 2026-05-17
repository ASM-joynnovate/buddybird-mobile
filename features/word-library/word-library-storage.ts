import AsyncStorage from '@react-native-async-storage/async-storage';

import { reportError } from '@/features/analytics/error-reporter';
import { hydrateAudioUriFromStorage, normalizeAudioUriForStorage } from '@/features/audio/audio-file-storage';

import type { WordEntry, WordLibraryStore } from './word-library-types';

export const WORD_LIBRARY_STORAGE_KEY = '@pethub/wordLibrary';

export async function loadWordLibraryStore(): Promise<WordLibraryStore> {
  const raw = await AsyncStorage.getItem(WORD_LIBRARY_STORAGE_KEY);

  if (!raw) {
    return { version: 1, entriesById: {}, updatedAt: new Date().toISOString() };
  }

  try {
    const parsed = JSON.parse(raw) as WordLibraryStore;
    return hydrateWordLibraryStore(parsed);
  } catch (error: unknown) {
    reportError(error, { scope: 'word-library.loadStore' });
    return { version: 1, entriesById: {}, updatedAt: new Date().toISOString() };
  }
}

export async function saveWordLibraryStore(store: WordLibraryStore): Promise<void> {
  const normalized = normalizeWordLibraryStoreForStorage(store);
  await AsyncStorage.setItem(WORD_LIBRARY_STORAGE_KEY, JSON.stringify(normalized));
}

function normalizeWordLibraryStoreForStorage(store: WordLibraryStore): WordLibraryStore {
  return {
    ...store,
    entriesById: mapEntries(store.entriesById, normalizeEntryForStorage),
  };
}

function hydrateWordLibraryStore(store: WordLibraryStore): WordLibraryStore {
  return {
    ...store,
    entriesById: mapEntries(store.entriesById, hydrateEntry),
  };
}

function normalizeEntryForStorage(entry: WordEntry): WordEntry {
  return {
    ...entry,
    audioUri: normalizeAudioUriForStorage(entry.audioUri) ?? entry.audioUri,
    transformedAudioUri: normalizeAudioUriForStorage(entry.transformedAudioUri),
  };
}

function hydrateEntry(entry: WordEntry): WordEntry {
  return {
    ...entry,
    audioUri: hydrateAudioUriFromStorage(entry.audioUri) ?? entry.audioUri,
    transformedAudioUri: hydrateAudioUriFromStorage(entry.transformedAudioUri),
  };
}

function mapEntries(
  entries: Record<string, WordEntry>,
  transform: (entry: WordEntry) => WordEntry,
): Record<string, WordEntry> {
  return Object.fromEntries(Object.entries(entries).map(([id, entry]) => [id, transform(entry)]));
}
