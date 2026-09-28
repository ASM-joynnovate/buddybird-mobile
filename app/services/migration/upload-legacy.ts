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
import { type LegacyProfile, parseLegacyFeedback, parseLegacyProfile, parseLegacyUpdate } from '@/utils/legacy';
import { requireChoice, requireRecord } from '@/utils/validation';

type ReadLegacy = (key: string) => string | undefined;

type LegacyUpload = { profile: LegacyProfile | null; words: LegacyWord[] };

type WordProgress = LegacyMigration['wordProgress'][string];

const PREFIXES = ['@buddybird/', '@pethub/'] as const;

let pending: LegacyUpload | null = null;
let uploading: Promise<void> | undefined;

function migration(): LegacyMigration {
	return useDeviceSettingsStore.getState().legacyMigration;
}

function updateMigration(update: (current: LegacyMigration) => LegacyMigration) {
	useDeviceSettingsStore.getState().updateLegacyMigration(update);
}

function attempt<T>(scope: string, read: () => T): T | undefined {
	try {
		return read();
	} catch (error) {
		reportError(error, `legacy_${scope}`);

		return undefined;
	}
}

async function readLegacyValues(): Promise<ReadLegacy> {
	const keys = (await AsyncStorage.getAllKeys()).filter((key) => PREFIXES.some((prefix) => key.startsWith(prefix)));
	const values = new Map(await AsyncStorage.multiGet(keys));

	return (key) =>
		PREFIXES.map((prefix) => values.get(`${prefix}${key}`)).find(
			(value): value is string => typeof value === 'string',
		);
}

function readJson(read: ReadLegacy, key: string): unknown {
	const raw = read(key);

	return raw === undefined ? undefined : JSON.parse(raw);
}

function readSettings(read: ReadLegacy): LegacySettings {
	const locale = attempt('locale', () => {
		const raw = read('locale');

		if (raw === undefined) {
			return undefined;
		}

		return requireChoice(raw, ['ko', 'en'] as const, 'locale') === 'ko' ? ('ko-KR' as const) : ('en-US' as const);
	});
	const analyticsConsent = attempt('analytics_consent', () => {
		const raw = read('analytics-consent');

		return raw === undefined
			? undefined
			: requireChoice(raw, ['unknown', 'granted', 'denied', 'not_applicable'] as const, 'analytics consent');
	});
	const update = attempt('app_update', () => {
		const value = readJson(read, 'app-update');

		return value === undefined ? undefined : parseLegacyUpdate(requireRecord(value, 'app-update'));
	});
	const feedback = attempt('feedback', () => {
		const value = readJson(read, 'feedback-prompt');

		return value === undefined ? undefined : parseLegacyFeedback(requireRecord(value, 'feedback-prompt'));
	});

	return {
		...(locale && { locale }),
		...(analyticsConsent && { analyticsConsent }),
		...(update && { updatePrompt: update }),
		...(feedback && { feedbackPrompt: feedback }),
	};
}

function readUpload(read: ReadLegacy): LegacyUpload {
	const profile = attempt('profile', () => {
		const value = readJson(read, 'parrot-profile');

		return value == null ? null : parseLegacyProfile(value);
	});
	const words = attempt('words', () => {
		const value = readJson(read, 'wordLibrary');

		return value == null ? [] : parseLegacyWords(requireRecord(value, 'wordLibrary'));
	});

	return { profile: profile ?? null, words: words ?? [] };
}

export async function loadLegacy(): Promise<void> {
	const current = migration();

	if (current.settingsImported && current.uploadStatus === 'finished') {
		return;
	}

	const read = await readLegacyValues();

	if (!current.settingsImported) {
		useDeviceSettingsStore.getState().importLegacySettings(readSettings(read));
	}

	if (current.uploadStatus === 'finished') {
		return;
	}

	const upload = readUpload(read);

	if (upload.profile === null && upload.words.length === 0) {
		finishLegacyUpload();

		return;
	}

	pending = upload;
}

export function hasLegacyUpload(): boolean {
	return pending !== null;
}

export function acceptLegacyUpload() {
	updateMigration((current) => ({ ...current, uploadStatus: 'started' }));
}

export function finishLegacyUpload() {
	pending = null;

	updateMigration((current) => ({ ...current, uploadStatus: 'finished' }));
}

function isInsideApp(uri: string): boolean {
	return [Paths.document.uri, Paths.cache.uri].some((root) => uri.startsWith(root)) && !uri.split('/').includes('..');
}

async function existingFile(uri: string, scope: string): Promise<string | null> {
	try {
		const resolved = resolveFileUri(uri);

		if (!isInsideApp(resolved)) {
			reportError(new Error('Legacy file is outside the app'), scope);

			return null;
		}

		const info = readFileInfo(uri);

		if (info.exists && info.size > 0) {
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
	const idempotencyKey = migration().idempotencyKeys[idempotencyKeyName] ?? randomUUID();

	updateMigration((current) => ({
		...current,
		idempotencyKeys: { ...current.idempotencyKeys, [idempotencyKeyName]: idempotencyKey },
	}));

	return idempotencyKey;
};

/** 서버가 거부한 요청의 멱등키 삭제 */
const removeRejectedIdempotencyKey = (error: unknown, idempotencyKeyName: string) => {
	if (!(error instanceof ApiError) || !error.rejected) {
		return;
	}

	updateMigration((current) => ({
		...current,
		idempotencyKeys: withoutIdempotencyKey(current.idempotencyKeys, idempotencyKeyName),
	}));
};

/** v1 앵무새와 사진 올리기 */
const uploadParrot = async (profile: LegacyProfile) => {
	const idempotencyKeyName = 'parrot';
	const parrotId =
		migration().parrotId ??
		(
			await postParrot({
				data: { name: profile.name, species: profile.species, birthdate: profile.birthDate },
				idempotencyKey: ensureIdempotencyKey(idempotencyKeyName),
			}).catch((error: unknown) => {
				removeRejectedIdempotencyKey(error, idempotencyKeyName);

				throw error;
			})
		).id;

	updateMigration((current) => ({
		...current,
		parrotId,
		idempotencyKeys: withoutIdempotencyKey(current.idempotencyKeys, idempotencyKeyName),
	}));

	if (!profile.photoUri || migration().photoUploaded) {
		return;
	}

	const photoUri = await existingFile(profile.photoUri, 'legacy_photo');

	if (photoUri) {
		await putParrotPhoto({ id: parrotId, uri: photoUri, idempotencyKey: randomUUID() });
	}

	updateMigration((current) => ({ ...current, photoUploaded: true }));
};

function recordWordProgress(id: string, progress: WordProgress) {
	updateMigration((current) => ({ ...current, wordProgress: { ...current.wordProgress, [id]: progress } }));
}

/** v1 단어와 녹음 올리기 */
const uploadWord = async (word: LegacyWord) => {
	const savedProgress = migration().wordProgress[word.id];

	if (savedProgress?.done) {
		return;
	}

	const recordingUri = await existingFile(word.audioUri, 'legacy_recording');

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

	updateMigration((current) => ({
		...current,
		wordProgress: { ...current.wordProgress, [word.id]: { wordId, done: false } },
		idempotencyKeys: withoutIdempotencyKey(current.idempotencyKeys, idempotencyKeyName),
	}));

	await postWordRecording({ id: wordId, uri: recordingUri, idempotencyKey: randomUUID() });

	recordWordProgress(word.id, { wordId, done: true });
};

export function uploadLegacy(): Promise<void> {
	uploading ??= (async () => {
		const upload = pending;

		if (!upload) {
			return;
		}

		acceptLegacyUpload();

		if (upload.profile) {
			await uploadParrot(upload.profile);
		}

		for (const word of upload.words) {
			await uploadWord(word);
		}
	})().finally(() => {
		uploading = undefined;
	});

	return uploading;
}
