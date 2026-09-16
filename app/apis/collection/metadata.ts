import type { Capture } from "@/types/capture"

export function codePoints(value: string, maximum: number) {
	return Array.from(value).slice(0, maximum).join("")
}

export function audioFile(uri: string) {
	const name = uri.split("?")[0].split("/").pop() || "reference-audio.m4a"
	const extension = name.split(".").pop()?.toLowerCase() ?? ""
	const types: Record<string, string> = {
		m4a: "audio/x-m4a",
		mp4: "audio/mp4",
		wav: "audio/wav",
		mp3: "audio/mpeg",
		aac: "audio/aac",
	}

	return { name, type: types[extension] ?? "application/octet-stream" }
}

export function captureMetadata(capture: Capture, appVersion: string) {
	if (capture.phase !== "learning" && capture.phase !== "rest") {
		throw new Error("Only learning and rest captures can be uploaded")
	}

	const timestamp = Date.parse(capture.capturedAt)

	return {
		client_capture_id: capture.id,
		client_word_id: capture.clientWordId || capture.wordId,
		client_session_id: capture.sessionId,
		cycle: capture.cycle,
		phase: capture.phase === "learning" ? "LE" : "RE",
		captured_at: Number.isFinite(timestamp)
			? new Date(timestamp).toISOString()
			: capture.capturedAt,
		file_name: capture.fileName,
		...(appVersion ? { app_version: codePoints(appVersion, 12) } : {}),
		...(capture.parrotSpecies ? { parrot_species: codePoints(capture.parrotSpecies, 50) } : {}),
		...(capture.parrotBirthdate ? { parrot_birthdate: capture.parrotBirthdate } : {}),
	}
}
