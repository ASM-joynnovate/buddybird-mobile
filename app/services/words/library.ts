import { randomUUID } from "expo-crypto"

import { preserveRecording } from "@/services/media/files"
import { readData, updateData } from "@/services/storage/data-store"
import { Word } from "@/types/word"

export async function saveWord(input: {
	label: string
	tag: Word["tag"]
	recordingUri: string
	id?: string
}): Promise<Word> {
	const label = input.label.trim()

	if (!label || !["greeting", "food", "name", "etc"].includes(input.tag)) {
		throw new Error("Word and category are required")
	}

	const existing = input.id ? readData().words[input.id] : undefined

	if (input.id && (!existing || existing.archived || existing.sourceType !== "recording")) {
		throw new Error("Word cannot be edited")
	}

	const audioUri = await preserveRecording(input.recordingUri)
	const now = new Date().toISOString()
	const word: Word = {
		id: existing?.id ?? `wentry-${now}-${randomUUID().slice(0, 8)}`,
		createdAt: existing?.createdAt ?? now,
		updatedAt: now,
		label,
		tag: input.tag,
		sourceType: "recording",
		audioUri,
	}

	updateData((data) => {
		if (existing?.audioUri) {
			data.pendingFileDeletes.push(existing.audioUri)
		}

		data.words[word.id] = word
		const metrics = data.settings.wordMetrics[word.id]

		data.settings.wordMetrics[word.id] = {
			word_id: word.id,
			word_name: word.label,
			lifetime_practice_count: metrics?.lifetime_practice_count ?? 0,
			lifetime_practice_duration_ms: metrics?.lifetime_practice_duration_ms ?? 0,
			lifetime_recording_count: (metrics?.lifetime_recording_count ?? 0) + 1,
			last_practiced_at_iso: metrics?.last_practiced_at_iso ?? null,
		}

		if (!data.pendingWords.includes(word.id)) {
			data.pendingWords.push(word.id)
		}
	})

	return word
}

export function removeWord(id: string) {
	const metrics = { lifetime_practice_count: 0, lifetime_practice_duration_ms: 0 }

	updateData((data) => {
		const word = data.words[id]

		if (!word || word.archived || word.sourceType !== "recording") {
			throw new Error("Word cannot be deleted")
		}

		const metricIds = Object.keys(data.settings.wordMetrics).filter(
			(key) => key === id || data.wordAliases[key] === id,
		)

		for (const key of metricIds) {
			const item = data.settings.wordMetrics[key]

			metrics.lifetime_practice_count += item.lifetime_practice_count
			metrics.lifetime_practice_duration_ms += item.lifetime_practice_duration_ms
			delete data.settings.wordMetrics[key]
		}

		word.archived = true
		word.updatedAt = new Date().toISOString()
		data.pendingWords = data.pendingWords.filter((value) => value !== id)
		// Historical snapshots and queued captures still retain their referenced files.
		data.pendingFileDeletes.push(word.audioUri)

		if (word.transformedAudioUri) {
			data.pendingFileDeletes.push(word.transformedAudioUri)
		}
	})

	return metrics
}
