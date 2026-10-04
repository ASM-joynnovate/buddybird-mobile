import type { DeviceSettings } from '@/types/device-settings';

import dayjs from 'dayjs';

import {
	readNullableText,
	readOptionalText,
	requireNonnegativeNumber,
	requireRecord,
	requireText,
	type UnknownRecord,
} from '@/utils/validation';

export interface LegacyProfile {
	name: string;
	species: string;
	birthDate: string | null;
	photoUri?: string;
}

/** v1 업데이트 안내 값에서 닫은 버전을 읽는 함수 */
export const parseLegacyAppUpdate = (appUpdate: UnknownRecord) => {
	return {
		dismissedVersion: readNullableText(appUpdate.dismissedVersion, 'dismissedVersion'),
	};
};

/** v1 피드백 요청 값을 현재 형식으로 변환하는 함수 */
export const parseLegacyFeedbackPrompt = (feedbackPrompt: UnknownRecord): DeviceSettings['feedbackPrompt'] => {
	if (feedbackPrompt.version !== 1) {
		throw new Error('Unsupported feedback version');
	}

	return {
		formatVersion: 1,
		lastCountedDate: readNullableText(feedbackPrompt.lastCountedDate, 'lastCountedDate'),
		dayCount: requireNonnegativeNumber(feedbackPrompt.dayCount, 'dayCount'),
		thresholdIndex: requireNonnegativeNumber(feedbackPrompt.thresholdIndex, 'thresholdIndex'),
	};
};

/** v1 앵무새 프로필 변환 함수 */
export const parseLegacyProfile = (value: unknown) => {
	const profileRecord = requireRecord(value, 'profile');
	let birthDate =
		profileRecord.birthDate === undefined ? null : readNullableText(profileRecord.birthDate, 'birthDate');

	if (profileRecord.birthDate === undefined && profileRecord.ageMonths !== undefined) {
		const createdAt = dayjs(requireText(profileRecord.createdAt, 'parrot.createdAt'));
		const ageMonths = requireNonnegativeNumber(profileRecord.ageMonths, 'ageMonths');

		if (!Number.isInteger(ageMonths) || !createdAt.isValid()) {
			throw new Error('Invalid historical profile age');
		}

		const birthMonth = createdAt.subtract(ageMonths, 'month');

		birthDate = birthMonth.startOf('month').format('YYYY-MM-DD');
	}

	let species = requireText(profileRecord.species, 'species');

	if (species === 'parakeet') {
		species = 'budgie';
	}

	if (species === 'custom' && typeof profileRecord.customSpecies === 'string' && profileRecord.customSpecies.trim()) {
		species = profileRecord.customSpecies.trim();
	}

	return {
		name: requireText(profileRecord.name, 'parrot.name'),
		species,
		birthDate,
		photoUri: readOptionalText(profileRecord.photoUri, 'photoUri'),
	};
};
