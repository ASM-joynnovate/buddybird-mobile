import AsyncStorage from '@react-native-async-storage/async-storage';

import { reportError } from '@/features/analytics/error-reporter';

import type { WordLibraryStore } from './word-library-types';

export const WORD_LIBRARY_STORAGE_KEY = '@pethub/wordLibrary';

export async function loadWordLibraryStore(): Promise<WordLibraryStore> {
  const raw = await AsyncStorage.getItem(WORD_LIBRARY_STORAGE_KEY);

  if (!raw) {
    return { version: 1, entriesById: {}, updatedAt: new Date().toISOString() };
  }

  try {
    return JSON.parse(raw) as WordLibraryStore;
  } catch (error: unknown) {
    reportError(error, { scope: 'word-library.loadStore' });
    return { version: 1, entriesById: {}, updatedAt: new Date().toISOString() };
  }
}

export async function saveWordLibraryStore(store: WordLibraryStore): Promise<void> {
  await AsyncStorage.setItem(WORD_LIBRARY_STORAGE_KEY, JSON.stringify(store));
}
