import { AppData } from "@/types/app-data"
import { Capture } from "@/types/capture"
import {
	ObjectValue,
	readNullableText,
	requireChoice,
	requireList,
	requireNonnegativeNumber,
	requireRecord,
	requireText,
} from "@/utils/validation"

export function applyLegacyCaptures(
	data: AppData,
	captures: ObjectValue | undefined,
	trainingWords: ObjectValue,
) {
	if (captures) {
		for (const [id, value] of Object.entries(
			requireRecord(captures.capturesById, "capturesById"),
		)) {
			const captureRecord = requireRecord(value, `capture ${id}`)

			if (captureRecord.id !== id) {
				throw new Error(`Capture key mismatch: ${id}`)
			}

			const wordId = requireText(captureRecord.wordId, "capture.wordId")
			const original = trainingWords[wordId]
				? requireRecord(trainingWords[wordId], "capture word")
				: data.words[data.wordAliases[wordId] ?? wordId]
			const fallbackId = original?.presetKey
				? `preset-${String(original.presetKey)}`
				: ((original && "libraryEntryId" in original
						? original.libraryEntryId
						: undefined) ??
					data.wordAliases[wordId] ??
					wordId)
			const capture: Capture = {
				id,
				wordId,
				sessionId: requireText(captureRecord.sessionId, "capture.sessionId"),
				cycle: requireNonnegativeNumber(captureRecord.cycle, "capture.cycle"),
				clientWordId:
					captureRecord.clientWordId === undefined
						? String(fallbackId)
						: requireText(captureRecord.clientWordId, "clientWordId"),
				parrotSpecies:
					captureRecord.parrotSpecies === undefined
						? (data.profile?.species ?? null)
						: readNullableText(captureRecord.parrotSpecies, "parrotSpecies"),
				parrotBirthdate:
					captureRecord.parrotBirthdate === undefined
						? (data.profile?.birthDate ?? null)
						: readNullableText(captureRecord.parrotBirthdate, "parrotBirthdate"),
				phase:
					captureRecord.phase === undefined
						? "learning"
						: requireChoice(
								captureRecord.phase,
								["learning", "rest"] as const,
								"phase",
							),
				capturedAt: requireText(captureRecord.capturedAt, "capturedAt"),
				uri: requireText(captureRecord.uri, "capture.uri"),
				fileName: requireText(captureRecord.fileName, "fileName"),
				sizeBytes: requireNonnegativeNumber(captureRecord.sizeBytes, "sizeBytes"),
				segments: requireList(captureRecord.segments, "segments").map((value) => {
					const segmentRecord = requireRecord(value, "segment")
					const startMs = requireNonnegativeNumber(segmentRecord.startMs, "startMs")
					const endMs = requireNonnegativeNumber(segmentRecord.endMs, "endMs")

					if (endMs < startMs) {
						throw new Error("Invalid speech interval")
					}

					return { startMs, endMs }
				}),
			}

			data.captures[id] = capture
		}
	}
}
