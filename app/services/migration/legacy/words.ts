import { reportError } from '@/services/telemetry/client';
import { requireChoice, requireRecord, requireText, type UnknownRecord } from '@/utils/validation';

export interface LegacyWord {
	id: string;
	name: string;
	audioUri: string;
}

/** v1 단어를 업로드할 단어로 변환하는 함수 */
const parseLegacyWord = (value: unknown, id: string) => {
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
};

/** v1 단어 목록에서 업로드할 단어 목록을 만드는 함수 */
export const parseLegacyWords = (library: UnknownRecord) => {
	if (library.version !== 1) {
		throw new Error('Unsupported word library version');
	}

	return Object.entries(requireRecord(library.entriesById, 'entriesById')).flatMap(([id, value]) => {
		try {
			const word = parseLegacyWord(value, id);

			return word ? [word] : [];
		} catch (e) {
			reportError(e, 'legacy_word');

			return [];
		}
	});
};
