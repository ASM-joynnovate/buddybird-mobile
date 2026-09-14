import { File } from "expo-file-system"

import { resolveRecordingUri } from "@/services/media/uri"

export async function inspect(uri: string) {
	const file = new File(resolveRecordingUri(uri))

	if (!file.exists) {
		// exists=false also means inaccessible on some platforms; a successful parent
		// listing that omits the entry is required before treating it as absent.
		if (file.parentDirectory.list().some((entry) => entry.name === file.name)) {
			throw new Error("File is inaccessible")
		}

		return { exists: false, size: 0 }
	}

	const handle = file.open()

	try {
		handle.readBytes(1)

		return { exists: true, size: handle.size ?? file.size }
	} finally {
		handle.close()
	}
}
