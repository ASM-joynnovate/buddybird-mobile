import type { z } from 'zod';

import { MMKV } from 'react-native-mmkv';

interface RestoreError {
	error: unknown;
	storeName: string;
}

interface RestoreTarget<S> {
	schema: z.ZodType<Partial<S>>;
	storeName: string;
}

let restoreErrors: readonly RestoreError[] = [];

/** zustand persist에 넘길 MMKV 저장소 */
export const mmkvStorage = (id: string) => {
	const storage = new MMKV({ id });

	return {
		getItem: (name: string) => storage.getString(name) ?? null,
		setItem: (name: string, value: string) => storage.set(name, value),
		removeItem: (name: string) => storage.delete(name),
	};
};

/** 저장값 복원 실패 기록 */
const recordRestoreError = (error: unknown, storeName: string) => {
	restoreErrors = [...restoreErrors, { error, storeName }];
};

/** 저장값을 스키마로 검사해 복원하고 복원 실패를 기록하는 persist 옵션 */
export const restoreOptions = <S>({ schema, storeName }: RestoreTarget<S>) => {
	return {
		merge: (persisted: unknown, currentState: S) => {
			if (persisted === undefined) {
				return currentState;
			}

			const parsed = schema.safeParse(persisted);

			if (!parsed.success) {
				recordRestoreError(parsed.error, storeName);

				return currentState;
			}

			return { ...currentState, ...parsed.data };
		},

		onRehydrateStorage: () => (_state: S | undefined, error: unknown) => {
			if (error) {
				recordRestoreError(error, storeName);
			}
		},
	};
};

/** 모아 둔 복원 실패 목록을 돌려주고 비우기 */
export const takeRestoreErrors = () => {
	const errors = restoreErrors;

	restoreErrors = [];

	return errors;
};
