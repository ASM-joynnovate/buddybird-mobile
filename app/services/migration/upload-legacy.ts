import { postParrot, putParrotPhoto } from '@/apis/parrots';
import { postWord, postWordRecording } from '@/apis/words';

import { ApiError } from '@/types/apis/common';

import type { LegacyMigration } from '@/types/device-settings';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { Paths } from 'expo-file-system';

import { readFileInfo, resolveFileUri } from '@/services/media/file';
import { type LegacyWord, parseLegacyWords } from '@/services/migration/legacy/words';
import { reportError } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import {
	type LegacyProfile,
	parseLegacyAppUpdate,
	parseLegacyFeedbackPrompt,
	parseLegacyProfile,
} from '@/utils/legacy';
import { requireChoice, requireRecord } from '@/utils/validation';

type LegacyValueReader = (key: string) => string | undefined;

interface LegacyUpload {
	profile: LegacyProfile | null;
	words: LegacyWord[];
}

type WordProgress = LegacyMigration['wordProgress'][string];

const LEGACY_KEY_PREFIXES = ['@buddybird/', '@pethub/'] as const;

let pendingUpload: LegacyUpload | null = null;
let uploadPromise: Promise<void> | undefined;

/** 저장한 v1 업로드 진행 상태 */
const getLegacyMigration = () => {
	return useDeviceSettingsStore.getState().legacyMigration;
};

/** v1 업로드 진행 상태 갱신 함수 */
const setLegacyMigration = (updater: (migration: LegacyMigration) => LegacyMigration) => {
	useDeviceSettingsStore.getState().updateLegacyMigration(updater);
};

/** v1 값을 읽는 함수 */
const tryParseLegacy = <T>(scope: string, parse: () => T) => {
	try {
		return parse();
	} catch (e) {
		reportError(e, `legacy_${scope}`);

		return undefined;
	}
};

/** AsyncStorage의 v1 값을 모두 읽는 함수 */
const readLegacyValues = async () => {
	const keys = (await AsyncStorage.getAllKeys()).filter((key) =>
		LEGACY_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)),
	);
	const values = new Map(await AsyncStorage.multiGet(keys));

	return (key: string) =>
		LEGACY_KEY_PREFIXES.map((prefix) => values.get(`${prefix}${key}`)).find((value) => typeof value === 'string');
};

/** v1 값을 JSON으로 읽는 함수 */
const readJson = (read: LegacyValueReader, key: string) => {
	const raw = read(key);

	return raw === undefined ? undefined : (JSON.parse(raw) as unknown);
};

/** v1 설정 값을 읽는 함수 */
const readSettings = (read: LegacyValueReader) => {
	const locale = tryParseLegacy('locale', () => {
		const raw = read('locale');

		if (raw === undefined) {
			return undefined;
		}

		return requireChoice(raw, ['ko', 'en'] as const, 'locale') === 'ko' ? ('ko-KR' as const) : ('en-US' as const);
	});
	const analyticsConsent = tryParseLegacy('analytics_consent', () => {
		const raw = read('analytics-consent');

		return raw === undefined
			? undefined
			: requireChoice(raw, ['unknown', 'granted', 'denied', 'not_applicable'] as const, 'analytics consent');
	});
	const appUpdate = tryParseLegacy('app_update', () => {
		const value = readJson(read, 'app-update');

		return value === undefined ? undefined : parseLegacyAppUpdate(requireRecord(value, 'app-update'));
	});
	const feedbackPrompt = tryParseLegacy('feedback', () => {
		const value = readJson(read, 'feedback-prompt');

		return value === undefined ? undefined : parseLegacyFeedbackPrompt(requireRecord(value, 'feedback-prompt'));
	});

	return {
		...(locale && { locale }),
		...(analyticsConsent && { analyticsConsent }),
		...(appUpdate && { updatePrompt: appUpdate }),
		...(feedbackPrompt && { feedbackPrompt }),
	};
};

/** 서버에 업로드할 v1 데이터를 읽는 함수 */
const readUpload = (read: LegacyValueReader) => {
	const profile = tryParseLegacy('profile', () => {
		const value = readJson(read, 'parrot-profile');

		return value == null ? null : parseLegacyProfile(value);
	});
	const words = tryParseLegacy('words', () => {
		const value = readJson(read, 'wordLibrary');

		return value == null ? [] : parseLegacyWords(requireRecord(value, 'wordLibrary'));
	});

	return { profile: profile ?? null, words: words ?? [] };
};

/** v1 데이터 불러오기 함수 */
export const loadLegacy = async () => {
	const migration = getLegacyMigration();

	if (migration.settingsImported && migration.uploadStatus === 'finished') {
		return;
	}

	const read = await readLegacyValues();

	if (!migration.settingsImported) {
		useDeviceSettingsStore.getState().importLegacySettings(readSettings(read));
	}

	if (migration.uploadStatus === 'finished') {
		return;
	}

	const legacyUpload = readUpload(read);

	if (legacyUpload.profile === null && legacyUpload.words.length === 0) {
		finishLegacyUpload();

		return;
	}

	pendingUpload = legacyUpload;
};

/** 업로드할 v1 데이터가 있는지 확인하는 함수 */
export const hasLegacyUpload = () => {
	return pendingUpload !== null;
};

/** v1 데이터 업로드 시작 상태 저장 함수 */
export const acceptLegacyUpload = () => {
	setLegacyMigration((migration) => ({ ...migration, uploadStatus: 'started' }));
};

/** v1 데이터 업로드 완료 상태 저장 함수 */
export const finishLegacyUpload = () => {
	pendingUpload = null;

	setLegacyMigration((migration) => ({ ...migration, uploadStatus: 'finished' }));
};

/** 주소가 앱 폴더 안에 있는지 확인하는 함수 */
const isInsideApp = (uri: string) => {
	return [Paths.document.uri, Paths.cache.uri].some((root) => uri.startsWith(root)) && !uri.split('/').includes('..');
};

/** 업로드할 수 있는 v1 파일의 주소를 반환하는 함수 */
const existingFileUri = async (uri: string, scope: string) => {
	try {
		const resolved = resolveFileUri(uri);

		if (!isInsideApp(resolved)) {
			reportError(new Error('Legacy file is outside the app'), scope);

			return null;
		}

		const fileInfo = readFileInfo(uri);

		if (fileInfo.exists && fileInfo.size > 0) {
			return resolved;
		}

		reportError(new Error('Legacy file is missing'), scope);
	} catch (e) {
		reportError(e, scope);
	}

	return null;
};

/** 이름이 같은 idempotency key를 제외하는 함수 */
const withoutIdempotencyKey = (idempotencyKeys: LegacyMigration['idempotencyKeys'], idempotencyKeyName: string) =>
	Object.fromEntries(Object.entries(idempotencyKeys).filter(([savedKeyName]) => savedKeyName !== idempotencyKeyName));

/** 저장된 idempotency key를 반환하고, 없으면 새로 만드는 함수 */
const ensureIdempotencyKey = (idempotencyKeyName: string) => {
	const idempotencyKey = getLegacyMigration().idempotencyKeys[idempotencyKeyName] ?? randomUUID();

	setLegacyMigration((migration) => ({
		...migration,
		idempotencyKeys: { ...migration.idempotencyKeys, [idempotencyKeyName]: idempotencyKey },
	}));

	return idempotencyKey;
};

/** 서버가 거부한 요청의 idempotency key 삭제 함수 */
const removeRejectedIdempotencyKey = (error: unknown, idempotencyKeyName: string) => {
	if (!(error instanceof ApiError) || !error.rejected) {
		return;
	}

	setLegacyMigration((migration) => ({
		...migration,
		idempotencyKeys: withoutIdempotencyKey(migration.idempotencyKeys, idempotencyKeyName),
	}));
};

/** v1 앵무새 업로드 함수 */
const uploadParrot = async (profile: LegacyProfile) => {
	const idempotencyKeyName = 'parrot';
	const parrotId =
		getLegacyMigration().parrotId ??
		(
			await postParrot({
				data: { name: profile.name, species: profile.species, birthdate: profile.birthDate },
				idempotencyKey: ensureIdempotencyKey(idempotencyKeyName),
			}).catch((error: unknown) => {
				removeRejectedIdempotencyKey(error, idempotencyKeyName);

				throw error;
			})
		).id;

	setLegacyMigration((migration) => ({
		...migration,
		parrotId,
		idempotencyKeys: withoutIdempotencyKey(migration.idempotencyKeys, idempotencyKeyName),
	}));

	if (!profile.photoUri || getLegacyMigration().photoUploaded) {
		return;
	}

	const photoUri = await existingFileUri(profile.photoUri, 'legacy_photo');

	if (photoUri) {
		await putParrotPhoto({ id: parrotId, uri: photoUri, idempotencyKey: randomUUID() });
	}

	setLegacyMigration((migration) => ({ ...migration, photoUploaded: true }));
};

/** v1 단어 업로드 진행 상태 저장 함수 */
const recordWordProgress = (legacyWordId: string, progress: WordProgress) => {
	setLegacyMigration((migration) => ({
		...migration,
		wordProgress: { ...migration.wordProgress, [legacyWordId]: progress },
	}));
};

/** v1 단어 업로드 함수 */
const uploadWord = async (word: LegacyWord) => {
	const savedProgress = getLegacyMigration().wordProgress[word.id];

	if (savedProgress?.done) {
		return;
	}

	const recordingUri = await existingFileUri(word.audioUri, 'legacy_recording');

	if (!recordingUri) {
		recordWordProgress(word.id, { wordId: savedProgress?.wordId ?? null, done: true });

		return;
	}

	const idempotencyKeyName = `word:${word.id}`;
	const wordId =
		savedProgress?.wordId ??
		(
			await postWord({
				data: { name: word.name },
				idempotencyKey: ensureIdempotencyKey(idempotencyKeyName),
			}).catch((error: unknown) => {
				removeRejectedIdempotencyKey(error, idempotencyKeyName);

				throw error;
			})
		).id;

	setLegacyMigration((migration) => ({
		...migration,
		wordProgress: { ...migration.wordProgress, [word.id]: { wordId, done: false } },
		idempotencyKeys: withoutIdempotencyKey(migration.idempotencyKeys, idempotencyKeyName),
	}));

	await postWordRecording({ id: wordId, uri: recordingUri, idempotencyKey: randomUUID() });

	recordWordProgress(word.id, { wordId, done: true });
};

/** v1 데이터 업로드 함수 */
export const uploadLegacy = () => {
	uploadPromise ??= (async () => {
		const legacyUpload = pendingUpload;

		if (!legacyUpload) {
			return;
		}

		acceptLegacyUpload();

		if (legacyUpload.profile) {
			await uploadParrot(legacyUpload.profile);
		}

		for (const word of legacyUpload.words) {
			await uploadWord(word);
		}
	})().finally(() => {
		uploadPromise = undefined;
	});

	return uploadPromise;
};
