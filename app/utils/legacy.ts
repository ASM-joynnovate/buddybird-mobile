import type { DeviceSettings } from '@/types/device-settings';

import dayjs from 'dayjs';

import {
	type ObjectValue,
	readNullableText,
	readOptionalText,
	requireNonnegativeNumber,
	requireRecord,
	requireText,
} from '@/utils/validation';

export type LegacyProfile = {
	name: string;
	species: string;
	birthDate: string | null;
	photoUri?: string;
};

export function parseLegacyUpdate(update: ObjectValue): DeviceSettings['updatePrompt'] {
	return {
		dismissedVersion: readNullableText(update.dismissedVersion, 'dismissedVersion'),
	};
}

export function parseLegacyFeedback(feedback: ObjectValue): DeviceSettings['feedbackPrompt'] {
	if (feedback.version !== 1) {
		throw new Error('Unsupported feedback version');
	}

	return {
		formatVersion: 1,
		lastCountedDate: readNullableText(feedback.lastCountedDate, 'lastCountedDate'),
		dayCount: requireNonnegativeNumber(feedback.dayCount, 'dayCount'),
		thresholdIndex: requireNonnegativeNumber(feedback.thresholdIndex, 'thresholdIndex'),
	};
}

export function parseLegacyProfile(value: unknown): LegacyProfile {
	const profileRecord = requireRecord(value, 'profile');
	let birthDate =
		profileRecord.birthDate === undefined ? null : readNullableText(profileRecord.birthDate, 'birthDate');

	if (profileRecord.birthDate === undefined && profileRecord.ageMonths !== undefined) {
		const date = dayjs(requireText(profileRecord.createdAt, 'parrot.createdAt'));
		const age = requireNonnegativeNumber(profileRecord.ageMonths, 'ageMonths');

		if (!Number.isInteger(age) || !date.isValid()) {
			throw new Error('Invalid historical profile age');
		}

		const birth = date.subtract(age, 'month');

		birthDate = birth.startOf('month').format('YYYY-MM-DD');
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
