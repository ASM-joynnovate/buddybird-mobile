import { reportError } from '@/services/telemetry/client';
import { type ObjectValue, requireChoice, requireRecord, requireText } from '@/utils/validation';

export type LegacyWord = { id: string; name: string; audioUri: string };

function parseLegacyWord(value: unknown, id: string): LegacyWord | null {
	const record = requireRecord(value, `word ${id}`);
	const sourceType = requireChoice(record.sourceType, ['preset', 'recording'] as const, 'sourceType');

	if (sourceType === 'preset' || record.archived === true) {
		return null;
	}

	return {
		id,
		name: requireText(record.label, 'label'),
		audioUri: requireText(record.audioUri, 'audioUri'),
	};
}

export function parseLegacyWords(library: ObjectValue): LegacyWord[] {
	if (library.version !== 1) {
		throw new Error('Unsupported word library version');
	}

	return Object.entries(requireRecord(library.entriesById, 'entriesById')).flatMap(([id, value]) => {
		try {
			const word = parseLegacyWord(value, id);

			return word ? [word] : [];
		} catch (error) {
			reportError(error, 'legacy_word');

			return [];
		}
	});
}
