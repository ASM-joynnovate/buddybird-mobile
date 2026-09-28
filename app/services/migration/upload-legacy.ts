import { postParrot, putParrotPhoto } from '@/apis/parrots';
import { postWord, postWordRecording } from '@/apis/words';

import { ApiError } from '@/types/apis/common';

import type { LegacyMigration, LegacySettings } from '@/types/device-settings';

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

type LegacyUpload = { profile: LegacyProfile | null; words: LegacyWord[] };

type WordProgress = LegacyMigration['wordProgress'][string];

const LEGACY_KEY_PREFIXES = ['@buddybird/', '@pethub/'] as const;

let pendingUpload: LegacyUpload | null = null;
let uploadPromise: Promise<void> | undefined;

function getLegacyMigration(): LegacyMigration {
	return useDeviceSettingsStore.getState().legacyMigration;
}

function setLegacyMigration(updater: (migration: LegacyMigration) => LegacyMigration) {
	useDeviceSettingsStore.getState().updateLegacyMigration(updater);
}

function tryParseLegacy<T>(scope: string, parse: () => T): T | undefined {
	try {
		return parse();
	} catch (error) {
		reportError(error, `legacy_${scope}`);

		return undefined;
	}
}

async function readLegacyValues(): Promise<LegacyValueReader> {
	const keys = (await AsyncStorage.getAllKeys()).filter((key) =>
		LEGACY_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)),
	);
	const values = new Map(await AsyncStorage.multiGet(keys));

	return (key) =>
		LEGACY_KEY_PREFIXES.map((prefix) => values.get(`${prefix}${key}`)).find(
			(value): value is string => typeof value === 'string',
		);
}

function readJson(read: LegacyValueReader, key: string): unknown {
	const raw = read(key);

	return raw === undefined ? undefined : JSON.parse(raw);
}

function readSettings(read: LegacyValueReader): LegacySettings {
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
}

function readUpload(read: LegacyValueReader): LegacyUpload {
	const profile = tryParseLegacy('profile', () => {
		const value = readJson(read, 'parrot-profile');

		return value == null ? null : parseLegacyProfile(value);
	});
	const words = tryParseLegacy('words', () => {
		const value = readJson(read, 'wordLibrary');

		return value == null ? [] : parseLegacyWords(requireRecord(value, 'wordLibrary'));
	});

	return { profile: profile ?? null, words: words ?? [] };
}

export async function loadLegacy(): Promise<void> {
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
}

export function hasLegacyUpload(): boolean {
	return pendingUpload !== null;
}

export function acceptLegacyUpload() {
	setLegacyMigration((migration) => ({ ...migration, uploadStatus: 'started' }));
}

export function finishLegacyUpload() {
	pendingUpload = null;

	setLegacyMigration((migration) => ({ ...migration, uploadStatus: 'finished' }));
}

function isInsideApp(uri: string): boolean {
	return [Paths.document.uri, Paths.cache.uri].some((root) => uri.startsWith(root)) && !uri.split('/').includes('..');
}

async function existingFileUri(uri: string, scope: string): Promise<string | null> {
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
	} catch (error) {
		reportError(error, scope);
	}

	return null;
}

/** 이름이 같은 키를 뺀 멱등키 목록 */
const withoutIdempotencyKey = (idempotencyKeys: LegacyMigration['idempotencyKeys'], idempotencyKeyName: string) =>
	Object.fromEntries(Object.entries(idempotencyKeys).filter(([savedKeyName]) => savedKeyName !== idempotencyKeyName));

/** 저장된 멱등키 반환, 없으면 새 키를 저장한 뒤 반환 */
const ensureIdempotencyKey = (idempotencyKeyName: string) => {
	const idempotencyKey = getLegacyMigration().idempotencyKeys[idempotencyKeyName] ?? randomUUID();

	setLegacyMigration((migration) => ({
		...migration,
		idempotencyKeys: { ...migration.idempotencyKeys, [idempotencyKeyName]: idempotencyKey },
	}));

	return idempotencyKey;
};

/** 서버가 거부한 요청의 멱등키 삭제 */
const removeRejectedIdempotencyKey = (error: unknown, idempotencyKeyName: string) => {
	if (!(error instanceof ApiError) || !error.rejected) {
		return;
	}

	setLegacyMigration((migration) => ({
		...migration,
		idempotencyKeys: withoutIdempotencyKey(migration.idempotencyKeys, idempotencyKeyName),
	}));
};

/** v1 앵무새와 사진 올리기 */
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

function recordWordProgress(legacyWordId: string, progress: WordProgress) {
	setLegacyMigration((migration) => ({
		...migration,
		wordProgress: { ...migration.wordProgress, [legacyWordId]: progress },
	}));
}

/** v1 단어와 녹음 올리기 */
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

export function uploadLegacy(): Promise<void> {
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
}
