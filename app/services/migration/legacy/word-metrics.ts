import { AppData } from "@/types/app-data"
import {
	ObjectValue,
	readNullableText,
	requireNonnegativeNumber,
	requireRecord,
	requireText,
} from "@/utils/validation"

export function applyLegacyMetrics(data: AppData, metrics: ObjectValue | undefined) {
	if (metrics) {
		for (const [id, value] of Object.entries(metrics)) {
			const wordMetrics = requireRecord(value, `metrics ${id}`)

			data.settings.wordMetrics[id] = {
				word_id: requireText(wordMetrics.word_id, "word_id"),
				word_name: requireText(wordMetrics.word_name, "word_name"),
				lifetime_practice_count: requireNonnegativeNumber(
					wordMetrics.lifetime_practice_count,
					"lifetime_practice_count",
				),
				lifetime_practice_duration_ms: requireNonnegativeNumber(
					wordMetrics.lifetime_practice_duration_ms,
					"lifetime_practice_duration_ms",
				),
				lifetime_recording_count: requireNonnegativeNumber(
					wordMetrics.lifetime_recording_count,
					"lifetime_recording_count",
				),
				last_practiced_at_iso: readNullableText(
					wordMetrics.last_practiced_at_iso,
					"last_practiced_at_iso",
				),
			}
		}
	}
}

/** Move derived totals, leaving the legacy archive and historical IDs untouched. */
export function mergeAliasedMetrics(data: AppData) {
	let changed = false

	for (const [id, canonicalId] of Object.entries(data.wordAliases)) {
		const source = data.settings.wordMetrics[id]

		if (id === canonicalId || !source) {
			continue
		}

		const target = data.settings.wordMetrics[canonicalId]
		const practicedAt = [source.last_practiced_at_iso, target?.last_practiced_at_iso]
			.filter((date): date is string => Boolean(date))
			.sort()

		data.settings.wordMetrics[canonicalId] = {
			word_id: canonicalId,
			word_name: data.words[canonicalId]?.label ?? target?.word_name ?? source.word_name,
			lifetime_practice_count:
				(target?.lifetime_practice_count ?? 0) + source.lifetime_practice_count,
			lifetime_practice_duration_ms:
				(target?.lifetime_practice_duration_ms ?? 0) + source.lifetime_practice_duration_ms,
			lifetime_recording_count:
				(target?.lifetime_recording_count ?? 0) + source.lifetime_recording_count,
			last_practiced_at_iso: practicedAt.at(-1) ?? null,
		}
		delete data.settings.wordMetrics[id]
		changed = true
	}

	return changed
}
