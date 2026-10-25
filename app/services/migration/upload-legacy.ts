import { ApiError } from '@/types/apis/common';

import { analyticsConsents } from '@/types/analytics-consent';
import type { LegacyMigration } from '@/types/device-settings';
import type { LegacyProfile } from '@/types/legacy';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { Paths } from 'expo-file-system';

import { readFileInfo, resolveFileUri } from '@/services/media/file';
import { type LegacyWord, parseLegacyWords } from '@/services/migration/legacy/words';
import { reportError } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { parseLegacyAppUpdate, parseLegacyFeedbackPrompt, parseLegacyProfile } from '@/utils/legacy';
import { requireChoice, requireRecord } from '@/utils/validation';

type LegacyValueReader = (key: string) => string | undefined;

interface LegacyUpload {
	profile: LegacyProfile | null;
	words: LegacyWord[];
}

type WordProgress = LegacyMigration['wordProgress'][string];

const LEGACY_KEY_PREFIXES = ['@buddybird/', '@pethub/'] as const;

let pendingUpload: LegacyUpload | null = null;

/** 저장한 v1 업로드 진행 상태 */
export const getLegacyMigration = () => {
	return useDeviceSettingsStore.getState().legacyMigration;
};

/** v1 업로드 진행 상태 갱신 함수 */
export const setLegacyMigration = (updater: (migration: LegacyMigration) => LegacyMigration) => {
	useDeviceSettingsStore.getState().updateLegacyMigration(updater);
};

/** 실패하면 오류를 보고하는 v1 값 파싱 함수 */
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
	const legacyValues = new Map(await AsyncStorage.multiGet(keys));

	return (key: string) =>
		LEGACY_KEY_PREFIXES.map((prefix) => legacyValues.get(`${prefix}${key}`)).find(
			(legacyValue) => typeof legacyValue === 'string',
		);
};

/** v1 값을 JSON으로 읽는 함수 */
const readJson = (readLegacyValue: LegacyValueReader, key: string) => {
	const raw = readLegacyValue(key);

	return raw === undefined ? undefined : (JSON.parse(raw) as unknown);
};

/** v1 설정 값을 읽는 함수 */
const readSettings = (readLegacyValue: LegacyValueReader) => {
	const locale = tryParseLegacy('locale', () => {
		const raw = readLegacyValue('locale');

		if (raw === undefined) {
			return undefined;
		}

		return requireChoice(raw, ['ko', 'en'] as const, 'locale') === 'ko' ? ('ko-KR' as const) : ('en-US' as const);
	});
	const analyticsConsent = tryParseLegacy('analytics_consent', () => {
		const raw = readLegacyValue('analytics-consent');

		return raw === undefined ? undefined : requireChoice(raw, analyticsConsents, 'analytics consent');
	});
	const appUpdate = tryParseLegacy('app_update', () => {
		const appUpdateJson = readJson(readLegacyValue, 'app-update');

		return appUpdateJson === undefined
			? undefined
			: parseLegacyAppUpdate(requireRecord(appUpdateJson, 'app-update'));
	});
	const feedbackPrompt = tryParseLegacy('feedback', () => {
		const feedbackPromptJson = readJson(readLegacyValue, 'feedback-prompt');

		return feedbackPromptJson === undefined
			? undefined
			: parseLegacyFeedbackPrompt(requireRecord(feedbackPromptJson, 'feedback-prompt'));
	});

	return {
		...(locale && { locale }),
		...(analyticsConsent && { analyticsConsent }),
		...(appUpdate && { updatePrompt: appUpdate }),
		...(feedbackPrompt && { feedbackPrompt }),
	};
};

/** 서버에 업로드할 v1 데이터를 읽는 함수 */
const readUpload = (readLegacyValue: LegacyValueReader) => {
	const profile = tryParseLegacy('profile', () => {
		const profileJson = readJson(readLegacyValue, 'parrot-profile');

		return profileJson == null ? null : parseLegacyProfile(profileJson);
	});
	const words = tryParseLegacy('words', () => {
		const wordLibraryJson = readJson(readLegacyValue, 'wordLibrary');

		return wordLibraryJson == null ? [] : parseLegacyWords(requireRecord(wordLibraryJson, 'wordLibrary'));
	});

	return { profile: profile ?? null, words: words ?? [] };
};

/** v1 데이터 불러오기 함수 */
export const loadLegacy = async () => {
	const migration = getLegacyMigration();

	if (migration.settingsImported && migration.uploadStatus === 'finished') {
		return;
	}

	const readLegacyValue = await readLegacyValues();

	if (!migration.settingsImported) {
		useDeviceSettingsStore.getState().importLegacySettings(readSettings(readLegacyValue));
	}

	if (migration.uploadStatus === 'finished') {
		return;
	}

	const legacyUpload = readUpload(readLegacyValue);

	if (legacyUpload.profile === null && legacyUpload.words.length === 0) {
		finishLegacyUpload();

		return;
	}

	pendingUpload = legacyUpload;
};

/** 업로드할 v1 데이터를 반환하는 함수 */
export const getPendingLegacyUpload = () => {
	return pendingUpload;
};

/** v1 데이터 업로드 시작 상태 저장 함수 */
export const acceptLegacyUpload = () => {
	setLegacyMigration((prev) => ({ ...prev, uploadStatus: 'started' }));
};

/** v1 데이터 업로드 완료 상태 저장 함수 */
export const finishLegacyUpload = () => {
	pendingUpload = null;

	setLegacyMigration((prev) => ({ ...prev, uploadStatus: 'finished' }));
};

/** 주소가 앱 폴더 안에 있는지 확인하는 함수 */
const isInsideApp = (uri: string) => {
	return [Paths.document.uri, Paths.cache.uri].some((root) => uri.startsWith(root)) && !uri.split('/').includes('..');
};

/** 업로드할 수 있는 v1 파일의 주소를 반환하는 함수 */
export const existingFileUri = async (uri: string, scope: string) => {
	try {
		const resolvedUri = resolveFileUri(uri);

		if (!isInsideApp(resolvedUri)) {
			reportError(new Error('Legacy file is outside the app'), scope);

			return null;
		}

		const fileInfo = readFileInfo(uri);

		if (fileInfo.exists && fileInfo.size > 0) {
			return resolvedUri;
		}

		reportError(new Error('Legacy file is missing'), scope);
	} catch (e) {
		reportError(e, scope);
	}

	return null;
};

/** 이름이 같은 idempotency key 제외 함수 */
export const withoutIdempotencyKey = (
	idempotencyKeys: LegacyMigration['idempotencyKeys'],
	idempotencyKeyName: string,
) =>
	Object.fromEntries(Object.entries(idempotencyKeys).filter(([savedKeyName]) => savedKeyName !== idempotencyKeyName));

/** idempotency key 조회 및 생성 함수 */
export const ensureIdempotencyKey = (idempotencyKeyName: string) => {
	const idempotencyKey = getLegacyMigration().idempotencyKeys[idempotencyKeyName] ?? randomUUID();

	setLegacyMigration((prev) => ({
		...prev,
		idempotencyKeys: { ...prev.idempotencyKeys, [idempotencyKeyName]: idempotencyKey },
	}));

	return idempotencyKey;
};

/** 거부된 요청의 idempotency key 삭제 함수 */
export const removeRejectedIdempotencyKey = (error: unknown, idempotencyKeyName: string) => {
	if (!(error instanceof ApiError) || !error.rejected) {
		return;
	}

	setLegacyMigration((prev) => ({
		...prev,
		idempotencyKeys: withoutIdempotencyKey(prev.idempotencyKeys, idempotencyKeyName),
	}));
};

/** v1 단어 업로드 진행 상태 저장 함수 */
export const recordWordProgress = (legacyWordId: string, progress: WordProgress) => {
	setLegacyMigration((prev) => ({
		...prev,
		wordProgress: { ...prev.wordProgress, [legacyWordId]: progress },
	}));
};
