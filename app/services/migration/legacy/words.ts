import { reportError } from '@/services/telemetry/client';
import { requireChoice, requireRecord, requireText, type UnknownRecord } from '@/utils/validation';

export type LegacyWord = { id: string; name: string; audioUri: string };

function parseLegacyWord(value: unknown, id: string): LegacyWord | null {
	const wordRecord = requireRecord(value, `word ${id}`);
	const sourceType = requireChoice(wordRecord.sourceType, ['preset', 'recording'] as const, 'sourceType');

	if (sourceType === 'preset' || wordRecord.archived === true) {
		return null;
	}

	return {
		id,
		name: requireText(wordRecord.label, 'label'),
		audioUri: requireText(wordRecord.audioUri, 'audioUri'),
	};
}

export function parseLegacyWords(library: UnknownRecord): LegacyWord[] {
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
