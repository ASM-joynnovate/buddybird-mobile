import type { z } from 'zod';

import { createMMKV } from 'react-native-mmkv';

interface RestoreError {
	error: unknown;
	storeName: string;
}

interface RestoreTarget<S> {
	schema: z.ZodType<Partial<S>>;
	storeName: string;
}

let restoreErrors: readonly RestoreError[] = [];

/** zustand persist에 사용할 MMKV 저장소 */
export const mmkvStorage = (id: string) => {
	const storage = createMMKV({ id });

	return {
		getItem: (name: string) => storage.getString(name) ?? null,
		setItem: (name: string, value: string) => storage.set(name, value),
		removeItem: (name: string) => storage.remove(name),
	};
};

/** 저장값 복원 실패 기록 함수 */
const recordRestoreError = (error: unknown, storeName: string) => {
	restoreErrors = [...restoreErrors, { error, storeName }];
};

/** 저장값을 스키마로 검사해 복원하는 persist 옵션 */
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

/** 기록한 복원 실패 목록을 반환하고 비우는 함수 */
export const takeRestoreErrors = () => {
	const errors = restoreErrors;

	restoreErrors = [];

	return errors;
};
