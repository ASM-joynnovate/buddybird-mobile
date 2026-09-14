import { randomUUID } from "expo-crypto"
import { Directory, File, Paths } from "expo-file-system"

import { resolveRecordingUri } from "@/services/media/uri"

export function captureDirectory() {
	const directory = new Directory(Paths.document, "recordings", "session-captures")

	directory.create({ idempotent: true, intermediates: true })

	return directory.uri
}

export async function preserveRecording(uri: string) {
	const directory = new Directory(Paths.document, "recordings")

	directory.create({ idempotent: true, intermediates: true })
	const source = new File(uri)
	const fileName = `recording-${randomUUID()}.${source.extension.replace(/^\./, "") || "m4a"}`
	const target = new File(directory, fileName)

	source.copy(target)

	if (!target.exists || target.size !== source.size) {
		throw new Error("Recording save failed")
	}

	return `recording://${fileName}`
}

export async function preservePhoto(uri: string, migrationId?: string) {
	const directory = new Directory(Paths.document, "photos")

	directory.create({ idempotent: true, intermediates: true })
	const source = new File(resolveRecordingUri(uri))
	const photoId = migrationId ? encodeURIComponent(migrationId) : randomUUID()
	const extension = source.extension.replace(/^\./, "") || "jpg"
	const fileName = `profile-${photoId}.${extension}`
	const target = new File(directory, fileName)

	if (target.exists && migrationId && target.size === source.size) {
		return `photo://${fileName}`
	}

	if (target.exists && migrationId) {
		target.delete()
	}

	source.copy(target)

	if (!target.exists || target.size !== source.size) {
		throw new Error("Photo save failed")
	}

	return `photo://${fileName}`
}
