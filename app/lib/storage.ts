import { accountV2Schema } from '@/types/account';

import { z } from 'zod';

import { createMMKV } from 'react-native-mmkv';

export const storageIds = {
	device: 'buddybird.device',
} as const;

export const storeStorageKeys = {
	deviceSettings: { name: 'device-settings', version: 2 },
	auth: { name: 'auth', version: 1 },
	account: { name: 'account', version: 3 },
} as const;

const ACCOUNT_V2_VERSION = 2;

const accountV2ItemSchema = z.object({
	state: accountV2Schema,
	version: z.literal(ACCOUNT_V2_VERSION),
});

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
		/** 저장값 조회 함수 */
		getItem: (name: string) => storage.getString(name) ?? null,
		/** 저장 함수 */
		setItem: (name: string, value: string) => storage.set(name, value),
		/** 저장값 삭제 함수 */
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

/** account v2 저장값 조회 함수 */
const readAccountV2 = () => {
	const item = createMMKV({ id: storageIds.device }).getString(storeStorageKeys.account.name);

	if (item === undefined) {
		return null;
	}

	try {
		const parsed = accountV2ItemSchema.safeParse(JSON.parse(item));

		return parsed.success ? { item, state: parsed.data.state } : null;
	} catch (e) {
		recordRestoreError(e, storeStorageKeys.account.name);

		return null;
	}
};

/** 스토어를 만들기 전에 읽은 account v2 저장값 */
export const accountV2 = readAccountV2();

/** 기록한 복원 실패 목록을 반환하고 비우는 함수 */
export const takeRestoreErrors = () => {
	const errors = restoreErrors;

	restoreErrors = [];

	return errors;
};
