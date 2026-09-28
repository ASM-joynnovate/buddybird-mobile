import type { z } from 'zod';

import { MMKV } from 'react-native-mmkv';
import type { PersistOptions, StateStorage } from 'zustand/middleware';

interface RestoreError {
	error: unknown;
	storeName: string;
}

interface RestoreTarget<S> {
	schema: z.ZodType<Partial<S>>;
	storeName: string;
}

let restoreErrors: readonly RestoreError[] = [];

export function mmkvStorage(id: string): StateStorage {
	const storage = new MMKV({ id });

	return {
		getItem: (name) => storage.getString(name) ?? null,
		setItem: (name, value) => storage.set(name, value),
		removeItem: (name) => storage.delete(name),
	};
}

function recordRestoreError(error: unknown, storeName: string) {
	restoreErrors = [...restoreErrors, { error, storeName }];
}

export function restoreOptions<S>({
	schema,
	storeName,
}: RestoreTarget<S>): Pick<PersistOptions<S>, 'merge' | 'onRehydrateStorage'> {
	return {
		merge: (persisted, current) => {
			if (persisted === undefined) {
				return current;
			}

			const parsed = schema.safeParse(persisted);

			if (!parsed.success) {
				recordRestoreError(parsed.error, storeName);

				return current;
			}

			return { ...current, ...parsed.data };
		},

		onRehydrateStorage: () => (_state, error) => {
			if (error) {
				recordRestoreError(error, storeName);
			}
		},
	};
}

export function takeRestoreErrors(): readonly RestoreError[] {
	const errors = restoreErrors;

	restoreErrors = [];

	return errors;
}
