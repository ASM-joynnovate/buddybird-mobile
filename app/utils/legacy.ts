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

export type LegacyProfile = {
	name: string;
	species: string;
	birthDate: string | null;
	photoUri?: string;
};

export function parseLegacyAppUpdate(appUpdate: UnknownRecord): DeviceSettings['updatePrompt'] {
	return {
		dismissedVersion: readNullableText(appUpdate.dismissedVersion, 'dismissedVersion'),
	};
}

export function parseLegacyFeedbackPrompt(feedbackPrompt: UnknownRecord): DeviceSettings['feedbackPrompt'] {
	if (feedbackPrompt.version !== 1) {
		throw new Error('Unsupported feedback version');
	}

	return {
		formatVersion: 1,
		lastCountedDate: readNullableText(feedbackPrompt.lastCountedDate, 'lastCountedDate'),
		dayCount: requireNonnegativeNumber(feedbackPrompt.dayCount, 'dayCount'),
		thresholdIndex: requireNonnegativeNumber(feedbackPrompt.thresholdIndex, 'thresholdIndex'),
	};
}

export function parseLegacyProfile(value: unknown): LegacyProfile {
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
}
